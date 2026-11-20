# DEV challenge submission draft

**Project:** Pace  
**Challenge:** Presage SmartSpectra SDK Challenge 2026  
**Categories:** Best Thoughtful Real-World Use; also eligible for overall judging  
**Repository:** [Add public repository URL after publishing]  
**Demo video:** [Placeholder — record a real hardware demo before submission]  
**Tag:** #presagechallenge

## Inspiration

Pace explores how camera-based breathing and pulse signals can become a quiet, human interaction instead of another dashboard. It gives people a voluntary moment to notice their own rhythm.

## What it does

Pace uses the Presage SmartSpectra Node.js SDK in an Electron desktop app. After explicit consent, the app discovers a webcam and can display valid pulse and breathing samples, provide camera-positioning feedback, and adapt a breathing orb to a valid breathing-rate signal. Sessions can be stopped and are not automatically saved.

## How it was built

Electron main owns the SDK, camera selection, API key, metrics decoding, validation, session sample aggregation, and cleanup. A sandboxed React renderer communicates through a restricted preload bridge. Optional diagnostic telemetry is disabled; no Pace analytics or database is used. SmartSpectra's automatic Insights processing still sends derived measurements and session metadata to Presage, shares measurements with Anthropic, and stores Insights requests and responses under Presage's current policy.

## Challenges

Keeping the API key out of renderer code, following the supported Node/Electron runtime, presenting asynchronous measurement validity honestly, and preserving camera cleanup across failure and shutdown.

## Accomplishments

The product flow and SDK integration are implemented without simulated measurements. Camera consent, measurement availability states, a signal-responsive orb, session controls, a discardable summary, and a Windows x64 installer are included. Hardware, authorization, live-signal, and packaged-app verification remain pending until run with the developer's webcam and key.

## What we learned

Camera-based measurements depend on framing, lighting, stability, and time-window confidence. The device readiness state and sample metadata need to shape the experience instead of being hidden behind a polished animation.

## What's next

Complete Windows hardware and packaged-app verification, capture an authentic demo, publish the source repository, and publish the DEV submission post.

## Consent and Data Handling

Before capture, Pace explains that SmartSpectra processes raw frames and face signals on-device, while automatically sending derived pulse, breathing, and HRV measurements plus session metadata to Presage for Insights. Presage's current policy says measurements are shared with Anthropic and Insights requests/responses are stored. Pace sends no prompt text. This Insights processing cannot currently be disabled for an SDK session. `enableTelemetry: false` disables optional diagnostic telemetry only; authentication, model delivery, and Insights continue. Pace stores no local recordings or session history, and clears its in-memory summary when leaving it; this does not remove data already sent to Presage. Metrics are for general wellness and are not for diagnosis or treatment. See the [SmartSpectra SDK privacy policy](https://presagetech.com/legal/privacy-policy).

## Judge setup

The installer contains no API key. Each judge must use their own Presage developer credentials. Install Pace, create `%APPDATA%\Pace\.env`, add `PRESAGE_API_KEY=your_presage_key`, save, then restart Pace. Detailed PowerShell steps are in the [README](README.md#configure-credentials-in-the-installed-app).
