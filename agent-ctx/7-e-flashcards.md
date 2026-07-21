# Task 7-e — Flashcards View

**Agent**: flashcards-view-agent (Z.ai Code)
**File**: `src/components/views/flashcards-view.tsx` (overwritten stub)
**Status**: ✅ Complete

## What was built

A full spaced-repetition flashcard study experience in one client component, with three modes:

### 1. Generate mode
- SectionHeader + SM-2 Pill badge
- **Due-for-review banner** (gradient GlassCard): "У тебя N карточек на повторение" + Повторить button → starts a review session of due cards (from GET /api/flashcards?limit=50).
- Topic input (Enter submits) + gradient "Создать карты" button.
- Subject chips — all 8 SUBJECTS with emoji; active chip uses the subject's gradient.
- Count selector: 5 / 8 / 12 / 20.
- 8 suggested-topic chips (each sets subject + triggers generate).
- "How it works" 3-step strip.
- Loading / EmptyState fallbacks.

### 2. Review mode (`ReviewSession` subcomponent)
- **3D flip card**: outer `perspective: 1400` wrapper + inner `motion.div` animating `rotateY: 0↔180`, `transformStyle: preserve-3d`. Front face = question (GlassCard + grid + glow), back face = answer (violet→fuchsia→pink gradient). Both faces `position: absolute`, `backfaceVisibility: hidden`; back is pre-rotated `rotateY(180deg)`.
- **Card transition**: `AnimatePresence mode="wait"` with custom direction → smooth slide (x ±60, opacity, scale) between cards.
- Top bar: exit button, source pill (Повторение / Новые), "N / M" counter with gradient number.
- Animated gradient progress bar tracking current index.
- Trash button on both faces → DELETE /api/flashcards/[id], removes card from session without counting as reviewed.
- Quality buttons (revealed only after flip): Снова (rose) / Трудно (amber) / Хорошо (emerald) / Легко (teal) — gradient bg, glow shadow, kbd hint, calls PATCH /api/flashcards/[id] with quality.
- After submit: flip back → 220ms delay → advance; last card → complete mode.

### 3. Completion screen
- Spring-animated check badge, "Сессия завершена!" gradient headline, reviewed-count + XP-gained stat tiles, "Создать ещё" + "На главную" buttons.

### Keyboard
- Window keydown listener active only in review mode.
- `Space` flips; `1`/`2`/`3`/`4` fire quality submit.
- Uses refs (`submitRef`, `flipRef`) to avoid stale closures.
- Ignores keys when focus is in INPUT/TEXTAREA/contentEditable.

### Integration
- `useUser.setState({ xp, level })` synced after POST /api/flashcards and PATCH /api/flashcards/[id].
- After generation, re-fetches GET /api/flashcards (newly created cards default `dueAt = now()` so they're immediately due) and matches by front text to obtain persisted ids for PATCH. Falls back to no-id cards (PATCH skipped) if matching fails.
- Prefills subject from `useNav().activeSubject` when valid.
- Russian pluralization helper for "карточка/карточки/карточек".

## Verification
- `npx eslint src/components/views/flashcards-view.tsx` → **0 errors, 0 warnings**.
- `bun run lint` shows only pre-existing errors in `app-shell.tsx` and `use-user-sync.ts` (unrelated to this task).

## Notes for downstream agents
- The view assumes `/api/flashcards` POST response shape `{cards:[{front,back}], xp, level}` (no ids) — handled via refetch.
- The `quality` values sent to PATCH are exactly `'again' | 'hard' | 'good' | 'easy'` per the API contract.
- Color palette stays strictly within violet/fuchsia/pink + per-quality accents (rose/amber/emerald/teal) — no indigo/blue as primary.
