# ♠ HisokaGaym — Memory Arena

A responsive memory-matching game made with HTML, CSS and vanilla JavaScript.

**Live:** https://hisokabk.github.io/brief-4-DOM-Gamification-Game-1/

## How to play

1. On the welcome screen, choose a **theme** and **difficulty**.
2. Wait until your theme's card images are completely preloaded.
3. Click **Start game**. **All card faces are shown first** so you can memorize their locations.
4. After the preview countdown, the cards flip face down. **Only now does the timed game begin**.
5. Open pairs, earn points and finish before the timer expires. A streak of correct pairs earns a combo bonus.
6. Replay, pause or return to the theme selection using buttons on the game screen.

## Themes

| Theme | Design | Pictures |
| --- | --- | --- |
| **Anime** | Dark violet/pink | Original anime character pictures from `image/` |
| **Animes** | Cool blue/fantasy | Eight original SVG fantasy illustrations embedded in `fill.js` |
| **Classic** | Forest green/warm cream | Eight original SVG drawings: water, flower, television, camera, coffee, bicycle, book and clock |

Each theme has its **own card fronts, card back and color palette**.

### Replacing theme illustrations

The **Anime** theme already uses the existing JPGs.

The **Animes** and **Classic** artwork is generated from self-contained SVG strings in `fill.js`, so no external image host or additional file is needed. To use your own artwork later:

1. Add pictures under the existing `image/` folder, for example `image/animes/fox.jpg` or `image/classic/flower.jpg`.
2. Find `const THEMES` in `fill.js`.
3. Replace the chosen card's `src` with a relative file path, keeping eight distinct images in the pack.
4. Reload the page. Preloading checks the pictures before the Start button is enabled.

The illustrated packs work **right now** even if you don't replace anything.

## Difficulty

| Level | Pairs / cards | Memory preview | Playing time |
| --- | ---: | ---: | ---: |
| Easy | 4 pairs / 8 cards | 5 seconds | 90 seconds |
| Medium | 6 pairs / 12 cards | 7 seconds | 110 seconds |
| Hard | 8 pairs / 16 cards | 9 seconds | 140 seconds |

The preview is not deducted from playing time. Cards cannot be clicked while they are revealed, hiding or paused.

## Score and controls

- Matching pair: **+100 points**.
- Consecutive matches: an additional **+25 per combo step**.
- Mismatch: **−15 points**, down to a minimum of zero.
- Win bonus: **+2 points per whole second left**.
- **Personal best** is saved separately for every theme/difficulty combination.
- **Pause / Resume** freezes the timer and obscures card positions.
- **Restart** and **Setup** immediately reset the round without native browser alert/confirm dialogs.
- Feedback appears as subtle **inline status messages and toasts**, never disruptive browser popups.
- Sounds and background music are generated with the browser's Web Audio API, with separate mute toggles; music defaults to off.

## Full-screen layout

While playing, the board uses the entire available screen height, with compact score, move count, pair count and timer across the top. The size of each card is calculated from the **actual board area** so all 8, 12 or 16 cards fit without vertical scrolling on normal mobile/desktop screens. The welcome screen may scroll on exceptionally small displays while choosing options.

## Project structure

- `index.html` — theme selection, difficulty selection and separate full-screen game layout.
- `fill.js` — theme picture packs, image preloading, preview countdown, cards, score, time, audio and toasts.
- `style.css` — per-theme colors, card animation and responsive layouts.
- `image/` — original anime pictures and other existing assets.

## Run locally

The game is static and requires no build dependencies. Open `index.html` in a modern browser, or serve the folder with VS Code Live Server or:

```bash
python -m http.server 8000
```

Then visit http://localhost:8000/.

**Note:** Browser audio can start only after a user gesture. Sound and music preferences are stored locally when browser storage is available.
