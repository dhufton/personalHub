# personalHub

## Render deployment

This app is configured for Render with `render.yaml`.

1. Push this repository to GitHub, GitLab, or Bitbucket.
2. In Render, create a new Blueprint and select this repository.
3. Review the `personal-hub` web service settings.
4. Add the required environment variables when Render prompts for them:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
5. Deploy.

The Render Blueprint uses:

- Build command: `npm run render:build`
- Start command: `npm run render:start`
- Node version: `24.14.1`

For a manual Render web service setup, choose the Node runtime and use the same build and start commands above.
