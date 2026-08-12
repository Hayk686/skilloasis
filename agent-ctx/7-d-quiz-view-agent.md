# Task 7-d — QuizView Agent

**Task ID:** 7-d
**Agent:** quiz-view-agent
**Task:** Implement `/home/z/my-project/src/components/views/quiz-view.tsx` — a stunning, gamified adaptive quiz experience for the Info Oasis platform.

## Context reviewed
- `worklog.md` — design system (dark cosmic theme, violet/fuchsia/pink gradients, NO indigo/blue primary), available stores (`useNav`, `useUser`), API contracts (`POST /api/quiz` generate, `PUT /api/quiz` submit).
- `src/components/ui-blocks.tsx` — `PageSection`, `SectionHeader`, `GlassCard`, `LoadingState`, `EmptyState`, `GradientButton`, `Pill`, `StaggerGroup`, `StaggerItem`.
- `src/components/aurora.tsx` — `AuroraBackground`, `Particles` (available, not directly used here — view is rendered inside app shell that already provides cosmic bg).
- `src/lib/store.ts` — `useUser.setState({ xp, level })` used to update XP/level after PUT response.
- `src/lib/subjects.ts` — `SUBJECTS` catalogue + `getSubject(id)` for dynamic suggested topics.
- `src/app/api/quiz/route.ts` — confirmed POST/PUT contracts and `xpGain = correct*10 + (perfect?20:0)`.

## Implementation

Single-file implementation in `src/components/views/quiz-view.tsx` (~770 lines), with named export `QuizView`. No new routes, no tests.

### Phases (state machine)
`phase: 'setup' | 'loading' | 'quiz' | 'results'` driven by `AnimatePresence mode="wait"`.

### 1. Setup phase
- Two-column grid (`lg:grid-cols-[1.2fr_1fr]`): left = form GlassCard, right = "Как это работает?" info card with motivation pills (+10 XP / +20 XP).
- Subject chips: 8 `SUBJECTS` rendered as selectable pill buttons (emoji + ru label). Active = `border-primary bg-primary/15 text-primary`.
- Topic text input (Enter triggers start), with dynamic suggested topic chips pulled from `getSubject(subject).topics` (or fallback list). Each chip has a hover-revealed `ChevronRight`.
- Count selector: `3 / 5 / 10 / 15` segmented toggle.
- Level selector: `Любой / Новичок / Средний / Продвинутый` segmented toggle. `'Любой'` → API gets `level: undefined`.
- Big gradient `GradientButton` "Начать квиз" (full-width, larger padding).

### 2. Loading phase
`QuizSkeleton` — shimmering pulse mock of the quiz layout (progress bar, difficulty badge, question line, 4 option rows, button).

### 3. Quiz phase
- Top bar: back/exit `ArrowLeft` button (aria-label), `Вопрос X из N`, score `Trophy` pill, elapsed `Clock` pill (mm:ss).
- shadcn `Progress` bar reflects answered/addressed count.
- Per-question card uses `AnimatePresence mode="wait"` with `x: 40 → 0 → -40` slide transition on question change.
- Difficulty badge with color coding (emerald=easy, amber=medium, rose=hard), supporting both English & Russian difficulty strings.
- Options: 4 `OptionCard` buttons (A/B/C/D) inside `StaggerGroup`/`StaggerItem` for staggered reveal. Hover scale, selected state (primary ring), post-reveal states (green correct + Check icon, red wrong + X icon, dimmed others).
- Reveal flow: before reveal → "Пропустить" + "Проверить" (disabled until option chosen). After reveal → `ExplanationCard` animates in (height auto) with correct/wrong color coding, `Lightbulb` icon, correct answer text, explanation. "Следующий вопрос" (or "Завершить квиз" on last).
- Skip = sets `answers[i] = null`, reveals, counts as wrong at the end.

### 4. Results phase
- `Confetti` (70 framer-motion pieces, violet/fuchsia/pink/amber/emerald/rose) bursts on scores ≥ 70%.
- Big emoji badge springs in (scale + rotate), gradient score reveal (`{correct} / {total}` with `text-gradient`).
- Adaptive headline: "Безупречно!" / "Отличная работа!" / "Неплохо!" / "Есть над чем поработать".
- 4-stat grid: Точность %, Верно, Ошибок, XP получено.
- Buttons: gradient "Ещё по этой теме" (re-fetch with same topic/subject/level) + outline "Новый квиз" (reset to setup, clear topic).
- Collapsible review: shadcn `Accordion` listing each question with correct/wrong badge, user answer (or "Пропущено"), correct answer, and explanation.

### API flow
- `startQuiz()` → POST /api/quiz → set questions + answers array → phase `quiz`.
- `finishQuiz()` → compute correct locally → phase `results` immediately → PUT /api/quiz → set `quizResult`, update `useUser` xp/level, toast `+{xpGain} XP`.
- All errors caught with `toast.error`.

### Behaviors satisfied
- ✓ Prefills `subject` from `useNav().activeSubject` on mount + when it changes.
- ✓ Setup → fetch (skeleton) → quiz (one-by-one with check reveal) → PUT /api/quiz → results.
- ✓ Tracks selected answers in state; computes correct at end.
- ✓ Skip counts as wrong.
- ✓ API errors handled with toast.

### Technical
- `'use client'` directive at top.
- Named export `export function QuizView()`.
- All imports per spec (useNav, useUser, SUBJECTS, ui-blocks set, sonner toast, framer-motion motion/AnimatePresence, the 13 specified lucide icons, shadcn Progress, shadcn Accordion, cn).
- TypeScript strict typing throughout (`Phase`, `QuizQuestion`, `QuizResult`).
- Responsive: mobile-first, `sm:`/`lg:` breakpoints; touch-friendly button targets.
- Semantic HTML (`section` via PageSection, `button type="button"`, aria-label on icon-only exit button).
- NO indigo/blue as primary — only violet/fuchsia/pink gradients + emerald/amber/rose for semantic states.

## Verification
- `bunx eslint src/components/views/quiz-view.tsx` → 0 errors, 0 warnings.
- `bun run lint` → only pre-existing errors in `app-shell.tsx` (set-state-in-effect) and `use-user-sync.ts` (unused eslint-disable), both unrelated to this task.
- Dev server log shows clean `GET / 200` responses; no compile errors after file write.

## Stage Summary
Quiz Arena view is fully implemented and feels like a polished mini-game: smooth slide transitions between questions, satisfying green/red reveal feedback, animated confetti + spring score reveal on results, and a complete collapsible review. Ready for users to test their knowledge and grind XP.
