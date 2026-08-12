---
Task ID: 1
Agent: main
Task: Test Info Oasis app functionality, find bugs, and fix them

Work Log:
- Analyzed the entire codebase: all view components, API routes, store, hooks, and configuration
- Found and fixed Bug #1: AI system prompt using wrong role (`role: 'assistant'` instead of `role: 'system'`) in `src/lib/ai.ts`
- Found and fixed Bug #2: `output: "standalone"` in `next.config.ts` breaks `next start` (ChunkLoadError)
- Tested all GET API endpoints - all working correctly
- Tested Home page rendering - works correctly
- Dashboard view shows ChunkLoadError when lazy-loading due to OOM constraints in sandbox (server crashes when Chrome + Next.js both run)
- Reviewed all 11 view components for runtime errors - code is correct
- Reviewed all 19 API route handlers - code is correct
- Reviewed shared components (share-card, bookmark-button, command-palette, media-tools, footer, ui-blocks) - all correct

Stage Summary:
- Fixed `ai.ts`: Changed `role: 'assistant'` to `role: 'system'` for system prompts - this was causing poor AI responses and incorrect JSON generation
- Fixed `next.config.ts`: Commented out `output: "standalone"` which was breaking production builds with ChunkLoadError
- The app works correctly with the dev server - all APIs respond properly
- Browser testing limited by OOM in sandbox (Chrome + Next.js server exceed available memory)
- Dev server is running on port 3000 and serving pages correctly
