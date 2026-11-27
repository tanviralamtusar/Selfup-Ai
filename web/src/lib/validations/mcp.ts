import { z } from 'zod';

export const kind = z.enum(['todo', 'daily', 'habit']);
export const page = { offset: z.number().int().min(0).max(100000).default(0), limit: z.number().int().min(1).max(100).default(20) };
export const requestId = z.uuid().describe('Unique UUID for this operation. Reuse it only when retrying the same operation with identical arguments.');
const title = z.string().trim().min(1).max(100);
const time = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/).nullable().optional();
const priority = z.enum(['low', 'medium', 'high', 'critical']).optional();
const base = {
  title, description: z.string().max(5000).nullable().optional(),
  category: z.string().trim().min(1).max(50).optional(),
  scheduled_time: time, end_time: time,
};
export const taskFields = {
  todo: z.object({ ...base, priority, due_date: z.iso.date().nullable().optional() }).strict(),
  daily: z.object({ ...base, priority, repeat_type: z.enum(['daily', 'weekly']).optional(),
    repeat_days: z.array(z.enum(['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'])).min(1).max(7).optional(), expires_on: z.iso.date().nullable().optional() }).strict(),
  habit: z.object({ ...base, reset_type: z.enum(['daily', 'weekly', 'monthly']).optional(),
    difficulty: z.enum(['trivial', 'easy', 'medium', 'hard']).optional(),
    is_positive: z.boolean().optional(), is_negative: z.boolean().optional(),
    is_indefinite: z.boolean().optional(), end_date: z.iso.date().nullable().optional() }).strict(),
};
export const transactionFields = z.object({
  type: z.enum(['income', 'expense', 'transfer']), amount: z.number().finite().positive().max(1e12),
  currency: z.string().regex(/^[A-Z]{3}$/),
  account_id: z.uuid().nullable().optional(), to_account_id: z.uuid().nullable().optional(),
  category_id: z.uuid().nullable().optional(), note: z.string().max(5000).nullable().optional(),
  occurred_at: z.iso.date(),
}).strict().superRefine((v, ctx) => {
  if (v.type === 'transfer' && (!v.account_id || !v.to_account_id || v.account_id === v.to_account_id)) {
    ctx.addIssue({ code: 'custom', message: 'Transfers require distinct source and destination accounts' });
  }
});
