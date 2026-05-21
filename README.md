# personalHub

Personal OS dashboard for Dylan. Current scope:

- Next.js on Render
- Supabase Auth/Postgres-ready foundation
- OpenAI-only future AI integration
- Placeholder cards for Operator, Session, Calendar, Habits, and Finance
- No Telegram or Anthropic integration at this stage
- Apple Calendar is modeled as a per-user integration, not a deployment-wide env var

## Supabase schema

Apply `supabase/schema.sql` to a Supabase project. The schema uses dedicated tables for durable records:

- `tasks`
- `calendar_events`
- `habit_definitions`
- `habit_entries`
- `finance_snapshots`
- future `journal_entries`, `notes`, and `decisions`
- `user_integrations` for per-user Apple Calendar/manual finance/OpenAI connection metadata
- `memory_chunks` with `pgvector` for later OpenAI embeddings

The app falls back to placeholder data when Supabase env vars are not present.

Sensitive per-user integration secrets should be stored in Supabase Vault and referenced from
`user_integrations.vault_secret_id`. Non-secret Apple public calendar links are stored in
`user_integrations.public_config` for the owning user. Users can add multiple Apple Calendar feeds,
for example separate personal and shared calendars; dashboard calendar data is merged per user.

## Auth setup

The current auth UI uses Supabase email/password sign up and sign in.

In Supabase:

1. Open Authentication > Providers > Email.
2. Enable Email provider.
3. Enable Confirm email if you want users to verify email before first sign in.
4. Set Site URL to your deployed Render URL, for example `https://<your-render-domain>`.
5. Add your app URLs to Supabase Auth redirect URLs, for example:
   - `http://localhost:3000/auth/callback`
   - `https://<your-render-domain>/auth/callback`

If email confirmation links redirect to localhost, the Supabase Auth Site URL is still set to localhost
or the deployed app is missing `NEXT_PUBLIC_SITE_URL`.

Apple sign-in is intentionally disabled for now. Sign in with Apple for a web app requires Apple
Developer setup: a Services ID, Team ID, Key ID, private key, and Apple return URL configuration.

## Render deployment

This app is configured for Render with `render.yaml`.

1. Push this repository to GitHub, GitLab, or Bitbucket.
2. In Render, create a new Blueprint and select this repository.
3. Review the `personal-hub` web service settings.
4. Add the required environment variables when Render prompts for them:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SITE_URL`
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` or `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SECRET_KEY` or `SUPABASE_SERVICE_ROLE_KEY`
   - `USER_ID`
   - `USER_TIMEZONE`
   - `OPENAI_API_KEY`
5. Add these later when the matching integrations are implemented:
   - no calendar URL env var is needed; Apple Calendar access is saved per user from Settings
6. Deploy.

The Render Blueprint uses:

- Build command: `npm run render:build`
- Start command: `npm run render:start`
- Node version: `24.14.1`

For a manual Render web service setup, choose the Node runtime and use the same build and start commands above.
