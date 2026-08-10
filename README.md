# Lumina

Lumina is a free learning platform with an AI tutor, generated lessons, quizzes,
flashcards, learning paths, knowledge maps, a JavaScript playground, and learner
progress.

## Stack

- Next.js 16 and React 19
- Prisma with Supabase Postgres
- Zustand and Tailwind CSS
- `z-ai-web-dev-sdk` or an OpenAI-compatible text API

## Local setup

1. Install Bun 1.3.4 or newer.
2. Copy `.env.example` to `.env.local`.
3. Create a Supabase project and copy its connection strings into:
   - `DATABASE_URL`: pooled runtime connection.
   - `DIRECT_URL`: direct migration connection.
4. Set a random `LUMINA_SESSION_SECRET` with at least 32 characters.
5. Run:

```powershell
bun install
bun run db:generate
bun run db:deploy
bun run dev
```

The initial migration creates all application tables. The old local SQLite
database was development-only and is not part of the Supabase migration.

## AI providers

The default `AI_PROVIDER=zai` keeps compatibility with the original runtime.
For a free OpenAI-compatible text provider, configure:

```dotenv
AI_PROVIDER="openai-compatible"
AI_BASE_URL="https://provider.example/v1"
AI_API_KEY="..."
AI_MODEL="..."
```

Image generation and speech currently use `z-ai-web-dev-sdk`. They should be
connected separately after choosing providers that support those modalities.

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
HTTP-only cookie. Set a stable production session secret; changing it creates a
new anonymous identity for returning learners.
