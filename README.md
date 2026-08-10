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
4. Set a random `LUMINA_SESSION_SECRET` with at least 32 characters.
5. Create a free key at [build.nvidia.com](https://build.nvidia.com/) and set
   `NVIDIA_API_KEY`.
6. Run:

```powershell
bun install
bun run db:generate
bun run db:deploy
bun run dev
```

The initial migration creates all application tables. The old local SQLite
database was development-only and is not part of the Supabase migration.
Vercel builds automatically run `prisma migrate deploy` before compiling the app.

## NVIDIA AI

Lumina uses NVIDIA's hosted OpenAI-compatible endpoint. Configure:

```dotenv
NVIDIA_API_KEY="nvapi-..."
NVIDIA_BASE_URL="https://integrate.api.nvidia.com/v1"
```

`NVIDIA_BASE_URL` is an optional override. The application uses
`nvidia/nemotron-3-super-120b-a12b` for content generation. When Armenian is
selected, `qwen/qwen3-next-80b-a3b-instruct` translates Nemotron's complete
draft while preserving structured JSON, Markdown, formulas, and code. Both
models use the same `NVIDIA_API_KEY`. Lesson narration uses the browser's
built-in speech synthesis and does not require an API call.

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
