 /*
  BRUTE FORCE — crack the passcode to unlock the system.
  Click the panel (or mash space) to force each character to resolve.
  Left untouched, it cracks itself slowly on its own; click fast to
  speed it up. Progress bar climbs 0 -> 100%, characters lock in one
  by one, and at 100% the system flips to ACCESS GRANTED.

  Same #gameCanvas / #score / #best / #startBtn hooks as the other
  game files -- drop-in swap in index.html's <script src="..."> tag.
*/
(function () {
  const canvas = document.getElementById("gameCanvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const W = canvas.width, H = canvas.height;
  const scoreEl = document.getElementById("score");
  const bestEl = document.getElementById("best");
  const startBtn = document.getElementById("startBtn");

  function readColors() {
    const s = getComputedStyle(document.documentElement);
    return {
      INK: s.getPropertyValue("--ink").trim() || "#16181d",
      DIM: s.getPropertyValue("--dim").trim() || "#9aa0ab",
      LINE: s.getPropertyValue("--line").trim() || "#e6e8eb",
      PANEL: s.getPropertyValue("--panel").trim() || "#ffffff",
      ACCENT: s.getPropertyValue("--accent").trim() || "#2f5fff",
      MINT: s.getPropertyValue("--mint").trim() || "#16b981",
      CORAL: s.getPropertyValue("--coral").trim() || "#ff6b57",
    };
  }
  let C = readColors();
  window.addEventListener("themechange", () => { C = readColors(); });

  const CHARSET = "0123456789ABCDEF";
  const CODE_LEN = 6;
  const PASSIVE_RATE = 0.045;   // %/frame, auto-crack while idle
  const CLICK_BOOST = 2.4;      // %/click

  let secret, percent, running, unlocked, startTime, elapsed, bestTime;
  let scrambleTick, particles;

  function randomCode() {
    let s = "";
    for (let i = 0; i < CODE_LEN; i++) {
      s += CHARSET[Math.floor(Math.random() * CHARSET.length)];
    }
    return s;
  }

  function reset() {
    secret = randomCode();
    percent = 0;
    running = true;
    unlocked = false;
    startTime = performance.now();
    elapsed = 0;
    scrambleTick = 0;
    particles = [];
    scoreEl.textContent = "0%";
  }

  function boost(amount) {
    if (!running || unlocked) return;
    percent = Math.min(100, percent + amount);
  }

  function spawnParticles() {
    for (let i = 0; i < 40; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1.5 + Math.random() * 3;
      particles.push({
        x: W / 2, y: H / 2 - 20,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 40 + Math.random() * 20,
        color: [C.MINT, C.ACCENT, C.CORAL][Math.floor(Math.random() * 3)],
      });
    }
  }

  function triggerSiteUnlock() {
    const lock = document.getElementById("lockScreen");
    const site = document.getElementById("siteContent");
    if (!lock || !site) return;
    site.classList.remove("hidden");
    // force reflow so the opacity transition actually runs
    void site.offsetWidth;
    lock.classList.add("unlocking");
    setTimeout(() => {
      lock.style.display = "none";
      window.scrollTo(0, 0);
    }, 650);
  }

  function update() {
    if (running && !unlocked) {
      percent = Math.min(100, percent + PASSIVE_RATE);
      elapsed = (performance.now() - startTime) / 1000;
      if (percent >= 100) {
        unlocked = true;
        running = false;
        if (bestTime === null || elapsed < bestTime) {
          bestTime = elapsed;
          bestEl.textContent = bestTime.toFixed(1) + "s";
        }
        spawnParticles();
        setTimeout(triggerSiteUnlock, 1200);
      }
    }
    scoreEl.textContent = Math.floor(percent) + "%";

    particles.forEach((p) => {
      p.x += p.vx; p.y += p.vy; p.vy += 0.05; p.life -= 1;
    });
    particles = particles.filter((p) => p.life > 0);
  }

  function revealedCount() {
    return Math.floor((percent / 100) * CODE_LEN);
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);

    ctx.fillStyle = C.PANEL;
    ctx.fillRect(0, 0, W, H);

    ctx.fillStyle = C.DIM;
    ctx.font = "500 11px JetBrains Mono, monospace";
    ctx.textAlign = "left";
    ctx.fillText(unlocked ? "STATUS: UNLOCKED" : running ? "STATUS: BRUTEFORCING..." : "STATUS: IDLE", 30, 34);

    // code readout
    const codeY = 100;
    const slotW = 56;
    const totalW = CODE_LEN * slotW;
    const startX = (W - totalW) / 2;
    const rc = revealedCount();

    scrambleTick++;
    for (let i = 0; i < CODE_LEN; i++) {
      const x = startX + i * slotW + slotW / 2;
      const locked = i < rc || unlocked;
      let ch;
      if (locked) {
        ch = secret[i];
      } else if (scrambleTick % 3 === 0) {
        ch = CHARSET[Math.floor(Math.random() * CHARSET.length)];
      } else {
        ch = CHARSET[Math.floor(Math.random() * CHARSET.length)];
      }

      ctx.strokeStyle = locked ? C.MINT : C.LINE;
      ctx.lineWidth = 2;
      roundRect(x - 22, codeY - 26, 44, 52, 8);
      ctx.stroke();

      ctx.fillStyle = locked ? C.MINT : C.INK;
      ctx.font = "700 22px JetBrains Mono, monospace";
      ctx.textAlign = "center";
      ctx.fillText(ch, x, codeY + 8);
    }

    // progress bar
    const barY = 170, barW = totalW, barX = startX, barH = 14;
    ctx.strokeStyle = C.LINE;
    roundRect(barX, barY, barW, barH, 7);
    ctx.stroke();
    ctx.fillStyle = unlocked ? C.MINT : C.ACCENT;
    const fillW = Math.max(0, (barW - 4) * (percent / 100));
    roundRect(barX + 2, barY + 2, fillW, barH - 4, 5);
    ctx.fill();

    ctx.fillStyle = C.DIM;
    ctx.font = "500 11px JetBrains Mono, monospace";
    ctx.textAlign = "center";
    ctx.fillText(Math.floor(percent) + "% cracked", W / 2, barY + 34);

    // hint / message
    ctx.fillStyle = C.DIM;
    ctx.font = "400 12px Inter, sans-serif";
    if (!running && !unlocked) {
      ctx.fillText("press start, then click the panel to force it", W / 2, barY + 60);
    } else if (running) {
      ctx.fillText("click anywhere or mash space to speed it up", W / 2, barY + 60);
    }

    if (unlocked) {
      ctx.fillStyle = "rgba(22,185,129,0.08)";
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = C.MINT;
      ctx.font = "700 22px Sora, sans-serif";
      ctx.fillText("ACCESS GRANTED", W / 2, H - 60);
      ctx.fillStyle = C.DIM;
      ctx.font = "400 12px Inter, sans-serif";
      ctx.fillText("cracked in " + elapsed.toFixed(1) + "s — opening site...", W / 2, H - 38);

      particles.forEach((p) => {
        ctx.fillStyle = p.color;
        ctx.globalAlpha = Math.max(0, p.life / 60);
        ctx.beginPath();
        ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
      });
    }
    ctx.textAlign = "left";
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

  function loop() {
    update();
    draw();
    requestAnimationFrame(loop);
  }

  canvas.addEventListener("click", () => boost(CLICK_BOOST));
  window.addEventListener("keydown", (e) => {
    if (e.key === " ") { e.preventDefault(); boost(CLICK_BOOST); }
  });

  startBtn.addEventListener("click", reset);

  bestTime = null;
  secret = randomCode();
  percent = 0;
  running = false;
  unlocked = false;
  elapsed = 0;
  particles = [];
  draw();
  requestAnimationFrame(loop);
})();