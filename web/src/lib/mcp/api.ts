// In-process adapters keep MCP mutations on the same authenticated, idempotent
// code paths as web/mobile without forwarding tokens over the network.
import { NextRequest } from 'next/server';
import { createHash } from 'node:crypto';
import * as todos from '@/app/api/todos/route';
import * as todo from '@/app/api/todos/[id]/route';
import * as completeTodo from '@/app/api/todos/[id]/complete/route';
import * as habits from '@/app/api/habits/route';
import * as habit from '@/app/api/habits/[id]/route';
import * as logHabit from '@/app/api/habits/[id]/log/route';
import * as dailies from '@/app/api/dailies/route';
import * as daily from '@/app/api/dailies/[id]/route';
import * as completeDaily from '@/app/api/dailies/[id]/complete/route';
import * as transactions from '@/app/api/money/transactions/route';
import * as transaction from '@/app/api/money/transactions/[id]/route';
import * as accounts from '@/app/api/money/accounts/route';
import * as summary from '@/app/api/money/summary/route';
import * as pomodoro from '@/app/api/pomodoro/route';
import type { McpIdentity } from './auth';

type Context = { params: Promise<{ id: string }> };
type Handler = (req: NextRequest, ctx: Context) => Promise<Response>;
export const taskApis = {
  todo: { create: todos.POST, update: todo.PATCH, delete: todo.DELETE, complete: completeTodo.POST, path: 'todos' },
  habit: { create: habits.POST, update: habit.PATCH, delete: habit.DELETE, complete: logHabit.POST, path: 'habits' },
  daily: { create: dailies.POST, update: daily.PATCH, delete: daily.DELETE, complete: completeDaily.POST, path: 'dailies' },
};
export const moneyApis = { create: transactions.POST, update: transaction.PATCH, delete: transaction.DELETE, accounts: accounts.GET, summary: summary.GET };
export const timeApis = { start: pomodoro.POST, finish: pomodoro.PATCH };

export async function invokeApi(identity: McpIdentity, handler: Handler, path: string, method: string,
  body: Record<string, unknown> = {}, requestId?: string, id = '') {
  // Referenced records must also belong to this user, not merely pass a FK check.
  for (const [field, table] of Object.entries({ account_id: 'money_accounts', to_account_id: 'money_accounts', category_id: 'money_categories', task_id: 'todos' })) {
    const value = body[field];
    if (typeof value !== 'string') continue;
    let query = identity.db.from(table).select('user_id').eq('id', value);
    if (field !== 'category_id') query = query.eq('user_id', identity.user.id);
    const { data, error } = await query.maybeSingle();
    if (error || !data || (data.user_id !== identity.user.id && !(field === 'category_id' && data.user_id === null))) {
      throw new Error(`Invalid or inaccessible ${field}`);
    }
  }
  const headers = new Headers({ Authorization: `Bearer ${identity.token}`, 'Content-Type': 'application/json' });
  if (requestId) headers.set('Idempotency-Key', `mcp:${createHash('sha256').update(`${method}:${path}:${requestId}`).digest('hex')}`);
  const req = new NextRequest(`http://localhost/api/${path}`, {
    method, headers, ...(method === 'GET' ? {} : { body: JSON.stringify(body) }),
  });
  const response = await handler(req, { params: Promise.resolve({ id }) });
  const result = await response.json();
  if (!response.ok) throw new Error(typeof result.error === 'string' ? result.error : `SelfUp API returned ${response.status}`);
  return result;
}
