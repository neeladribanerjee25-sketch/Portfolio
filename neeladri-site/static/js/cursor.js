/*
  CUSTOM CURSOR — a small dot that tracks the mouse exactly, plus a
  ring that trails behind with a bit of lag for a smoother feel.
  Both grow and change color over links/buttons/cards. Only enabled
  on devices with a real mouse (pointer: fine) and disabled entirely
  if the user prefers reduced motion.
*/
(function () {
  const isFinePointer = window.matchMedia("(pointer: fine)").matches;
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (!isFinePointer || reduceMotion) return;

  const dot = document.getElementById("cursorDot");
  const ring = document.getElementById("cursorRing");
  if (!dot || !ring) return;

  document.documentElement.classList.add("has-custom-cursor");

  let mouseX = window.innerWidth / 2, mouseY = window.innerHeight / 2;
  let ringX = mouseX, ringY = mouseY;
  const EASE = 0.18;

  window.addEventListener("mousemove", (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
    dot.style.left = mouseX + "px";
    dot.style.top = mouseY + "px";
  });

  function loop() {
    ringX += (mouseX - ringX) * EASE;
    ringY += (mouseY - ringY) * EASE;
    ring.style.left = ringX + "px";
    ring.style.top = ringY + "px";
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);

  const HOVER_SELECTOR = "a, button, .btn, .theme-toggle, .card, .gallery-tile, input, textarea, [role='button']";

  document.addEventListener("mouseover", (e) => {
    if (e.target.closest && e.target.closest(HOVER_SELECTOR)) {
      dot.classList.add("hover");
      ring.classList.add("hover");
    }
  });
  document.addEventListener("mouseout", (e) => {
    if (e.target.closest && e.target.closest(HOVER_SELECTOR)) {
      dot.classList.remove("hover");
      ring.classList.remove("hover");
    }
  });

  document.addEventListener("mouseleave", () => {
    dot.style.opacity = "0";
    ring.style.opacity = "0";
  });
  document.addEventListener("mouseenter", () => {
    dot.style.opacity = "";
    ring.style.opacity = "";
  });
})();
