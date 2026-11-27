import { McpServer, type ToolCallback } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { kind, page, requestId, taskFields, transactionFields } from '@/lib/validations/mcp';
import { invokeApi, taskApis, moneyApis, timeApis } from './api';
import type { McpIdentity } from './auth';
import { getUserTimezone, todayIn } from '@/lib/user-time';

export function createMcpServer(identity: McpIdentity) {
  const server = new McpServer({ name: 'selfup', version: '1.0.0' }, {
    instructions: 'Manage the connected user\'s SelfUp tasks, habits, money and focus time. Ask before deleting records or changing financial data. Reuse request_id only for identical retries. Dates and scheduled times use the user\'s timezone. List tools expose stored records; daily due/paused status should be checked in the app.',
  });
  function tool<S extends z.ZodRawShape>(name: string, description: string, shape: S,
    readOnly: boolean, run: (args: z.output<z.ZodObject<S>>) => Promise<unknown>, destructive = false) {
    const callback = async (args: unknown) => {
      try {
        const result = await run(z.object(shape).strict().parse(args));
        return { content: [{ type: 'text' as const, text: JSON.stringify(result) }] };
      } catch (error) {
        return { isError: true, content: [{ type: 'text' as const, text: error instanceof Error ? error.message : 'SelfUp operation failed' }] };
      }
    };
    server.registerTool<z.ZodRawShape, S>(name, {
      description, inputSchema: shape,
      annotations: { readOnlyHint: readOnly, destructiveHint: destructive, idempotentHint: true, openWorldHint: false },
    }, callback as ToolCallback<S>);
  }

  tool('get_context', 'Read the connected user timezone and current local date before planning schedules or recording dates.', {}, true, async () => {
    const timezone = await getUserTimezone(identity.db, identity.user.id);
    return { timezone, today: todayIn(timezone) };
  });

  tool('list_records', 'List stored tasks, habits, dailies, transactions, categories or focus sessions with pagination. Account balances are available through list_accounts.', {
    collection: z.enum(['todos', 'dailies', 'habits', 'money_transactions', 'money_categories', 'pomodoro_sessions']),
    ...page,
  }, true, async ({ collection, offset, limit }) => {
    let query = identity.db.from(collection).select('*', { count: 'exact' });
    // Global money categories are intentionally visible under their existing RLS.
    if (collection !== 'money_categories') query = query.eq('user_id', identity.user.id);
    const { data, error, count } = await query.order('id').range(offset, offset + limit - 1);
    if (error) throw new Error(error.message);
    return { data, total: count, offset, limit };
  });

  for (const taskKind of ['todo', 'daily', 'habit'] as const) {
    const api = taskApis[taskKind];
    tool(`create_${taskKind}`, `Create a ${taskKind}. Scheduled times are HH:mm in the user's timezone.`, {
      request_id: requestId, fields: taskFields[taskKind],
    }, false, ({ request_id, fields }) => invokeApi(identity, api.create, api.path, 'POST', { ...fields, id: request_id }, request_id));
    tool(`update_${taskKind}`, `Edit a ${taskKind}, including its scheduled start/end time. Supply only changed fields.`, {
      request_id: requestId, id: z.uuid(), fields: taskFields[taskKind].partial(),
    }, false, ({ request_id, id, fields }) => {
      if (Object.keys(fields).length === 0) throw new Error('At least one field is required');
      return invokeApi(identity, api.update, `${api.path}/${id}`, 'PATCH', fields, request_id, id);
    });
  }
  tool('complete_task', 'Complete a todo or daily, or log a habit. Uses the existing XP and streak rules.', {
    request_id: requestId, kind, id: z.uuid(), date: z.iso.date().optional(), notes: z.string().max(5000).optional(),
  }, false, ({ request_id, kind: taskKind, id, ...body }) => {
    const api = taskApis[taskKind];
    return invokeApi(identity, api.complete, `${api.path}/${id}/${taskKind === 'habit' ? 'log' : 'complete'}`, 'POST', body, request_id, id);
  });
  tool('delete_task', 'Permanently delete a todo, daily or habit. Confirm the record with the user first.', {
    request_id: requestId, kind, id: z.uuid(),
  }, false, ({ request_id, kind: taskKind, id }) => {
    const api = taskApis[taskKind];
    return invokeApi(identity, api.delete, `${api.path}/${id}`, 'DELETE', {}, request_id, id);
  }, true);

  tool('list_accounts', 'List accounts with balances computed by SelfUp. Paginated response.', { ...page }, true, async ({ offset, limit }) => {
    const result = await invokeApi(identity, moneyApis.accounts, 'money/accounts', 'GET');
    return { data: result.data.slice(offset, offset + limit), total: result.data.length, offset, limit };
  });
  tool('money_summary', 'Read the existing monthly money summary.', {
    month: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])-01$/).describe('First day of the month, YYYY-MM-01'),
  }, true, ({ month }) => invokeApi(identity, moneyApis.summary, `money/summary?month=${month}`, 'GET'));
  tool('create_transaction', 'Record income, expense or transfer. Amounts must be positive. Confirm financial details with the user first.', {
    request_id: requestId, fields: transactionFields,
  }, false, ({ request_id, fields }) => invokeApi(identity, moneyApis.create, 'money/transactions', 'POST', { ...fields, id: request_id }, request_id));
  tool('update_transaction', 'Replace transaction details with a complete set of corrected values. Confirm financial details first.', {
    request_id: requestId, id: z.uuid(), fields: transactionFields,
  }, false, ({ request_id, id, fields }) => invokeApi(identity, moneyApis.update, `money/transactions/${id}`, 'PATCH', {
    ...fields, account_id: fields.account_id ?? null,
    to_account_id: fields.type === 'transfer' ? fields.to_account_id : null,
    category_id: fields.type === 'transfer' ? null : fields.category_id ?? null,
  }, request_id, id), true);
  tool('delete_transaction', 'Permanently delete a transaction. Confirm with the user first.', {
    request_id: requestId, id: z.uuid(),
  }, false, ({ request_id, id }) => invokeApi(identity, moneyApis.delete, `money/transactions/${id}`, 'DELETE', {}, request_id, id), true);
  tool('start_focus', 'Start a Pomodoro focus session. Cancels any currently active session.', {
    request_id: requestId, task_id: z.uuid().optional(),
    duration_minutes: z.number().int().min(1).max(180).default(25), break_minutes: z.number().int().min(0).max(60).default(5),
  }, false, ({ request_id, ...body }) => invokeApi(identity, timeApis.start, 'pomodoro', 'POST', { ...body, id: request_id }, request_id), true);
  tool('finish_focus', 'Complete or cancel a focus session. Completion awards XP using SelfUp rules.', {
    request_id: requestId, session_id: z.uuid(), action: z.enum(['complete', 'cancel']),
  }, false, ({ request_id, ...body }) => invokeApi(identity, timeApis.finish, 'pomodoro', 'PATCH', body, request_id));
  return server;
}
