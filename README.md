# Quick Settings (webOS 25 Overlay App)

A fast, HDR-friendly quick settings overlay for rooted **LG OLED G5** TVs (`webOS 25`) styled after Apple Control Center.

## Installation (`.ipk`)
1. Download `io.github.sqoutv.betterquicksettings_1.0.3_all.ipk` from [Releases](https://github.com/Sqoutv/webOS-betterQuickSettings/releases).
2. Install it normally via **webOS Dev Manager** or SSH
3. On first launch, the app automatically elevates its bundled background service (`io.github.sqoutv.betterquicksettings.service`) via Homebrew Channel (`org.webosbrew.hbchannel.service/exec`).

Tip: Map `io.github.sqoutv.betterquicksettings` to a remote button in **Magic Mapper** for instant access over any input.

## Features
- **Floating Transparent Overlay:** Opens over live HDMI/media playback (`keepAlive: true`, `<0.3s` warm relaunch via `webOSSystem.hide()`/`activate()`).
- **HDR Paper-White Theme:** Avoids pure `#FFFFFF` glare; header toggle cycles `Paper`, `Dim`, and `Ultra` presets.
- **Quick Controls:** HDMI input switcher with live signal status, OLED brightness slider (with configurable D-Pad step size: `1%`, `5%`, `10%`, `20%`), Picture Mode (dynamic SDR/HDR10/Dolby Vision list), Sound Mode + active audio output, Energy Saving, and a shortcut to LG Standard Settings.
- **Customizable & Bilingual:** Switch between English (default) and German, set brightness step size, and reorder sections/tiles in the built-in Quicksettings menu. Full D-Pad / Magic Remote navigation.

## Compatibility & Requirements
> **Tested hardware:** Only tested on a rooted **LG OLED G5 (`webOS 25`)**. Other models are untested and may behave differently.
- **Root required:** Needs **Homebrew Channel** (root + `elevate-service`) so the bundled service can access `com.webos.settingsservice` and `com.webos.service.eim`. Standard LG Developer Mode alone is not sufficient.
- **LG TVs (`webOS 22–25`, 2022+):** Expected to work out of the box (OLED and LCD/QNED share `backlight` and load picture/sound modes dynamically).
- **Older LG TVs (`webOS 4–6`, 2018–2021):** Untested; `replaceChildren()` in `app/js/overlay-view.js` requires Chromium 86+ (`webOS 22+`) and would fail on older WebAppMgr engines.
- **Third-party `webOS Hub` TVs:** Untested; likely compatible if rooted with Homebrew Channel and standard `settingsservice` / `eim` endpoints.

## Structure
- `app/` — Vanilla HTML/CSS/JS frontend (`index.html`, `styles.css`, `luna.js`, `settings-map.js`, `preferences-store.js`, `tv-controller.js`, `spatial-navigator.js`, `overlay-view.js`, `app.js`).
- `service/io.github.sqoutv.betterquicksettings.service/` — Bundled Node.js LS2 root proxy for `com.webos.settingsservice` and `com.webos.service.eim`.
- `build-ipk.py` & `deploy.sh` — Zero-SDK `.ipk` + Homebrew manifest packager and optional SSH deploy helper.

## Build from Source & Developer Deploy
```bash
python3 build-ipk.py                  # Builds dist/io.github.sqoutv.betterquicksettings_1.0.3_all.ipk + .manifest.json
chmod +x deploy.sh && ./deploy.sh <TV_IP>   # Optional one-command SSH install for development
```

## Local Browser Preview
```bash
python3 -m http.server -d app 8080
```
Running outside webOS enables an interactive **DEMO** mode with mocked Luna responses and arrow-key navigation.

## AI Usage
This App is mostly vibe coded. I made it for my personal use primarily but tested every Feature and overlooked the code. If there are any issues please report them, im happy to help! :)