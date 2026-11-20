# Essential architecture

- Electron main owns `SmartSpectraSDK`, API key, camera selection, decoding, validation, sample aggregation, teardown.
- React renderer receives only sanitized snapshots through `contextBridge` methods in `src/preload/index.ts`.
- Start sequence: explicit informed consent → native camera discovery → key check → camera selection → SDK events registered → SDK start.
- Request only official `breathingMetrics` and `cardioMetrics`; optional diagnostic telemetry is disabled. SmartSpectra still sends derived measurements and session metadata to Presage for Insights, and the current policy says those measurements are shared with Anthropic and Insights requests/responses are stored. This cannot currently be disabled for an SDK session.
- Accept only in-range, finite, positive-confidence, stable samples. SDK timestamps are epoch microseconds; UI readings expire after 15 seconds.
- `finish()` averages distinct valid timestamps, reports observed coverage, stops/destroys the SDK, and clears samples. No persistence.
- Main validates trusted sender URLs; renderer Node integration is off, context isolation and sandbox are on.
