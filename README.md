# Valorant Strategy Overlay

An [Overwolf](https://www.overwolf.com/) app that displays save reminders during Valorant buy phases. A transparent overlay pill appears in the top-left corner when you should save your economy — on the penultimate round of each half and when either team is one round from match point.

## How it works

The app listens to Valorant's live game data through Overwolf's Game Events Provider (GEP). When the buy phase starts on a critical round, a small pill overlay appears with a save reminder. It auto-hides after 8 seconds or when combat begins.

**Reminders trigger on:**
- **Round 11** — "Save for last round of half!"
- **Either team at score 11** — "Save for match point!"

All other rounds: no overlay.

## Installation

1. Download or clone this repo
2. Open Overwolf, go to **Settings → About → Development**
3. Click **Load unpacked extension** and select this folder
4. Launch Valorant — the overlay activates automatically

## Project structure

```
manifest.json                      App manifest (Valorant game ID 21640)
src/advice-engine.js               Rule engine — decides when to show reminders
windows/background/background.html Background page loader
windows/background/background.js   GEP event listener + state management
windows/overlay/overlay.html       Overlay page
windows/overlay/overlay.js         Message receiver + DOM updates
windows/overlay/overlay.css        Overlay pill styling
icons/                             App icons (256x256)
```

No build step — vanilla JS loaded directly by Overwolf's Chromium runtime.

## Packaging

To create a distributable `.opk`:

```powershell
Compress-Archive -Path * -DestinationPath ValorantStrategyOverlay.zip
Rename-Item ValorantStrategyOverlay.zip ValorantStrategyOverlay.opk
```

## Development

### Testing with the GEP Simulator

1. Clone the [GEP Simulator](https://github.com/overwolf/ow-events-recorder)
2. Build it (`NODE_OPTIONS=--openssl-legacy-provider` may be needed)
3. Load both apps as unpacked extensions in the Overwolf dev client
4. Valorant must be running for the simulator to work
5. To trigger the overlay: set `round_number` to `11`, then transition `round_phase` from `combat` → `shopping`

### Architecture

**Background page** registers GEP event listeners and feature requirements on startup. Events arrive via `onInfoUpdates2` — the handler parses round phase, round number, score, and scoreboard data, then sends messages to the overlay window via `overwolf.windows.sendMessage`.

**Overlay page** listens for messages via `overwolf.windows.onMessageReceived`. On `"advice"` messages it shows the pill; on `"clear"` it hides it.

The advice engine is a pure function that takes game state and returns `{ text, color }` or `null`.
