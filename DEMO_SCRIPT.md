# Pace demo script

## Before recording

Use a Windows x64 machine with a supported webcam, internet access, a valid Presage SmartSpectra key in the local `PRESAGE_API_KEY` environment or ignored `.env` file, and sufficient account session credit. Confirm Windows camera privacy allows desktop apps. Do not include the key or private account details in the recording.

## Walkthrough

1. Open Pace and explain the opt-in webcam flow and the wellness-only scope.
2. Open privacy details and explain that raw frames/face signals are processed on-device, while derived pulse, breathing, and HRV plus session metadata are automatically sent to Presage for Insights; the current policy says measurements are shared with Anthropic and Insights requests/responses are stored. Optional diagnostic telemetry is disabled, but Insights is not optional for an SDK session. Point out the privacy policy link.
3. Choose Begin; select the discovered webcam; review and accept the consent checkbox.
4. Start sensing. Show the camera/SDK state and readiness guidance. Wait for SDK-valid breathing and pulse measurements; point out the units and freshness.
5. Keep the participant centered and still with face and upper chest visible. Show that the orb follows the valid measured breathing rate. If validity is lost, show the explicit waiting state rather than a claimed measurement.
6. Pause/resume visual guidance; end the session. Show genuine sample averages and timestamp-derived coverage, including unavailable signals where appropriate.
7. Return to Pace to discard the in-memory summary and confirm that the sensor stopped.

Do not splice in simulated values or describe an unsuccessful sensor setup as a working measurement. A real recording has not yet been produced.
