# Lumina

Lumina is a free learning platform with an AI tutor, generated lessons, quizzes,
flashcards, learning paths, knowledge maps, a JavaScript playground, and learner
progress.

## Stack

- Next.js 16 and React 19
- Prisma with Supabase Postgres
- Zustand and Tailwind CSS
- NVIDIA API Catalog (OpenAI-compatible hosted NIM endpoint)

## Local setup

1. Install Bun 1.3.4 or newer.
2. Copy `.env.example` to `.env.local`.
3. Create a Supabase project and copy its connection strings into:
   - `DATABASE_URL`: pooled runtime connection.
   - `DIRECT_URL`: direct migration connection.
4. Copy the Supabase Project URL and publishable key into
   `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.
5. Set a random `LUMINA_SESSION_SECRET` with at least 32 characters.
6. Create a free key at [build.nvidia.com](https://build.nvidia.com/) and set
   `NVIDIA_API_KEY`.
7. Run:

```powershell
bun install
bun run db:generate
bun run db:deploy
bun run dev
```

The initial migration creates all application tables. The old local SQLite
database was development-only and is not part of the Supabase migration.
Vercel builds automatically run `prisma migrate deploy` before compiling the app.

## Accounts and Google sign-in

Lumina uses Supabase Auth for email/password and Google OAuth. Guest progress is
linked to the same application user when the learner creates an account.

1. In Supabase Authentication > URL Configuration, set the production Site URL
   and allow `https://YOUR_DOMAIN/auth/callback` plus
   `http://localhost:3000/auth/callback` for local development.
2. In Google Auth Platform, create a Web application OAuth client. Add the app
   domains as Authorized JavaScript origins and add
   `https://PROJECT_REF.supabase.co/auth/v1/callback` as the Authorized redirect
   URI.
3. In Supabase Authentication > Providers > Google, enable Google and paste the
   Google Client ID and Client Secret.
4. Add the two `NEXT_PUBLIC_SUPABASE_*` variables to Vercel for Production and
   Preview, then redeploy.

## NVIDIA AI

Lumina uses NVIDIA's hosted OpenAI-compatible endpoint. Configure:

```dotenv
NVIDIA_API_KEY="nvapi-..."
NVIDIA_BASE_URL="https://integrate.api.nvidia.com/v1"
```

`NVIDIA_BASE_URL` is an optional override. The application uses
`nvidia/nemotron-3-super-120b-a12b` for content generation. When Armenian is
selected, `google/gemma-4-31b-it` translates Nemotron's complete English draft
into Eastern Armenian while preserving structured JSON, Markdown, formulas,
and code. Both models use the same NVIDIA endpoint and `NVIDIA_API_KEY`; no
second provider key is required. Lesson narration uses the browser's built-in
speech synthesis and does not require an API call.

## Quality checks

```powershell
bun run lint
bun run typecheck
bun run test
bun run build
```

Production uses Next.js standalone output. The build script copies `public` and
`.next/static` into the standalone directory, then `bun run start` launches it.

## Anonymous users

Learners do not need an account. Their generated user ID is stored in a signed,
HTTP-only cookie. Registering links the verified Supabase identity to that user
row, preserving progress. Set a stable production session secret; changing it
creates a new anonymous identity for returning learners.
