const $wrap = document.querySelector(".card-wrapper");
const $card = document.querySelector("#card");

const cardUpdate = (e) => {
  // normalize pointer position
  var pos = [e.offsetX, e.offsetY];
  if (e.pointerType === "touch") {
    e.preventDefault;
  }
  var dimensions = $card.getBoundingClientRect();
  var l = pos[0];
  var t = pos[1];
  var h = dimensions.height;
  var w = dimensions.width;
  var px = clamp(Math.abs((100 / w) * l), 0, 100);
  var py = clamp(Math.abs((100 / h) * t), 0, 100);
  var cx = px - 50;
  var cy = py - 50;

  $wrap.setAttribute(
    "style",
    `
      --pointer-x: ${px}%;
      --pointer-y: ${py}%;
      --background-x: ${adjust(px, 0, 100, 35, 65)}%;
      --background-y: ${adjust(py, 0, 100, 35, 65)}%;
      --pointer-from-center: ${clamp(
        Math.sqrt((py - 50) * (py - 50) + (px - 50) * (px - 50)) / 50,
        0,
        1
      )};
      --pointer-from-top: ${py / 100};
      --pointer-from-left: ${px / 100};
      --rotate-x: ${round(-(cx / 5))}deg;
      --rotate-y: ${round(cy / 4)}deg;
    `
  );
};

// easing function
function ease(x) {
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
}

function easedFunc(durationMs, onProgress, onComplete) {
  let startTime = performance.now();
  let canceled = false;

  function loop() {
    if (canceled) return;
    const currentTime = performance.now();
    const progress = (currentTime - startTime) / durationMs;
    const easedProgress = ease(progress);
    onProgress(easedProgress);
    if (progress < 1) {
      requestAnimationFrame(loop);
    } else {
      if (onComplete) onComplete();
    }
  }

  loop();

  return {
    cancel: () => {
      canceled = true;
    }
  };
}

// helpers
const round = (value, precision = 3) => parseFloat(value.toFixed(precision));
const clamp = (value, min = 0, max = 100) => Math.min(Math.max(value, min), max);
const adjust = (value, fromMin, fromMax, toMin, toMax) =>
  round(toMin + ((toMax - toMin) * (value - fromMin)) / (fromMax - fromMin));

const halfW = $wrap.clientWidth / 2;
const halfH = $wrap.clientHeight / 2;

let easer;
$card.addEventListener("pointerenter", () => {
  if (easer) {
    easer?.cancel?.();
  }
});
$card.addEventListener("pointermove", cardUpdate);
$card.addEventListener("pointerout", (e) => {
  easer = easedFunc(
    1000,
    (p) => {
      let x = adjust(p, 0, 1, e.offsetX, halfW);
      let y = adjust(p, 0, 1, e.offsetY, halfH);
      cardUpdate({ offsetX: x, offsetY: y });
    },
    () => {
      $card.classList.remove("active");
      $wrap.classList.remove("active");
    }
  );
});

// initial animation
cardUpdate({ offsetX: $wrap.clientWidth - 70, offsetY: 60 });

setTimeout(() => {
  easer = easedFunc(
    3000,
    (p) => {
      let x = adjust(p, 0, 1, $wrap.clientWidth - 70, halfW);
      let y = adjust(p, 0, 1, 60, halfH);
      cardUpdate({ offsetX: x, offsetY: y });
    },
    () => {
      $card.classList.remove("active");
      $wrap.classList.remove("active");
    }
  );
}, 1000);
