import './style.css';

const symbols = [1, 2, 3, 4, 5, 6].map(number => new URL(`./assets/symbol-${number}.svg`, import.meta.url).href);
const reels = [...document.querySelectorAll('.reel')];
const numReels = reels.length;
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
let spinning = false;
let resizeTimer;
const spinTime = 5000;
const reelDelay = 250;
const spinTimes = Array.from({ length: numReels }, (_, index) => spinTime + index * reelDelay);

function imageFor(src, index) {
  const img = document.createElement('img');
  img.src = src;
  img.alt = `Placeholder symbol ${(((index % symbols.length) + symbols.length) % symbols.length) + 1}`;
  img.draggable = false;
  return img;
}

function tile(src, index) {
  const cell = document.createElement('div');
  cell.className = 'symbol';
  cell.appendChild(imageFor(src, index));
  return cell;
}

function randomSymbol() {
  return Math.floor(Math.random() * symbols.length);
}

function initialize() {
  reels.forEach((reel, reelIndex) => {
    const track = reel.querySelector('.track');
    track.style.transition = 'none';
    track.replaceChildren();
    for (let index = 0; index < 3; index++) {
      const symbolIndex = (reelIndex + index * 2) % symbols.length;
      track.appendChild(tile(symbols[symbolIndex], symbolIndex));
    }
    track.style.transform = 'translate3d(0,0,0)';
  });
}

function animateReel(track, destination, duration, onComplete) {
  track.style.transition = "none";

  if (duration <= 0) {
    track.style.transform = `translate3d(0, ${destination}px, 0)`;
    onComplete?.();
    return;
  }

  track.style.transition =
    `transform ${duration}ms cubic-bezier(.08,.72,.08,1)`;

  const handleEnd = (event) => {
    if (event.target !== track || event.propertyName !== "transform") return;

    track.removeEventListener("transitionend", handleEnd);
    onComplete?.();
  };

  track.addEventListener("transitionend", handleEnd);

  requestAnimationFrame(() => {
    track.style.transform = `translate3d(0, ${destination}px, 0)`;
  });
}

function spin() {
  if (spinning) return;
  spinning = true;

  const cellHeight =
    reels[0].querySelector(".symbol").getBoundingClientRect().height;

  const durations = reduceMotion ? [0, 0, 0] : spinTimes;
  const resultLine = document.querySelector(".result-line");

  resultLine?.classList.remove("is-visible");

  let finishedCount = 0;

  function onReelComplete() {
    finishedCount++;

    if (finishedCount !== reels.length) return;

    // Keep only the three final visible symbols.
    reels.forEach((reel) => {
      const track = reel.querySelector(".track");
      const target = Number(track.dataset.target || 0);
      const visible = [...track.children].slice(target, target + 3);

      track.style.transition = "none";
      track.replaceChildren(...visible);
      track.style.transform = "translate3d(0, 0, 0)";
    });

    resultLine?.classList.remove("is-visible"); // reset animation
    void resultLine?.offsetWidth;               // force reflow
    resultLine?.classList.add("is-visible");    // bounce in
    spinning = false;
  }

  reels.forEach((reel, reelIndex) => {
    const track = reel.querySelector(".track");

    const initial = [...track.querySelectorAll(".symbol img")]
      .map((img) => img.getAttribute("src"));

    const turns =
      22 + reelIndex * 4 + Math.floor(Math.random() * 7);

    const finalSymbol = randomSymbol();
    const sequence = [...initial];

    for (let i = 3; i < turns; i++) {
      sequence.push(symbols[randomSymbol()]);
    }

    sequence.push(
      symbols[randomSymbol()],
      symbols[finalSymbol],
      symbols[randomSymbol()]
    );

    track.style.transition = "none";
    track.replaceChildren(
      ...sequence.map((src) => tile(src, symbols.indexOf(src)))
    );
    track.style.transform = "translate3d(0, 0, 0)";

    // Commit the starting position before starting the transition.
    void track.offsetHeight;

    const destination = -turns * cellHeight;
    track.dataset.target = String(turns);

    animateReel(
      track,
      destination,
      durations[reelIndex],
      onReelComplete
    );
  });
}

document.addEventListener('keydown', event => {
  if (event.key === 'Enter' && !event.repeat) {
    event.preventDefault();
    spin();
  }
});

window.addEventListener('resize', () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => {
    if (!spinning) initialize();
  }, 120);
});

initialize();
