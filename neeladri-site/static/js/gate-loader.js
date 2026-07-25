/*
  GATE LOADER — a loading screen that splits open like a gate to
  reveal the site underneath. Replaces the old brute-force lock
  screen: no interaction required, just a short loading readout
  (0 -> 100%) followed by the panels sliding apart.

  Hooks: #gateLoader (container), .gate-left / .gate-right (panels),
  #gateBarFill / #gatePercent (progress readout), #siteContent
  (revealed on open).
*/
(function () {
  const gate = document.getElementById("gateLoader");
  if (!gate) return;

  const fill = document.getElementById("gateBarFill");
  const percentEl = document.getElementById("gatePercent");
  const site = document.getElementById("siteContent");

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const MIN_DURATION = reduceMotion ? 0 : 1600; // ms, minimum time the loader stays up
  const OPEN_DURATION = reduceMotion ? 0 : 1150; // ms, matches the CSS panel transition

  let start = null;
  let pageLoaded = false;

  function setProgress(p) {
    const clamped = Math.max(0, Math.min(100, Math.floor(p)));
    if (fill) fill.style.width = clamped + "%";
    if (percentEl) percentEl.textContent = clamped + "%";
  }

  function openGate() {
    if (site) {
      site.classList.remove("hidden");
      void site.offsetWidth; // force reflow so the fade-in actually runs
    }
    gate.classList.add("opening");
    setTimeout(() => {
      gate.classList.add("done");
      window.scrollTo(0, 0);
    }, OPEN_DURATION);
  }

  function tick(now) {
    if (start === null) start = now;
    const elapsed = now - start;
    const t = Math.min(1, elapsed / Math.max(MIN_DURATION, 1));
    setProgress(t * 100);

    if (t >= 1 && pageLoaded) {
      openGate();
      return;
    }
    requestAnimationFrame(tick);
  }

  window.addEventListener("load", () => { pageLoaded = true; });
  // in case 'load' already fired before this script ran
  if (document.readyState === "complete") pageLoaded = true;

  if (reduceMotion) {
    setProgress(100);
    openGate();
  } else {
    requestAnimationFrame(tick);
  }
})();
