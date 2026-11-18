# ♠ HisokaGaym — Memory Arena

An anime-themed **memory matching game** built with vanilla HTML, CSS and JavaScript. Match pairs of cards, keep your combo streak alive and beat the clock.

## Features

- **Preloaded card art:** the game loads and decodes the backs and all eight character images **before** enabling Start, preventing image pop-in during a flip. An error screen offers Retry when an asset cannot load.
- **Three difficulty levels:**
  - **Easy:** 4 pairs (8 cards), 90 seconds.
  - **Medium:** 6 pairs (12 cards), 110 seconds.
  - **Hard:** 8 pairs (16 cards), 140 seconds.
- **Game rules:** flip up to two cards per move. Matching pairs stay visible, mismatches flip back, and the board is locked while evaluating a pair.
- **Scoring:** +100 points for a match, plus +25 for every additional consecutive matching pair; -15 for an incorrect pair (minimum score 0). Finishing a round adds 2 points per remaining whole second.
- **Timer and pause:** each level has a countdown. Pause freezes the timer and obscures the cards.
- **Personal best per difficulty:** stored locally in the browser with `localStorage`.
- **Victory and time-out screens:** final score, number of moves, time remaining and one-click replay.
- **Sound effects:** card flips, matches, incorrect pairs, starting, victory and time-out.
- **Original generated background audio:** subtle synthesizer notes played through the Web Audio API. **Effects** and **Music** have independent on/off controls; music is off by default.
- **Responsive layout:** mouse, touch and keyboard-friendly cards, mobile-friendly grid and reduced-motion styles.

## Play online

After GitHub Pages deployment, the project can be opened at:

https://hisokabk.github.io/brief-4-DOM-Gamification-Game-1/

If GitHub Pages is not enabled yet, run locally as explained below.

## Run locally

No framework, build process or package installation is needed. Open `index.html` in a modern browser. For the most consistent behavior, serve the folder with a local HTTP server, for example VS Code Live Server or:

```bash
python -m http.server 8000
```

Then visit http://localhost:8000/.

## How to play

1. Wait until all **9 image assets** are ready.
2. Choose **Easy**, **Medium** or **Hard**.
3. Click **Start game**.
4. Reveal two cards to attempt a match; build a combo for more points.
5. Match all pairs before time runs out.
6. Use **Pause**, **Restart**, **Effects** and **Music** whenever needed.
7. After winning or losing, select **Play again** or **Choose level**.

## Project files

- `index.html` — game screen, controls, statistics and results dialog.
- `style.css` — responsive interface and 3D card flip animation.
- `fill.js` — image preloading, game state, timer, matching logic, scores and generated audio.
- `image/` — existing card artwork and background assets.

The entire upgrade uses **existing project files and existing pictures**. No additional JavaScript or audio packages are required.

## Browser notes

Browsers restrict sound playback before a user gesture. HisokaGaym therefore activates audio from button/card interactions rather than attempting to autoplay on page load. Music and effects can be disabled independently. Records and audio preferences live in local storage on the current browser/device.
