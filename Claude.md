# Claude Code project instructions

Use TypeScript and the existing Electron/Vite/React structure. Preserve the main-process SmartSpectra security boundary and the narrow preload API. Refer to `Architecture.md` and `PRD.md` before changing product behavior.

The only production measurements come from `@smartspectra/node-sdk`. Keep `PRESAGE_API_KEY` in the main process. Do not add simulated readings, persistence, analytics, medical claims, or an alternate camera signal processor. Respect explicit consent and stop/destroy the SDK on every session exit.

Run `npm.cmd test` and `npm.cmd run build` after relevant changes. Hardware verification is manual and must not be represented as passed without actually running a session with a webcam and authorized key.
