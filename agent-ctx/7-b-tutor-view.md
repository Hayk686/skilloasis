# Task 7-b: AI Tutor View

**Agent:** subagent (AI Tutor View)
**File:** `/home/z/my-project/src/components/views/tutor-view.tsx`
**Status:** ✅ Complete

## What was built
A stunning, fully-functional AI tutor chat interface (`TutorView` named export) with:
- Two-panel responsive layout (desktop: 320px session rail + chat thread; mobile: stacked with left Sheet drawer)
- Session history list with subject emoji, title, message count, relative date, hover-reveal delete
- "Новый диалог" gradient CTA button
- Subject `Select` (SUBJECTS + "✨ Общий" general option), pre-selected from `useNav().activeSubject`
- Chat thread with `ScrollArea`, user gradient bubbles (right) + assistant glass bubbles (left) with Sparkles avatar
- `react-markdown` rendering wrapped in `.prose-ai` for assistant replies (code blocks, lists, tables supported)
- `dot-typing` three-bounce indicator while waiting
- Empty state: floating animated Sparkles icon + 6 suggested prompt chips
- Composer: auto-growing `Textarea`, Enter-to-send / Shift+Enter newline, gradient send button with shine + scale feedback
- Optimistic send → POST /api/chat → append reply → `useUser.setState({xp, level})` → refresh sessions
- sessionId persisted in `sessionStorage['skilloasis:tutor-session']`, restored on mount
- Framer Motion message entrance animations + auto-scroll to bottom
- Errors via `toast.error`
- Ambient cosmic glow, glassmorphism, gradient accents (violet/fuchsia/pink, no indigo/blue primary)

## API contracts used
- `POST /api/chat` `{message, subject, sessionId?, history?}` → `{reply, sessionId, xp, level}`
- `GET /api/chat` → `{sessions:[{id,subject,title,updatedAt,_count:{messages}}]}`
- `GET /api/chat/[sessionId]` → `{session:{id,subject,title,messages:[{role,content}]}}`
- `DELETE /api/chat/[sessionId]`

## Lint status
`tutor-view.tsx` — ✅ 0 errors, 0 warnings.
(Pre-existing lint issues in `app-shell.tsx` & `use-user-sync.ts` are unrelated.)

## Notes for downstream agents
- The `useUser.setState({xp, level})` pattern is the canonical way to sync XP from API responses client-side.
- `sessionStorage['skilloasis:tutor-session']` is the key for restoring the active tutor session across reloads.
- `sessionStorage['skilloasis:lesson-topic']` is used by paths-view for lesson pre-fill — different key, don't confuse.
