# Pace

Pace is a Windows desktop breathing companion that turns genuine Presage SmartSpectra signals into a quiet, responsive experience. With the participant's consent, a webcam session can display valid breathing and pulse readings while a soft visual orb follows the measured breathing rate.

Pace is for general wellness and awareness only. It is not a medical device and does not diagnose, treat, or make health decisions.

## Why SmartSpectra matters

Pace does not simulate sensor values or run a browser-only signal processor. The official `@smartspectra/node-sdk` captures the selected camera and emits measured metrics, validation hints, lifecycle states, and errors. Those genuine outputs determine what the interface displays and whether the breathing orb adapts.

## Current live signals

- Breathing rate, shown in breaths per minute when valid.
- Pulse rate, shown in beats per minute when valid.
- HRV RMSSD, shown in milliseconds when valid. SmartSpectra's documented HRV confidence remains zero until its 60-second observation window is reached, so this value may remain unavailable in shorter sessions.

Values outside the SDK's documented valid ranges, confidence-zero samples, unstable samples, and stale samples are treated as unavailable. The session summary includes averages only from distinct valid SDK samples received in that session.

## Architecture

Electron main process owns the SDK, API key, native camera, protobuf decoding, validity checks, and session aggregation. A sandboxed React renderer uses a restricted preload bridge. See [Architecture.md](Architecture.md) and [Architecture_essential.md](Architecture_essential.md).

## Requirements

- Windows x64 and Node.js 20 or newer. Node.js 26 was present in the development environment.
- A webcam visible to Windows desktop apps.
- Network access for SmartSpectra authorization and its automatic AI Insights processing.
- A Presage SmartSpectra developer API key with access to the requested measurements and session credit.

The Windows x64 installer is built with electron-builder and includes the Windows SDK package. The installer has not yet been verified on a clean Windows machine with a webcam and valid Presage credentials.

## Install and configure

```powershell
npm.cmd install
Copy-Item .env.example .env
```

Edit the local ignored `.env` file and replace the placeholder with the real key:

```text
PRESAGE_API_KEY=your_real_key
```

Keep `.env` private. It is ignored by Git. The key is read only by Electron main and is not sent to the renderer. You can also set `PRESAGE_API_KEY` in the environment before starting Pace.

### Configure credentials in the installed app

The installer never includes an API key. After installing Pace, create `%APPDATA%\Pace\.env` (for example, `C:\Users\YourName\AppData\Roaming\Pace\.env`) with your own Presage developer key. In PowerShell:

```text
New-Item -ItemType Directory -Force "$env:APPDATA\Pace" | Out-Null
notepad "$env:APPDATA\Pace\.env"
```

Put this in the file and save it:

```text
PRESAGE_API_KEY=your_presage_key
```

Restart Pace after saving the file. Keep it private and remove it when you no longer need the app. You can instead set `PRESAGE_API_KEY` in a PowerShell session and launch Pace from that same session. Each judge must use their own Presage credentials and account access; never publish a key in the repository, release notes, issue, screenshot, or video.

## Run

```powershell
npm.cmd run dev
```

Pace does not request camera access on launch. Choose **Begin a session**, select a discovered camera, accept the consent checkbox, and choose **Start sensing**. Keep your face and upper chest visible in steady, even lighting. Breathing metrics need a longer observation window than pulse.

## Checks

```powershell
npm.cmd test
npm.cmd run build
```

Automated tests cover measurement validation, lifecycle state mapping, and IPC sender URL security. Automated tests do not access a webcam or prove account authentication. For a hardware test checklist, see [DEMO_SCRIPT.md](DEMO_SCRIPT.md).

## Consent and privacy

Camera use is voluntary and starts only after explicit in-app consent and a start action. SmartSpectra processes raw camera frames and face signals on-device; Presage says these are not sent to it. During an SDK session, however, SmartSpectra automatically sends derived pulse, breathing, and HRV measurements with session metadata to Presage for AI Insights. Presage's current policy says it shares these measurements with Anthropic and stores Insights requests and responses. Pace sends no prompt text. This Insights processing cannot currently be disabled for an SDK session.

Pace sets `enableTelemetry: false` to disable optional diagnostic telemetry. This does not disable authentication, model delivery, or Insights processing. Pace itself does not save recordings or local session history; the active summary is held in memory and discarded when leaving it. Stopping capture cannot retract data already sent to Presage. Review the [SmartSpectra SDK privacy policy](https://presagetech.com/legal/privacy-policy) and [optional telemetry documentation](https://smartspectra.presagetech.com/docs/telemetry-and-privacy/) before consenting. No third-party analytics are used by Pace.

SDK metrics are for general wellness and informational use only, not medical diagnosis or treatment.

## Known limitations and status

- Real camera authorization, SDK account access, and live values require a local webcam, network, and developer-provided key; they have not been verified in this environment.
- Device readiness and native camera failures are surfaced honestly; specific measured lighting estimates are shown only when SmartSpectra emits a validation hint.
- The session summary currently reports sample averages and timestamp-based signal coverage. It does not make trend or improvement claims.
- A Windows x64 installer is available at `release/Pace Setup 1.0.0.exe`. It is unsigned and has not completed clean-machine, webcam, or live-signal verification. See the production release notes below before distributing it.
- No video demo has been recorded; see the demo script. Challenge copy is in [DEV_SUBMISSION.md](DEV_SUBMISSION.md).

## Production release

Pace is a Windows desktop app, so production distribution is a signed installer rather than a web deployment. The SmartSpectra Node SDK currently takes an API key in the app process. Do not embed a shared developer key in a public installer; arrange a Presage-approved credential flow before offering the app to general users. For a private demo, supply the developer's key outside the installer through the local environment.

Build on Windows x64 with `npm ci`, `npm.cmd test`, `npm.cmd run build`, then `npm.cmd run package:win`. The installer is written to `release/Pace-1.0.0-Windows-x64-Setup.exe`. Before distribution, verify it on a clean Windows machine with the target webcam and authorized account, sign the app and SmartSpectra DLLs with an Authenticode certificate, and publish the signed installer and source repository. A hosted web version is optional for the challenge and is not the deployment model for this native-camera app. Tagging a version as `v*` runs the Windows build and creates a GitHub Release through `.github/workflows/release.yml` (for example, push tag `v1.0.0` after pushing the source repository).

## Challenge

Prepared for the Presage SmartSpectra SDK Challenge 2026. Targeting Best Overall Human-Sensing Experience and Best Thoughtful Real-World Use. No award or endorsement is claimed.
