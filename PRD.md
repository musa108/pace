# Pace product requirements

## Purpose

Pace is a calm desktop breathing companion for adults who want a moment of awareness. It uses a webcam and Presage SmartSpectra to display live, validated breathing and pulse readings and let a measured breathing rate shape a visual orb. It is a general wellness experience, not a medical device.

## People and goals

- A participant chooses when the camera starts, can stop at any time, and can discard the session by leaving.
- A challenge judge can run Pace on Windows x64 with a webcam and an authorized SmartSpectra API key and see genuine SDK output.
- The interface communicates sensor readiness and unavailable/invalid readings honestly.

## Requirements

1. Explain camera use and voluntary participation before consent. Disclose that raw frames are processed on-device, while derived measurements and session metadata are sent automatically for Insights; link the current Presage privacy policy and explain sharing/retention and the non-medical purpose.
2. Discover cameras only after the participant chooses to begin; require an explicit consent checkbox before session start.
3. Run SmartSpectra in Electron's trusted main process, request supported breathing and cardio bundles, disable optional diagnostic telemetry, and present real SDK events only. Explain that this setting does not disable Insights, authentication, or model delivery.
4. Show pulse (BPM), breathing (breaths/min), HRV RMSSD (ms) when valid, validity state, readiness hints, session duration, and fresh timestamps when valid samples exist.
5. Adapt the orb's full breath cycle to the current valid breathing-rate sample. If validity expires or fails, the orb stops adapting and explains why. Guidance pause/resume is a visual pause; ending the session stops the SDK and releases the camera.
6. Summarize only in-memory valid samples from the current session; show missing signals as unavailable and discard sample storage after summary.
7. Respect reduced-motion preferences, provide keyboard controls, and support narrow and desktop layouts.

## Non-goals

Diagnosis, treatment, risk scoring, medical claims, forced breathing targets, automatic persistence, account creation, analytics, cloud storage, simulated sensor values, and non-SmartSpectra camera processing.

## Acceptance evidence

Automated checks cover value validation, status transitions, and trusted IPC URL boundaries. A real hardware run is separate and must establish camera access, successful Presage authorization, real metric events, validity handling, clean stop, and resource release. No hardware result is claimed by automated tests.
