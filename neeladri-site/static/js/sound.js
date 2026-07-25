/*
  SOUND — tiny synthesized sound effects via the Web Audio API, no
  audio files needed. Exposes window.NeeladriSound with .shoot(),
  .hit(), .toggle(), .isMuted(). Mute state is saved to localStorage
  and broadcast as a "soundchange" event so any UI (like the toggle
  button) can stay in sync.
*/
window.NeeladriSound = (function () {
  const KEY = "neeladri-sound-muted";
  let muted = false;
  try { muted = localStorage.getItem(KEY) === "1"; } catch (e) {}

  let ctx = null;
  function getCtx() {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
    }
    return ctx;
  }

  function beep({ freq = 440, slideTo = null, duration = 0.08, type = "sine", volume = 0.15 } = {}) {
    if (muted) return;
    const ac = getCtx();
    if (!ac) return;
    try {
      if (ac.state === "suspended") ac.resume();
      const osc = ac.createOscillator();
      const gain = ac.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, ac.currentTime);
      if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, ac.currentTime + duration);
      gain.gain.setValueAtTime(volume, ac.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + duration);
      osc.connect(gain).connect(ac.destination);
      osc.start();
      osc.stop(ac.currentTime + duration);
    } catch (e) {}
  }

  function shoot() {
    beep({ freq: 880, slideTo: 440, duration: 0.07, type: "square", volume: 0.07 });
  }

  function hit() {
    beep({ freq: 220, slideTo: 660, duration: 0.12, type: "triangle", volume: 0.12 });
  }

  function isMuted() { return muted; }

  function setMuted(v) {
    muted = v;
    try { localStorage.setItem(KEY, v ? "1" : "0"); } catch (e) {}
    window.dispatchEvent(new CustomEvent("soundchange", { detail: { muted } }));
  }

  function toggle() {
    setMuted(!muted);
    return muted;
  }

  return { shoot, hit, isMuted, setMuted, toggle };
})();
