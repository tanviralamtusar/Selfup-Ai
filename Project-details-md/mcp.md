# SelfUp MCP with OAuth

Added 2026-11-27. The Next.js app hosts a stateless Streamable HTTP MCP server at
`https://selfup.botbhai.net/api/mcp`. No separate server process or Redis is needed.

## Enable in production

1. Deploy this branch's website changes through the normal review/deployment flow.
   Set `NEXT_PUBLIC_APP_URL=https://selfup.botbhai.net` in the build environment.
2. In Supabase project `qpfdxyskjirdmkayuvly`, open **Authentication > OAuth Server**
   and enable the OAuth server. Set the authorization path to `/oauth/consent`.
   The **Authentication > URL Configuration > Site URL** must be
   `https://selfup.botbhai.net`. Allow
   `https://selfup.botbhai.net/oauth/consent` in redirect URLs for Google sign-in.
3. Run `web/scripts/migrations/20261127_mcp_oauth_audience.sql` in the SQL editor.
   Under **Authentication > Hooks > Custom Access Token Hook**, select
   `private.selfup_oauth_access_token_hook`. If a hook already exists, merge the
   audience logic into that hook instead of replacing its behavior.
   This step is required: MCP rejects ordinary login tokens and OAuth tokens
   without the exact MCP resource in their verified audience.
4. Register each intended MCP client in the OAuth Server dashboard with its exact
   callback URI and supported client authentication method. Public desktop clients
   use PKCE with no client secret. Alternatively enable dynamic registration when
   clients need to register themselves. Supabase owns code exchange, PKCE,
   refresh-token rotation and client registration; the app does not implement these.
5. Add an HTTP MCP connection in the chosen client using
   `https://selfup.botbhai.net/api/mcp` and select OAuth. Supply the registered
   client ID/secret if that client requires manual registration. Sign in with an
   existing SelfUp account and review **Allow access / Deny**.
6. Verify discovery, consent denial, successful consent, tools/list, a harmless
   list_records call, refresh, and disconnect in the actual MCP client before
   treating the integration as enabled. These live checks require the dashboard
   settings above and cannot be replaced by local unit tests.

The SQL function can be verified without relying on migration history:

```sql
select routine_schema, routine_name
from information_schema.routines
where routine_schema = 'private'
  and routine_name = 'selfup_oauth_access_token_hook';

-- This synthetic event should gain the MCP audience.
select private.selfup_oauth_access_token_hook(
  '{"client_id":"test-client","claims":{"sub":"test-user","aud":"authenticated"}}'::jsonb
);

-- Direct logins should retain their existing audience.
select private.selfup_oauth_access_token_hook(
  '{"claims":{"aud":"authenticated"}}'::jsonb
);
```

The hook marks **all OAuth clients in this project** as targeting SelfUp. This
configuration assumes the project is an authorization provider for SelfUp only.
If it also issues tokens for other APIs, use a client-ID-to-audience mapping in
the hook so those clients do not receive the SelfUp audience. Preserve
`authenticated` alongside the MCP audience for the existing Supabase APIs.

## Discovery and security

- Public resource metadata: `/.well-known/oauth-protected-resource/api/mcp`
  (also available at `/.well-known/oauth-protected-resource`).
- Authorization server issuer: `https://qpfdxyskjirdmkayuvly.supabase.co/auth/v1`.
  Its RFC 8414 discovery document is hosted by Supabase at
  `https://qpfdxyskjirdmkayuvly.supabase.co/.well-known/oauth-authorization-server/auth/v1`.
- Unauthenticated MCP requests receive HTTP 401 with a `WWW-Authenticate` link.
  Requests require both `verifyAuth()` and Supabase-verified claims with a matching
  subject, issuer, OAuth `client_id`, and exact MCP audience.
- Each request gets a new MCP server/transport and user-scoped Supabase client.
  Reads use RLS plus explicit user ownership; global money categories retain their
  existing visibility. Mutation adapters invoke the existing API handlers in-process.
  No token is forwarded to an external URL and no service-role credential is used.
- Browser origins default to the app origin. Add explicit additional origins with
  `MCP_ALLOWED_ORIGINS` only if required by a browser client. Native/server clients
  normally send no Origin header. Metadata itself is publicly discoverable.
- OAuth consent grants account access under the existing database permissions.
  Supabase identity scopes do **not** limit table access. This implementation does
  not promise per-module or read-only grants, and the consent screen says so.
- Connected apps can be revoked at `/settings/connections`, linked from Settings.
  Revocation stops refresh; an issued access token can remain valid until expiry.
- POST bodies are limited to 256 KiB. GET/DELETE return 405 after authentication;
  the server uses JSON responses and does not maintain an SSE connection/session.

## Tools

| Tools | Behavior |
| --- | --- |
| `get_context` | The user's timezone and today's local date |
| `list_records` | Paginated todos, dailies, habits, transactions, money categories, focus sessions; default 20, maximum 100 |
| `create_todo`, `update_todo` | Create/edit tasks and scheduled times |
| `create_daily`, `update_daily` | Create/edit recurring dailies and scheduled times |
| `create_habit`, `update_habit` | Create/edit habits and scheduled times |
| `complete_task`, `delete_task` | Complete/log or delete a todo, daily or habit |
| `list_accounts`, `money_summary` | Computed balances and monthly money summary |
| `create_transaction`, `update_transaction`, `delete_transaction` | Manage income, expense and transfers; amounts are positive |
| `start_focus`, `finish_focus` | Start a Pomodoro, or complete/cancel a session |

Time management uses the existing task schedule fields and Pomodoro sessions;
there is no independent calendar-event CRUD tool. Financial account/category
creation, budgets, goals, recurring transactions and automatic scheduling are
not exposed in this initial tool set.

`list_records` returns stored records, including completed/expired/paused ones;
it does not run daily reset or compute today's daily visibility. Existing web
daily-reset behavior remains unchanged. Scheduled times are in the user's zone;
completion dates are `YYYY-MM-DD` and follow the existing offline-date rules.

All mutations require a UUID `request_id`. Keep it unchanged only for identical
retries; use a new UUID for each intended action. Creates also use it as the row
ID. API idempotency uses the existing `sync_idempotency` table and migration;
ensure that existing mobile-sync migration is applied. XP, streak and balance
behavior stays in the existing handlers/services. Transaction updates require a
complete replacement field set; other edit tools accept changed fields only.

## Local verification

From `web/`:

```powershell
npx tsx --test scripts/tests/mcp.test.ts
npm run lint
npm run build
```

For a separate local Supabase project, configure its Site URL/authorization path
and change the SQL hook's resource audience to match the local
`NEXT_PUBLIC_APP_URL` plus `/api/mcp`. Do not change the production hook merely to
test localhost. The endpoint permits HTTP only on localhost/127.0.0.1.

References: [Supabase MCP authentication](https://supabase.com/docs/guides/auth/oauth-server/mcp-authentication),
[OAuth setup](https://supabase.com/docs/guides/auth/oauth-server/getting-started),
[token security and RLS](https://supabase.com/docs/guides/auth/oauth-server/token-security).
