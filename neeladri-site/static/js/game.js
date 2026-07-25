(function () {
  const canvas = document.getElementById("gameCanvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const W = canvas.width, H = canvas.height;
  const scoreEl = document.getElementById("score");
  const bestEl = document.getElementById("best");
  const startBtn = document.getElementById("startBtn");

  const INK = "#16181d", DIM = "#9aa0ab", LINE = "#e6e8eb", ACCENT = "#2f5fff", CORAL = "#ff6b57", MINT = "#16b981", PANEL = "#ffffff";

  const TILE_LABELS = ["about", "hobbies", "gallery", "play", "community", "projects", "contact"];
  const GROUND_Y = H - 60;
  const GRAVITY = 0.6;
  const JUMP_V = -10.5;
  const TILE_W = 96;
  const GAP = 40;

  let player, tiles, orbs, camX, score, bestScore, running, won;

  function buildTrack() {
    tiles = [];
    orbs = [];
    let x = 40;
    TILE_LABELS.forEach((label, i) => {
      const y = GROUND_Y - (i % 3 === 0 ? 0 : i % 3 === 1 ? 30 : 55);
      tiles.push({ x, y, w: TILE_W, label });
      orbs.push({ x: x + TILE_W / 2, y: y - 26, r: 7, collected: false });
      x += TILE_W + GAP;
    });
    return x;
  }

  let trackEnd;

  function reset() {
    trackEnd = buildTrack();
    player = { x: tiles[0].x + 10, y: tiles[0].y - 24, w: 22, h: 24, vy: 0, onGround: true };
    camX = 0;
    score = 0;
    running = true;
    won = false;
    scoreEl.textContent = "0";
  }

  let keys = {};
  window.addEventListener("keydown", (e) => {
    keys[e.key] = true;
    if ((e.key === " " || e.key === "ArrowUp" || e.key === "w") && running) {
      if (player.onGround) {
        player.vy = JUMP_V;
        player.onGround = false;
      }
    }
  });
  window.addEventListener("keyup", (e) => { keys[e.key] = false; });

  function currentTile() {
    return tiles.find(t => player.x + player.w > t.x && player.x < t.x + t.w);
  }

  function update() {
    if (!running) return;

    if (keys["ArrowRight"] || keys["d"]) player.x += 3.2;
    if (keys["ArrowLeft"] || keys["a"]) player.x -= 3.2;
    player.x = Math.max(tiles[0].x, player.x);

    player.vy += GRAVITY;
    player.y += player.vy;

    const under = currentTile();
    const floorY = under ? under.y - player.h : GROUND_Y + 200;
    if (player.y >= floorY) {
      player.y = floorY;
      player.vy = 0;
      player.onGround = true;
    } else {
      player.onGround = false;
    }

    if (player.y > H + 40) {
      endGame(false);
      return;
    }

    orbs.forEach((o) => {
      if (!o.collected) {
        const dx = (player.x + player.w / 2) - o.x;
        const dy = (player.y + player.h / 2) - o.y;
        if (Math.sqrt(dx * dx + dy * dy) < 22) {
          o.collected = true;
          score++;
          scoreEl.textContent = String(score);
        }
      }
    });

    if (player.x > trackEnd - 20) {
      endGame(true);
      return;
    }

    camX = Math.max(0, player.x - W / 2 + 80);
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    ctx.save();
    ctx.translate(-camX, 0);

    ctx.strokeStyle = LINE;
    ctx.lineWidth = 2;
    tiles.forEach((t) => {
      ctx.fillStyle = PANEL;
      ctx.strokeStyle = LINE;
      ctx.beginPath();
      ctx.roundRect(t.x, t.y, t.w, 14, 6);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = DIM;
      ctx.font = "500 10px JetBrains Mono, monospace";
      ctx.textAlign = "center";
      ctx.fillText(t.label, t.x + t.w / 2, t.y + 32);
    });

    orbs.forEach((o) => {
      if (!o.collected) {
        ctx.fillStyle = MINT;
        ctx.beginPath();
        ctx.arc(o.x, o.y, o.r, 0, Math.PI * 2);
        ctx.fill();
      }
    });

    ctx.fillStyle = CORAL;
    ctx.beginPath();
    ctx.roundRect(player.x, player.y, player.w, player.h, 6);
    ctx.fill();

    ctx.restore();

    if (!running) {
      ctx.fillStyle = "rgba(248,249,250,0.9)";
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = INK;
      ctx.font = "600 18px Sora, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(won ? "made it across" : "fell off — try again", W / 2, H / 2 - 4);
      ctx.font = "400 12px Inter, sans-serif";
      ctx.fillStyle = DIM;
      ctx.fillText("press start to replay", W / 2, H / 2 + 18);
    }
  }

  function endGame(didWin) {
    running = false;
    won = didWin;
    if (score > bestScore) {
      bestScore = score;
      bestEl.textContent = String(bestScore);
    }
  }

  function loop() {
    update();
    draw();
    requestAnimationFrame(loop);
  }

  bestScore = 0;
  startBtn.addEventListener("click", reset);

  reset();
  running = false;
  draw();
  requestAnimationFrame(loop);
})();
