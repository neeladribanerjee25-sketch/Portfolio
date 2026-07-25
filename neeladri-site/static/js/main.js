(function () {
  const typedEl = document.getElementById("typed");
  const revealEl = document.getElementById("reveal");
  const line = "whoami";
  let i = 0;

  function type() {
    if (i <= line.length) {
      typedEl.textContent = line.slice(0, i);
      i++;
      setTimeout(type, 90);
    } else {
      setTimeout(() => revealEl.classList.add("show"), 200);
    }
  }

  if (typedEl) {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      typedEl.textContent = line;
      revealEl.classList.add("show");
    } else {
      type();
    }
  }
})();

const lines = [
  "training models that generalize",
  "breaking crypto with known-plaintext attacks",
  "shipping side projects, not just ideas",
  "building a research collective",
  "playing games that are more than just games",
  "exploring the intersection of ML and security",
  "learning by doing, not just reading",
  "sharing knowledge through writing and talks"
  ,
];

const target = document.getElementById("typewriter");
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

if (target) {
  if (reduceMotion) {
    target.textContent = lines[0];
  } else {
    let lineIndex = 0;
    let charIndex = 0;
    let deleting = false;

    function tick() {
      const current = lines[lineIndex];

      if (!deleting) {
        charIndex++;
        target.textContent = current.slice(0, charIndex);
        if (charIndex === current.length) {
          deleting = true;
          setTimeout(tick, 1400);
          return;
        }
      } else {
        charIndex--;
        target.textContent = current.slice(0, charIndex);
        if (charIndex === 0) {
          deleting = false;
          lineIndex = (lineIndex + 1) % lines.length;
        }
      }
      setTimeout(tick, deleting ? 28 : 42);
    }
    tick();
  }
}

