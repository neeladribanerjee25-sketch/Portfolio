/*
  BACKGROUND SHOOTER — a rocket you fly and shoot with while browsing
  the rest of the site. Sits on a fixed, click-through canvas behind
  the page content (z-index 0, same layer as the grid overlay), so
  it never blocks links or scrolling. Controlled entirely by keyboard
  (WASD / arrow keys to fly, space to shoot) so mouse clicks always
  reach the real page underneath.
*/
(function () {
  const canvas = document.getElementById("bgGame");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const scoreEl = document.getElementById("bgGameScore");
  const bestEl = document.getElementById("bgGameBest");
  const hud = document.getElementById("bgGameHud");

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduceMotion) { if (hud) hud.style.display = "none"; return; }

  function readColors() {
    const s = getComputedStyle(document.documentElement);
    return {
      ACCENT: s.getPropertyValue("--accent").trim() || "#2f5fff",
      CORAL: s.getPropertyValue("--coral").trim() || "#ff6b57",
      MINT: s.getPropertyValue("--mint").trim() || "#16b981",
      DIM: s.getPropertyValue("--dim").trim() || "#9aa0ab",
    };
  }
  let C = readColors();
  window.addEventListener("themechange", () => { C = readColors(); });

  let W, H;
  function resize() {
    W = canvas.width = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }
  resize();
  window.addEventListener("resize", resize);

  const KEY = "neeladri-bg-shooter-best";
  let best = 0;
  try { best = parseInt(localStorage.getItem(KEY), 10) || 0; } catch (e) {}
  if (bestEl) bestEl.textContent = String(best);

  const rocket = { x: W / 2, y: H * 0.8, vx: 0, vy: 0, angle: -Math.PI / 2 };
  const THRUST = 0.35;
  const MAX_SPEED = 5.5;
  const FRICTION = 0.965;

  let bullets = [];
  let targets = [];
  let score = 0;
  let fireCooldown = 0;

  const keys = {};
  window.addEventListener("keydown", (e) => {
    const tag = (e.target && e.target.tagName) || "";
    if (tag === "INPUT" || tag === "TEXTAREA") return;
    keys[e.key.toLowerCase()] = true;
    if (e.key === " ") e.preventDefault();
  });
  window.addEventListener("keyup", (e) => { keys[e.key.toLowerCase()] = false; });

  function spawnTarget() {
    const edge = Math.floor(Math.random() * 4);
    let x, y;
    if (edge === 0) { x = -20; y = Math.random() * H; }
    else if (edge === 1) { x = W + 20; y = Math.random() * H; }
    else if (edge === 2) { x = Math.random() * W; y = -20; }
    else { x = Math.random() * W; y = H + 20; }
    const angle = Math.random() * Math.PI * 2;
    targets.push({
      x, y,
      vx: Math.cos(angle) * 0.6,
      vy: Math.sin(angle) * 0.6,
      r: 12 + Math.random() * 6,
      color: Math.random() < 0.5 ? C.CORAL : C.MINT,
      spin: 0,
    });
  }

  let spawnTimer = 0;

  function update() {
    // rocket controls
    let thrustX = 0, thrustY = 0;
    if (keys["arrowleft"] || keys["a"]) thrustX -= 1;
    if (keys["arrowright"] || keys["d"]) thrustX += 1;
    if (keys["arrowup"] || keys["w"]) thrustY -= 1;
    if (keys["arrowdown"] || keys["s"]) thrustY += 1;

    if (thrustX || thrustY) {
      const len = Math.hypot(thrustX, thrustY) || 1;
      rocket.vx += (thrustX / len) * THRUST;
      rocket.vy += (thrustY / len) * THRUST;
      rocket.angle = Math.atan2(thrustY, thrustX);
    }

    rocket.vx *= FRICTION;
    rocket.vy *= FRICTION;
    const speed = Math.hypot(rocket.vx, rocket.vy);
    if (speed > MAX_SPEED) {
      rocket.vx = (rocket.vx / speed) * MAX_SPEED;
      rocket.vy = (rocket.vy / speed) * MAX_SPEED;
    }

    rocket.x += rocket.vx;
    rocket.y += rocket.vy;
    rocket.x = Math.max(16, Math.min(W - 16, rocket.x));
    rocket.y = Math.max(16, Math.min(H - 16, rocket.y));

    // firing
    fireCooldown = Math.max(0, fireCooldown - 1);
    if (keys[" "] && fireCooldown === 0) {
      bullets.push({
        x: rocket.x + Math.cos(rocket.angle) * 14,
        y: rocket.y + Math.sin(rocket.angle) * 14,
        vx: Math.cos(rocket.angle) * 8,
        vy: Math.sin(rocket.angle) * 8,
        life: 70,
      });
      fireCooldown = 9;
      if (window.NeeladriSound) window.NeeladriSound.shoot();
    }

    // spawn targets over time, cap concurrent count
    spawnTimer++;
    if (spawnTimer > 90 && targets.length < 8) {
      spawnTarget();
      spawnTimer = 0;
    }

    // update bullets
    bullets.forEach((b) => { b.x += b.vx; b.y += b.vy; b.life--; });
    bullets = bullets.filter((b) => b.life > 0 && b.x > -20 && b.x < W + 20 && b.y > -20 && b.y < H + 20);

    // update targets
    targets.forEach((t) => {
      t.x += t.vx; t.y += t.vy; t.spin += 0.02;
      if (t.x < -30) t.x = W + 30;
      if (t.x > W + 30) t.x = -30;
      if (t.y < -30) t.y = H + 30;
      if (t.y > H + 30) t.y = -30;
    });

    // collisions
    for (let i = bullets.length - 1; i >= 0; i--) {
      const b = bullets[i];
      for (let j = targets.length - 1; j >= 0; j--) {
        const t = targets[j];
        if (Math.hypot(b.x - t.x, b.y - t.y) < t.r) {
          bullets.splice(i, 1);
          targets.splice(j, 1);
          score++;
          if (window.NeeladriSound) window.NeeladriSound.hit();
          if (scoreEl) scoreEl.textContent = String(score);
          if (score > best) {
            best = score;
            try { localStorage.setItem(KEY, String(best)); } catch (e) {}
            if (bestEl) bestEl.textContent = String(best);
          }
          break;
        }
      }
    }
  }

  function drawRocket() {
    ctx.save();
    ctx.translate(rocket.x, rocket.y);
    ctx.rotate(rocket.angle + Math.PI / 2);
    ctx.fillStyle = C.ACCENT;
    ctx.globalAlpha = 0.85;
    ctx.beginPath();
    ctx.moveTo(0, -14);
    ctx.lineTo(8, 10);
    ctx.lineTo(0, 5);
    ctx.lineTo(-8, 10);
    ctx.closePath();
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.restore();
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);

    ctx.globalAlpha = 0.8;
    bullets.forEach((b) => {
      ctx.fillStyle = C.ACCENT;
      ctx.beginPath();
      ctx.arc(b.x, b.y, 2.5, 0, Math.PI * 2);
      ctx.fill();
    });

    targets.forEach((t) => {
      ctx.save();
      ctx.translate(t.x, t.y);
      ctx.rotate(t.spin);
      ctx.strokeStyle = t.color;
      ctx.lineWidth = 2;
      ctx.globalAlpha = 0.6;
      ctx.beginPath();
      ctx.arc(0, 0, t.r, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(-t.r * 0.5, 0); ctx.lineTo(t.r * 0.5, 0);
      ctx.moveTo(0, -t.r * 0.5); ctx.lineTo(0, t.r * 0.5);
      ctx.stroke();
      ctx.restore();
    });
    ctx.globalAlpha = 1;

    drawRocket();
  }

  function loop() {
    update();
    draw();
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();
