# Agent responsibilities and rules

- Keep SmartSpectra calls in the trusted Electron main process. Read the official Node.js SDK docs before changing its API usage.
- Never invent, randomize, hardcode, or label unavailable sensor values as real. Keep the key in `PRESAGE_API_KEY`; never print, commit, screenshot, or forward it.
- Preserve voluntary camera consent, truthful readiness/error states, telemetry opt-out, no default storage, and non-medical language.
- Keep the preload bridge narrowly scoped and validate IPC senders and arguments in main.
- When changing SDK lifecycle, ensure `stopAsync()` and `destroy()` run on finish, errors, and shutdown.
- Verify changes with `npm.cmd test` and `npm.cmd run build` when dependencies are installed. Hardware checks must be reported separately and only after a real device session.
- Do not claim a successful API authentication, real measurement, hardware test, submission, or award without direct evidence.
