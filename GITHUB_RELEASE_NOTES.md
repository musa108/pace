## Install

Download and run `Pace-*-Windows-x64-Setup.exe` on Windows x64. Windows may show a publisher warning until Pace has a verified Authenticode signature.

## Presage credentials

Pace does not include an API key. Obtain your own SmartSpectra developer key from the [Presage developer portal](https://physiology.presagetech.com/). Create `%APPDATA%\Pace\.env` containing:

```text
PRESAGE_API_KEY=your_presage_key
```

Restart Pace after saving the file. Keep the key private and never post it in a public issue, screenshot, video, or repository.

## Camera and data

Pace asks for consent before sensing. SmartSpectra processes camera frames on-device and automatically sends derived pulse, breathing, and HRV measurements plus session metadata to Presage for AI Insights. Presage's [current privacy policy](https://presagetech.com/legal/privacy-policy) describes its further sharing and retention. Pace disables optional diagnostic telemetry; this does not disable Insights. Read the policy before starting a session.

Pace is for general wellness and is not a medical device.
