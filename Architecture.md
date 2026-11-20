# Pace architecture

## Runtime

Pace is a Windows x64 Electron desktop application. Electron main and preload use TypeScript; a React/Vite renderer provides the experience. `@smartspectra/node-sdk` is loaded only by `src/main/smartspectra.ts`, where the API key stays in the trusted Node process. The SDK's documented Node binding uses a native runtime through FFI; its Node 20+ runtime requirement is met by Node 26 in the current developer environment.

## Data flow

1. The welcome screen requests consent; camera discovery occurs only after the participant presses Begin.
2. The renderer sends the selected opaque camera ID through the narrow `pace:start` bridge only after checkbox consent.
3. Main constructs `SmartSpectraSDK` with `PRESAGE_API_KEY`, `breathingMetrics + cardioMetrics`, and `enableTelemetry: false`; it selects the camera with `CameraSelection.byId`, subscribes to processing, validation, error, and metric events, then starts.
4. Protobuf metrics are decoded with the official metrics class. Main accepts only finite, in-range samples with positive confidence and non-false stability, converts SDK epoch-microsecond timestamps to milliseconds, and emits a reduced snapshot. Renderer enforces freshness again before display.
5. `pace:finish` computes an in-memory summary from distinct SDK sample timestamps, stops and destroys the SDK, then clears sample memory. Shutdown also attempts stop and destroy.

## Security boundaries

- `contextIsolation: true`, `nodeIntegration: false`, `sandbox: true`.
- The preload exposes six named methods; there is no generic `send`, `invoke`, or Node access.
- Main validates the renderer origin for every invoke and rejects external navigation/new windows.
- IPC accepts a bounded camera identifier; external links are exact allowlisted HTTPS URLs.
- The API key is loaded from the main-process `.env`/environment only. It is never returned through IPC or included in logs. `.env` is ignored by Git.
- No renderer camera capture, file input, external analytics, persistence, or remote content is used.

## Privacy

The SDK processes raw frames and face signals on-device. Presage's current [SmartSpectra SDK privacy policy](https://presagetech.com/legal/privacy-policy) also says that each SDK session automatically sends derived pulse, breathing, and HRV measurements with session/request metadata to Presage for AI Insights; Presage shares measurements with Anthropic and stores Insights requests and responses. Pace supplies no prompt text. This processing cannot currently be disabled for an SDK session. `enableTelemetry: false` disables optional diagnostic telemetry only; it does not stop authentication, model delivery, or Insights. Pace saves no recordings or local session history; session samples and the summary are in memory and discarded on leaving. Stopping capture cannot retract information already transmitted to Presage.

## Limitations

The native SDK owns camera capture; Windows privacy settings and hardware availability can block discovery or start. Runtime errors are translated to actionable messages. Real authorization and webcam behavior require the developer's local key and camera and remain a manual verification step. The current summary averages distinct valid samples; sparse sampling is reflected by timestamp-based coverage.
