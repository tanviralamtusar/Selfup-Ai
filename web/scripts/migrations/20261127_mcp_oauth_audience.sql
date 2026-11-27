-- Apply in the Supabase SQL editor, then select this function under
-- Authentication > Hooks > Custom Access Token Hook. Preserve/merge any
-- existing token hook before enabling this one.
-- Change BOTH the URL below and NEXT_PUBLIC_APP_URL if the app domain changes.
CREATE SCHEMA IF NOT EXISTS private;

CREATE OR REPLACE FUNCTION private.selfup_oauth_access_token_hook(event jsonb)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SET search_path = ''
AS $$
DECLARE
  claims jsonb := event -> 'claims';
BEGIN
  -- Direct web/mobile sessions retain their existing audience.
  IF COALESCE(event ->> 'client_id', claims ->> 'client_id', '') <> '' THEN
    claims := jsonb_set(claims, '{aud}',
      '["authenticated", "https://selfup.botbhai.net/api/mcp"]'::jsonb);
    event := jsonb_set(event, '{claims}', claims);
  END IF;
  RETURN event;
END;
$$;

REVOKE ALL ON FUNCTION private.selfup_oauth_access_token_hook(jsonb) FROM PUBLIC, anon, authenticated;
GRANT USAGE ON SCHEMA private TO supabase_auth_admin;
GRANT EXECUTE ON FUNCTION private.selfup_oauth_access_token_hook(jsonb) TO supabase_auth_admin;
