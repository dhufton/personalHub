# personalHub

Personal OS dashboard for Dylan. Current scope:

- Next.js on Render
- Supabase Auth/Postgres-ready foundation
- OpenAI-only future AI integration
- Placeholder cards for Operator, Session, Calendar, Habits, and Finance
- No Telegram or Anthropic integration at this stage

## Supabase schema

Apply `supabase/schema.sql` to a Supabase project. The schema uses dedicated tables for durable records:

- `tasks`
- `calendar_events`
- `habit_definitions`
- `habit_entries`
- `finance_snapshots`
- future `journal_entries`, `notes`, and `decisions`
- `memory_chunks` with `pgvector` for later OpenAI embeddings

The app falls back to placeholder data when Supabase env vars are not present.

## Render deployment

This app is configured for Render with `render.yaml`.

1. Push this repository to GitHub, GitLab, or Bitbucket.
2. In Render, create a new Blueprint and select this repository.
3. Review the `personal-hub` web service settings.
4. Add the required environment variables when Render prompts for them:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` or `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SECRET_KEY` or `SUPABASE_SERVICE_ROLE_KEY`
   - `USER_ID`
   - `USER_TIMEZONE`
   - `OPENAI_API_KEY`
5. Add these later when the matching integrations are implemented:
   - `GOOGLE_CALENDAR_ICAL_URL`
   - `GOOGLE_SHEETS_FINANCE_ID`
   - `GOOGLE_SERVICE_ACCOUNT_EMAIL`
   - `GOOGLE_SERVICE_ACCOUNT_KEY`
6. Deploy.

The Render Blueprint uses:

- Build command: `npm run render:build`
- Start command: `npm run render:start`
- Node version: `24.14.1`

For a manual Render web service setup, choose the Node runtime and use the same build and start commands above.
