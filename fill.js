(() => {
  "use strict";

  const ASSETS = [
    { key: "girlchan", src: "./image/girlchan.jpg" },
    { key: "kaniki", src: "./image/kaniki.jpg" },
    { key: "lofi", src: "./image/lofi.jpg" },
    { key: "sokona", src: "./image/sokona.jpg" },
    { key: "tanjiro", src: "./image/tanjiro.jpg" },
    { key: "gojo", src: "./image/gojo.jpg" },
    { key: "imiso", src: "./image/imiso.jpg" },
    { key: "zoro", src: "./image/zoro.jpg" }
  ];
  const BACK_IMAGE = "./image/flip.jpg";
  const LEVELS = {
    easy: { pairs: 4, seconds: 90 },
    medium: { pairs: 6, seconds: 110 },
    hard: { pairs: 8, seconds: 140 }
  };
  const BEST_STORAGE = "hisokagaym-memory-best-v1";
  const SOUND_STORAGE = "hisokagaym-effects";
  const MUSIC_STORAGE = "hisokagaym-music";
  const $ = (id) => document.getElementById(id);

  const elements = {
    board: $("card-board"),
    loadPanel: $("load-panel"),
    loadTitle: $("load-title"),
    loadMessage: $("load-message"),
    loadBar: $("load-progress"),
    loadFill: $("load-progress-fill"),
    loadCount: $("load-count"),
    retryLoad: $("retry-load"),
    readyPanel: $("ready-panel"),
    pauseCover: $("pause-cover"),
    start: $("start-button"),
    restart: $("restart-button"),
    pause: $("pause-button"),
    status: $("game-status"),
    note: $("game-note"),
    score: $("score"),
    moves: $("moves"),
    pairs: $("pairs"),
    timer: $("timer"),
    best: $("best-score"),
    combo: $("combo-text"),
    progress: $("match-progress"),
    progressFill: $("match-progress-fill"),
    levelButtons: Array.from(document.querySelectorAll("[data-level]")),
    sfx: $("sfx-toggle"),
    music: $("music-toggle"),
    modal: $("result-overlay"),
    resultIcon: $("result-icon"),
    resultKicker: $("result-kicker"),
    resultTitle: $("result-title"),
    resultMessage: $("result-message"),
    resultScore: $("result-score"),
    resultMoves: $("result-moves"),
    resultTime: $("result-time"),
    resultRecord: $("result-record"),
    playAgain: $("play-again-button"),
    changeLevel: $("change-level-button")
  };

  function readValue(key, fallback) {
    try { return localStorage.getItem(key) ?? fallback; }
    catch (_) { return fallback; }
  }
  function writeValue(key, value) {
    try { localStorage.setItem(key, value); }
    catch (error) { console.warn("Unable to save game settings:", error); }
  }
  function bestScores() {
    try {
      const data = JSON.parse(readValue(BEST_STORAGE, "{}"));
      return data && typeof data === "object" && !Array.isArray(data) ? data : {};
    } catch (_) { return {}; }
  }
  function formatTime(totalSeconds) {
    const n = Math.max(0, Math.ceil(totalSeconds));
    return String(Math.floor(n / 60)).padStart(2, "0") + ":" +
      String(n % 60).padStart(2, "0");
  }
  function shuffle(items) {
    const result = [...items];
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  }

  // Browser-generated, original sounds: no audio files, downloads or copyrighted music.
  const audio = (() => {
    let context = null;
    let musicInterval = null;
    let step = 0;
    const notes = [220, 261.63, 329.63, 261.63, 196, 246.94, 293.66, 246.94];
    let effectsEnabled = readValue(SOUND_STORAGE, "on") !== "off";
    let musicEnabled = readValue(MUSIC_STORAGE, "off") === "on";

    function contextReady() {
      const Audio = window.AudioContext || window.webkitAudioContext;
      if (!Audio) return null;
      if (!context) {
        try { context = new Audio(); }
        catch (_) { return null; }
      }
      if (context.state === "suspended") context.resume().catch(() => {});
      return context;
    }
    function tone(frequency, duration = 0.12, volume = 0.05, type = "sine", delay = 0) {
      const ctx = contextReady();
      if (!ctx) return;
      const oscillator = ctx.createOscillator();
      const gain = ctx.createGain();
      const start = ctx.currentTime + delay;
      oscillator.type = type;
      oscillator.frequency.setValueAtTime(frequency, start);
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(Math.max(volume, 0.0002), start + 0.018);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
      oscillator.connect(gain);
      gain.connect(ctx.destination);
      oscillator.start(start);
      oscillator.stop(start + duration + 0.015);
      oscillator.onended = () => { oscillator.disconnect(); gain.disconnect(); };
    }
    function effect(name) {
      if (!effectsEnabled) return;
      if (name === "flip") tone(440, 0.08, 0.028, "triangle");
      if (name === "match") {
        tone(523.25, 0.16, 0.042, "sine");
        tone(783.99, 0.2, 0.04, "sine", 0.10);
      }
      if (name === "miss") tone(196, 0.18, 0.037, "triangle");
      if (name === "start") {
        tone(392, 0.15, 0.035);
        tone(523.25, 0.18, 0.035, "sine", 0.12);
      }
      if (name === "win") {
        [523.25, 659.26, 783.99, 1046.5].forEach((frequency, index) =>
          tone(frequency, 0.36, 0.055, "sine", index * 0.14));
      }
      if (name === "lose") {
        tone(293.66, 0.25, 0.04, "sine");
        tone(220, 0.36, 0.035, "sine", 0.22);
      }
    }
    function musicStep() {
      if (!musicEnabled || document.hidden || game.phase !== "playing") return;
      tone(notes[step % notes.length], 1.15, 0.013, "sine");
      step++;
    }
    function stopMusic() {
      if (musicInterval !== null) {
        clearInterval(musicInterval);
        musicInterval = null;
      }
    }
    function startMusic() {
      stopMusic();
      if (!musicEnabled || document.hidden || game.phase !== "playing") return;
      contextReady();
      musicStep();
      musicInterval = setInterval(musicStep, 1500);
    }
    function updateButtons() {
      elements.sfx.setAttribute("aria-pressed", String(effectsEnabled));
      elements.sfx.innerHTML = effectsEnabled ? "🔊 <span>Effects On</span>" : "🔇 <span>Effects Off</span>";
      elements.music.setAttribute("aria-pressed", String(musicEnabled));
      elements.music.innerHTML = musicEnabled ? "♫ <span>Music On</span>" : "♫ <span>Music Off</span>";
      elements.music.classList.toggle("is-active", musicEnabled);
      elements.sfx.classList.toggle("is-active", effectsEnabled);
    }
    elements.sfx.addEventListener("click", () => {
      effectsEnabled = !effectsEnabled;
      writeValue(SOUND_STORAGE, effectsEnabled ? "on" : "off");
      if (effectsEnabled) effect("flip");
      updateButtons();
    });
    elements.music.addEventListener("click", () => {
      musicEnabled = !musicEnabled;
      writeValue(MUSIC_STORAGE, musicEnabled ? "on" : "off");
      if (musicEnabled) startMusic();
      else stopMusic();
      updateButtons();
    });
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) stopMusic();
      else if (musicEnabled && game.phase === "playing") startMusic();
    });
    updateButtons();
    return { effect, startMusic, stopMusic };
  })();

  const game = {
    level: "easy",
    phase: "loading", // loading, load-error, ready, playing, paused, won, lost
    assetsReady: false,
    preloadedImages: [],
    score: 0,
    moves: 0,
    matchedPairs: 0,
    combo: 0,
    first: null,
    locked: false,
    timeout: null,
    timerInterval: null,
    secondsLeft: LEVELS.easy.seconds,
    deadline: 0,
    version: 0,
    loadVersion: 0
  };

  function setStatus(message, type = "") {
    elements.status.textContent = message;
    elements.status.className = "status-pill" + (type ? " is-" + type : "");
  }
  function updateHud() {
    const settings = LEVELS[game.level];
    elements.score.textContent = String(game.score);
    elements.moves.textContent = String(game.moves);
    elements.pairs.textContent = game.matchedPairs + "/" + settings.pairs;
    elements.timer.textContent = formatTime(game.secondsLeft);
    elements.timer.classList.toggle("is-urgent", game.secondsLeft <= 15 && game.phase === "playing");
    const best = Number(bestScores()[game.level]) || 0;
    elements.best.textContent = best > 0 ? best.toLocaleString() + " pts" : "—";
    elements.combo.textContent = game.combo >= 2 ? "🔥 " + game.combo + "x combo!" : "";
    elements.progress.setAttribute("aria-valuemax", String(settings.pairs));
    elements.progress.setAttribute("aria-valuenow", String(game.matchedPairs));
    elements.progressFill.style.width = (100 * game.matchedPairs / settings.pairs) + "%";
  }
  function syncControls() {
    const active = game.phase === "playing";
    elements.start.disabled = !game.assetsReady || game.phase !== "ready";
    elements.start.hidden = ["playing", "paused", "won", "lost"].includes(game.phase);
    elements.restart.disabled = !game.assetsReady || game.phase === "loading" || game.phase === "load-error" || game.phase === "ready";
    elements.pause.disabled = !(active || game.phase === "paused") || game.locked;
    elements.pause.textContent = game.phase === "paused" ? "▶ Resume" : "Ⅱ Pause";
    elements.pauseCover.hidden = game.phase !== "paused";
    elements.board.classList.toggle("is-paused", game.phase === "paused");
    elements.levelButtons.forEach(button => {
      const selected = button.dataset.level === game.level;
      button.classList.toggle("is-active", selected);
      button.setAttribute("aria-pressed", String(selected));
    });
    updateHud();
  }
  function clearPending() {
    if (game.timeout !== null) {
      clearTimeout(game.timeout);
      game.timeout = null;
    }
    if (game.timerInterval !== null) {
      clearInterval(game.timerInterval);
      game.timerInterval = null;
    }
  }
  function prepareReady() {
    game.version++;
    clearPending();
    audio.stopMusic();
    game.phase = game.assetsReady ? "ready" : "loading";
    game.score = 0;
    game.moves = 0;
    game.matchedPairs = 0;
    game.combo = 0;
    game.first = null;
    game.locked = false;
    game.secondsLeft = LEVELS[game.level].seconds;
    game.deadline = 0;
    elements.board.replaceChildren();
    elements.board.hidden = true;
    elements.readyPanel.hidden = !game.assetsReady;
    elements.loadPanel.hidden = game.assetsReady;
    elements.modal.hidden = true;
    elements.note.textContent = "All game pictures are preloaded before the first flip. Your best score is saved per level.";
    setStatus(game.assetsReady ? "Ready to play" : "Loading images…",
      game.assetsReady ? "ready" : "");
    syncControls();
  }

  function loadOneImage(source) {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = async () => {
        // decode() prevents the first card flip from waiting for image decoding.
        if (typeof image.decode === "function") {
          try { await image.decode(); } catch (_) { /* Image loaded; decoding can still be deferred by the browser. */ }
        }
        resolve(image);
      };
      image.onerror = () => reject(new Error("Could not load " + source));
      image.src = source;
    });
  }
  async function preloadImages() {
    const myAttempt = ++game.loadVersion;
    game.assetsReady = false;
    prepareReady();
    const sources = [BACK_IMAGE, ...ASSETS.map(asset => asset.src)];
    let done = 0;
    elements.loadPanel.hidden = false;
    elements.retryLoad.hidden = true;
    elements.loadTitle.textContent = "Preparing your cards…";
    elements.loadMessage.textContent = "Loading the image assets before gameplay starts.";
    elements.loadBar.setAttribute("aria-valuemax", String(sources.length));
    elements.loadFill.style.width = "0%";
    elements.loadCount.textContent = "0 / " + sources.length + " images ready";
    try {
      const images = await Promise.all(sources.map(async (source) => {
        const image = await loadOneImage(source);
        if (myAttempt === game.loadVersion) {
          done++;
          elements.loadFill.style.width = (100 * done / sources.length) + "%";
          elements.loadBar.setAttribute("aria-valuenow", String(done));
          elements.loadCount.textContent = done + " / " + sources.length + " images ready";
        }
        return image;
      }));
      if (myAttempt !== game.loadVersion) return;
      game.preloadedImages = images; // Keep images alive and decoded/cached for the full session.
      game.assetsReady = true;
      prepareReady();
    } catch (error) {
      if (myAttempt !== game.loadVersion) return;
      console.error("Image preload failed:", error);
      game.phase = "load-error";
      setStatus("Image load failed", "error");
      elements.loadTitle.textContent = "Could not load all cards";
      elements.loadMessage.textContent = "Check your connection and try again. The game will only start once every image is ready.";
      elements.retryLoad.hidden = false;
      syncControls();
    }
  }

  function createCard(asset, index) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "memory-card";
    button.setAttribute("aria-label", "Hidden card " + (index + 1));
    button.setAttribute("aria-pressed", "false");
    button.dataset.key = asset.key;

    const flipper = document.createElement("span");
    flipper.className = "card-flipper";
    const back = document.createElement("span");
    back.className = "card-face card-back";
    const backImage = document.createElement("img");
    backImage.src = BACK_IMAGE;
    backImage.alt = "";
    backImage.draggable = false;
    back.appendChild(backImage);

    const front = document.createElement("span");
    front.className = "card-face card-front";
    const frontImage = document.createElement("img");
    frontImage.src = asset.src;
    frontImage.alt = "";
    frontImage.draggable = false;
    front.appendChild(frontImage);

    flipper.append(back, front);
    button.appendChild(flipper);
    const card = { button, key: asset.key, name: asset.key, faceUp: false, matched: false };
    button.addEventListener("click", () => flipCard(card));
    return card;
  }
  function reveal(card) {
    card.faceUp = true;
    card.button.classList.add("is-flipped");
    card.button.setAttribute("aria-pressed", "true");
    card.button.setAttribute("aria-label", "Revealed: " + card.name);
  }
  function conceal(card) {
    card.faceUp = false;
    card.button.classList.remove("is-flipped");
    card.button.setAttribute("aria-pressed", "false");
    card.button.setAttribute("aria-label", "Hidden card");
  }
  function startTimer() {
    clearInterval(game.timerInterval);
    game.deadline = performance.now() + game.secondsLeft * 1000;
    game.timerInterval = setInterval(() => {
      if (game.phase !== "playing") return;
      game.secondsLeft = Math.max(0, (game.deadline - performance.now()) / 1000);
      updateHud();
      if (game.secondsLeft <= 0) finish(false);
    }, 100);
  }
  function startRound() {
    if (!game.assetsReady) return;
    game.version++;
    clearPending();
    game.score = 0;
    game.moves = 0;
    game.matchedPairs = 0;
    game.combo = 0;
    game.first = null;
    game.locked = false;
    game.secondsLeft = LEVELS[game.level].seconds;
    game.phase = "playing";

    const selected = shuffle(ASSETS).slice(0, LEVELS[game.level].pairs);
    const deck = shuffle([...selected, ...selected]);
    const fragment = document.createDocumentFragment();
    deck.forEach((asset, index) => fragment.appendChild(createCard(asset, index).button));
    elements.board.replaceChildren(fragment);
    elements.board.className = "card-board level-" + game.level;
    elements.board.hidden = false;
    elements.readyPanel.hidden = true;
    elements.loadPanel.hidden = true;
    elements.modal.hidden = true;
    elements.note.textContent = "Find matching pairs. A correct streak builds your combo bonus!";
    setStatus("Game in progress", "playing");
    syncControls();
    startTimer();
    audio.effect("start");
    audio.startMusic();
  }

  function flipCard(card) {
    if (game.phase !== "playing" || game.locked || card.faceUp || card.matched) return;
    reveal(card);
    audio.effect("flip");
    if (!game.first) {
      game.first = card;
      return;
    }

    const first = game.first;
    const second = card;
    game.first = null;
    game.moves++;
    game.locked = true;
    const myVersion = game.version;

    if (first.key === second.key) {
      first.matched = true;
      second.matched = true;
      game.matchedPairs++;
      game.combo++;
      game.score += 100 + Math.max(0, game.combo - 1) * 25;
      audio.effect("match");
      // Freeze the clock immediately after the final match, not after the animation.
      if (game.matchedPairs === LEVELS[game.level].pairs) {
        game.secondsLeft = Math.max(0, (game.deadline - performance.now()) / 1000);
        clearInterval(game.timerInterval);
        game.timerInterval = null;
      }
      game.timeout = setTimeout(() => {
        if (myVersion !== game.version) return;
        first.button.classList.add("is-matched");
        second.button.classList.add("is-matched");
        first.button.disabled = true;
        second.button.disabled = true;
        game.locked = false;
        if (game.matchedPairs === LEVELS[game.level].pairs) finish(true);
        else syncControls();
      }, 340);
    } else {
      game.combo = 0;
      game.score = Math.max(0, game.score - 15);
      audio.effect("miss");
      game.timeout = setTimeout(() => {
        if (myVersion !== game.version) return;
        conceal(first);
        conceal(second);
        game.locked = false;
        syncControls();
      }, 950);
    }
    syncControls();
  }

  function finish(won) {
    if (game.phase !== "playing") return;
    clearPending();
    game.phase = won ? "won" : "lost";
    game.locked = false;
    audio.stopMusic();
    if (won) game.score += Math.floor(Math.max(0, game.secondsLeft)) * 2;
    if (!won) game.secondsLeft = 0;
    let newRecord = false;
    if (won) {
      const scores = bestScores();
      const oldBest = Number(scores[game.level]) || 0;
      if (game.score > oldBest) {
        scores[game.level] = game.score;
        writeValue(BEST_STORAGE, JSON.stringify(scores));
        newRecord = true;
      }
    }
    setStatus(won ? "Victory!" : "Time's up", won ? "win" : "error");
    syncControls();
    audio.effect(won ? "win" : "lose");
    elements.resultIcon.textContent = won ? "🏆" : "⌛";
    elements.resultKicker.textContent = won ? "LEVEL CLEARED" : "ROUND OVER";
    elements.resultTitle.textContent = won ? "Outstanding memory!" : "Time's up!";
    elements.resultMessage.textContent = won
      ? "All " + LEVELS[game.level].pairs + " pairs matched. Try again and beat your score!"
      : "You found " + game.matchedPairs + " of " + LEVELS[game.level].pairs +
        " pairs. Play again and improve your strategy.";
    elements.resultScore.textContent = game.score.toLocaleString();
    elements.resultMoves.textContent = String(game.moves);
    elements.resultTime.textContent = formatTime(game.secondsLeft);
    elements.resultRecord.textContent = newRecord ? "★ New personal best!" :
      (won ? "Nice work! Keep pushing for a new record." : "Keep practicing — you've got this.");
    elements.modal.hidden = false;
    elements.playAgain.focus();
  }

  function pauseOrResume() {
    if (game.locked) return;
    if (game.phase === "playing") {
      game.secondsLeft = Math.max(0, (game.deadline - performance.now()) / 1000);
      clearInterval(game.timerInterval);
      game.timerInterval = null;
      game.phase = "paused";
      audio.stopMusic();
      setStatus("Paused", "ready");
    } else if (game.phase === "paused") {
      game.phase = "playing";
      setStatus("Game in progress", "playing");
      startTimer();
      audio.startMusic();
    } else return;
    syncControls();
  }

  elements.levelButtons.forEach(button => button.addEventListener("click", () => {
    const level = button.dataset.level;
    if (!LEVELS[level] || level === game.level) return;
    if (["playing", "paused"].includes(game.phase) &&
        !window.confirm("Switch difficulty? Your current round will be lost.")) return;
    game.level = level;
    prepareReady();
  }));
  elements.start.addEventListener("click", startRound);
  elements.restart.addEventListener("click", () => {
    if (["playing", "paused"].includes(game.phase) &&
        !window.confirm("Restart this round? Your current progress will be lost.")) return;
    startRound();
  });
  elements.pause.addEventListener("click", pauseOrResume);
  elements.retryLoad.addEventListener("click", preloadImages);
  elements.playAgain.addEventListener("click", startRound);
  elements.changeLevel.addEventListener("click", () => {
    prepareReady();
    elements.levelButtons[0].focus();
  });

  // Stop timers when leaving the page; avoid ghost callbacks after a restart.
  window.addEventListener("pagehide", () => {
    clearPending();
    audio.stopMusic();
  });

  updateHud();
  syncControls();
  preloadImages();
})();
