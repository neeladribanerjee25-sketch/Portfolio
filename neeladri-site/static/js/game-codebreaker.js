/*
  CODE BREAKER — a Mastermind-style logic puzzle.
  Crack a hidden 4-color passcode in 8 attempts or fewer.
  Click a color swatch to fill the next peg in your guess,
  click a filled peg to clear it, then hit "submit".
  Feedback pegs: solid = right color & position, hollow = right color, wrong spot.

  Drop-in replacement for game.js — same #gameCanvas / #score / #best / #startBtn
  hooks as the platformer, so you can swap the <script> tag in index.html
  from static/js/game.js to static/js/game-codebreaker.js and it just works.
*/
(function () {
  const canvas = document.getElementById("gameCanvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const W = canvas.width, H = canvas.height;
  const scoreEl = document.getElementById("score");
  const bestEl = document.getElementById("best");
  const startBtn = document.getElementById("startBtn");

  const INK = "#16181d", DIM = "#9aa0ab", LINE = "#e6e8eb", PANEL = "#ffffff";
  const COLORS = ["#2f5fff", "#ff6b57", "#16b981", "#f5a623", "#8b5cf6", "#64748b"];
  const CODE_LEN = 4;
  const MAX_ATTEMPTS = 8;

  const PEG_R = 15;
  const ROW_H = 30;
  const BOARD_TOP = 16;
  const BOARD_LEFT = 30;
  const SLOT_GAP = 40;

  const PALETTE_Y = H - 96;
  const PALETTE_LEFT = 30;
  const PALETTE_GAP = 46;

  const GUESS_Y = H - 40;
  const GUESS_LEFT = 30;

  let secret, guesses, current, attemptsLeft, bestAttempts, running, message;

  function randomCode() {
    const code = [];
    for (let i = 0; i < CODE_LEN; i++) {
      code.push(COLORS[Math.floor(Math.random() * COLORS.length)]);
    }
    return code;
  }

  function scoreGuess(guess) {
    const secretCopy = secret.slice();
    const guessCopy = guess.slice();
    let exact = 0;
    for (let i = 0; i < CODE_LEN; i++) {
      if (guessCopy[i] === secretCopy[i]) {
        exact++;
        secretCopy[i] = null;
        guessCopy[i] = null;
      }
    }
    let partial = 0;
    for (let i = 0; i < CODE_LEN; i++) {
      if (guessCopy[i] === null) continue;
      const idx = secretCopy.indexOf(guessCopy[i]);
      if (idx !== -1) {
        partial++;
        secretCopy[idx] = null;
      }
    }
    return { exact, partial };
  }

  function reset() {
    secret = randomCode();
    guesses = [];
    current = [];
    attemptsLeft = MAX_ATTEMPTS;
    running = true;
    message = "crack the code";
    scoreEl.textContent = String(MAX_ATTEMPTS);
  }

  function submitGuess() {
    if (current.length !== CODE_LEN || !running) return;
    const result = scoreGuess(current);
    guesses.push({ guess: current.slice(), result });
    attemptsLeft--;
    scoreEl.textContent = String(attemptsLeft);

    if (result.exact === CODE_LEN) {
      running = false;
      const used = MAX_ATTEMPTS - attemptsLeft;
      if (bestAttempts === null || used < bestAttempts) {
        bestAttempts = used;
        bestEl.textContent = String(bestAttempts);
      }
      message = "code cracked in " + used;
    } else if (attemptsLeft <= 0) {
      running = false;
      message = "out of attempts";
    } else {
      message = "crack the code";
    }
    current = [];
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);

    ctx.fillStyle = INK;
    ctx.font = "600 15px Sora, sans-serif";
    ctx.textAlign = "left";
    ctx.fillText(message, BOARD_LEFT, BOARD_TOP + 4);

    guesses.forEach((row, r) => {
      const y = BOARD_TOP + 26 + r * ROW_H;
      row.guess.forEach((c, i) => {
        drawPeg(BOARD_LEFT + i * SLOT_GAP, y, PEG_R, c, true);
      });
      const fx = BOARD_LEFT + CODE_LEN * SLOT_GAP + 20;
      let fi = 0;
      for (let e = 0; e < row.result.exact; e++) {
        drawFeedback(fx + (fi % 4) * 14, y - 8 + Math.floor(fi / 4) * 14, INK, true);
        fi++;
      }
      for (let p = 0; p < row.result.partial; p++) {
        drawFeedback(fx + (fi % 4) * 14, y - 8 + Math.floor(fi / 4) * 14, DIM, false);
        fi++;
      }
    });

    ctx.fillStyle = DIM;
    ctx.font = "500 11px JetBrains Mono, monospace";
    ctx.fillText("pick colors:", PALETTE_LEFT, PALETTE_Y - 14);
    COLORS.forEach((c, i) => {
      drawPeg(PALETTE_LEFT + i * PALETTE_GAP, PALETTE_Y, PEG_R, c, true);
    });

    ctx.fillStyle = DIM;
    ctx.fillText("your guess:", GUESS_LEFT, GUESS_Y - 20);
    for (let i = 0; i < CODE_LEN; i++) {
      const c = current[i];
      if (c) {
        drawPeg(GUESS_LEFT + i * SLOT_GAP, GUESS_Y, PEG_R, c, true);
      } else {
        ctx.strokeStyle = LINE;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(GUESS_LEFT + i * SLOT_GAP, GUESS_Y, PEG_R, 0, Math.PI * 2);
        ctx.stroke();
      }
    }

    const submitX = GUESS_LEFT + CODE_LEN * SLOT_GAP + 30;
    const canSubmit = current.length === CODE_LEN && running;
    ctx.fillStyle = canSubmit ? "#2f5fff" : LINE;
    roundRect(submitX, GUESS_Y - 16, 90, 32, 8);
    ctx.fill();
    ctx.fillStyle = canSubmit ? "#fff" : DIM;
    ctx.font = "600 12px Inter, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("submit", submitX + 45, GUESS_Y + 4);
    ctx.textAlign = "left";

    if (!running) {
      ctx.fillStyle = "rgba(248,249,250,0.85)";
      ctx.fillRect(0, 0, W, PALETTE_Y - 30);
    }
  }

  function drawPeg(x, y, r, color, filled) {
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
    ctx.strokeStyle = LINE;
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  function drawFeedback(x, y, color, filled) {
    ctx.beginPath();
    ctx.arc(x, y, 4, 0, Math.PI * 2);
    if (filled) {
      ctx.fillStyle = color;
      ctx.fill();
    } else {
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }
  }

  function roundRect(x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  canvas.addEventListener("click", (e) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = W / rect.width;
    const scaleY = H / rect.height;
    const mx = (e.clientX - rect.left) * scaleX;
    const my = (e.clientY - rect.top) * scaleY;

    if (!running) return;

    COLORS.forEach((c, i) => {
      const cx = PALETTE_LEFT + i * PALETTE_GAP, cy = PALETTE_Y;
      if (Math.hypot(mx - cx, my - cy) < PEG_R && current.length < CODE_LEN) {
        current.push(c);
      }
    });

    for (let i = 0; i < current.length; i++) {
      const cx = GUESS_LEFT + i * SLOT_GAP, cy = GUESS_Y;
      if (Math.hypot(mx - cx, my - cy) < PEG_R) {
        current.splice(i, 1);
      }
    }

    const submitX = GUESS_LEFT + CODE_LEN * SLOT_GAP + 30;
    if (mx > submitX && mx < submitX + 90 && my > GUESS_Y - 16 && my < GUESS_Y + 16) {
      submitGuess();
    }

    draw();
  });

  startBtn.addEventListener("click", () => {
    reset();
    draw();
  });

  bestAttempts = null;
  reset();
  running = false;
  message = "press start";
  draw();
})();
