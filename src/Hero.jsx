import { useEffect, useRef, useState } from "react";

const LINKS = [
  { label: "Home", href: "#top" },
  { label: "Projects", href: "#projects" },
  { label: "About", href: "#about" },
  { label: "Resume", href: "#resume" },
];

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function smoothstep(edge0, edge1, value) {
  const t = clamp((value - edge0) / (edge1 - edge0), 0, 1);
  return t * t * (3 - 2 * t);
}

const BAG_FRACTION = 0.56;

function roundedPath(points, radius) {
  const [start, corner, end] = points;
  const legA = Math.hypot(corner.x - start.x, corner.y - start.y);
  const legB = Math.hypot(end.x - corner.x, end.y - corner.y);
  const curve = Math.min(radius, legA * 0.42, legB * 0.42);
  const before = {
    x: corner.x - Math.sign(corner.x - start.x) * curve,
    y: corner.y,
  };
  const after = {
    x: corner.x,
    y: corner.y + Math.sign(end.y - corner.y) * curve,
  };
  return `M ${start.x.toFixed(1)} ${start.y.toFixed(1)} L ${before.x.toFixed(1)} ${before.y.toFixed(1)} Q ${corner.x.toFixed(1)} ${corner.y.toFixed(1)} ${after.x.toFixed(1)} ${after.y.toFixed(1)} L ${end.x.toFixed(1)} ${end.y.toFixed(1)}`;
}

function buildPoints(stage) {
  const width = stage.clientWidth;
  const height = stage.clientHeight;
  const mobile = window.matchMedia("(max-width: 800px)").matches;
  const character = stage.querySelector(".character");
  const stageRect = stage.getBoundingClientRect();
  const characterRect = character.getBoundingClientRect();
  const visualRight =
    characterRect.left - stageRect.left + characterRect.width * (640 / 844);

  const rail = contentRail(width);

  if (mobile) {
    const pin = stage.closest(".hero-pin");
    const pinRect = pin.getBoundingClientRect();
    const split = parseFloat(pin.style.getPropertyValue("--split")) / 100 || 0.62;
    const blueTop = pinRect.top + pinRect.height * split - stageRect.top;
    const visualBottom = characterRect.bottom - stageRect.top - characterRect.height * 0.035;
    const y = clamp(Math.max(blueTop + 108, visualBottom - characterRect.height * 0.06), blueTop + 96, height - 64);
    const span = Math.min(128, width * 0.34);
    const startX = clamp(Math.max(visualRight - width * 0.02, rail - span), 12, rail - 70);
    return [
      { x: startX, y },
      { x: rail, y },
      { x: rail, y: height + 8 },
    ];
  }

  const y = Math.max(height * 0.72, height - 132);
  const x0 = clamp(Math.max(visualRight + 28, width * 0.52), 0, rail - 120);
  return [
    { x: x0, y },
    { x: rail, y },
    { x: rail, y: height + 8 },
  ];
}

function contentRail(width) {
  const narrow = width <= 800;
  const face = narrow ? 62 : 84;
  const gutter = narrow ? 24 : 64;
  const frame = Math.min(width - gutter * 2, 960);
  const frameRight = (width - frame) / 2 + frame;
  return frameRight - face / 2 - (narrow ? 12 : 20);
}

function syncBlueSplit(section, stage) {
  const pin = section.querySelector(".hero-pin");
  const character = stage.querySelector(".character");
  const pinRect = pin.getBoundingClientRect();
  const characterRect = character.getBoundingClientRect();
  if (!pinRect.height || !characterRect.height) return;
  const bagY = characterRect.top + characterRect.height * BAG_FRACTION;
  const split = clamp((bagY - pinRect.top) / pinRect.height, 0.52, 0.8);
  pin.style.setProperty("--split", `${(split * 100).toFixed(2)}%`);
}

export default function Hero() {
  const sectionRef = useRef(null);
  const stageRef = useRef(null);
  const pathRef = useRef(null);
  const dotRef = useRef(null);
  const svgRef = useRef(null);
  const faceRef = useRef(null);
  const neutralRef = useRef(null);
  const smileRef = useRef(null);
  const bubbleRef = useRef(null);
  const pointsRef = useRef([]);
  const rangeRef = useRef({ start: 0.08, end: 0.9 });
  const [menuOpen, setMenuOpen] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const section = sectionRef.current;
    const stage = stageRef.current;
    const path = pathRef.current;
    let drawn = false;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let progress = 0;
    let smileAmount = 0;
    let smiled = false;
    let cheerAt = 0;
    let frame = 0;

    const readProgress = () => {
      const scrollable = section.offsetHeight - window.innerHeight;
      return scrollable <= 0 ? 0 : clamp(-section.getBoundingClientRect().top / scrollable, 0, 1);
    };

    const bounceFace = () => {
      const face = faceRef.current;
      if (!face || reducedMotion) return;
      face.classList.remove("is-bouncing");
      void face.offsetWidth;
      face.classList.add("is-bouncing");
    };

    const renderFace = (value) => {
      const total = path.getTotalLength();
      if (total > 0 && faceRef.current) {
        const { start, end } = rangeRef.current;
        const point = path.getPointAtLength((start + (end - start) * value) * total);
        faceRef.current.style.transform = `translate3d(${point.x}px, ${point.y}px, 0) translate(-50%, -64%)`;
      }

      neutralRef.current.style.opacity = String(1 - smileAmount);
      smileRef.current.style.opacity = String(smileAmount);
      if (bubbleRef.current) {
        const bubble = bubbleRef.current.querySelector(".bubble");
        if (value > 0.07) {
          if (!cheerAt) cheerAt = performance.now();
        } else if (value < 0.03) {
          cheerAt = 0;
        }
        const nextText = cheerAt ? "Yayy!!" : "Scroll to make me smile!";
        if (bubble.textContent !== nextText) {
          const before = bubble.offsetWidth;
          const tail = bubbleRef.current.dataset.tail;
          const left = parseFloat(bubbleRef.current.style.left) || 0;
          bubble.textContent = nextText;
          if (tail === "right") {
            bubbleRef.current.style.left = `${left + before - bubble.offsetWidth}px`;
          }
        }
        const elapsed = cheerAt ? performance.now() - cheerAt : 0;
        const held = elapsed < 1000 ? 0 : clamp((elapsed - 1000) / 600, 0, 1);
        const scrollFade = smoothstep(0.18, 0.5, value);
        bubbleRef.current.style.opacity = String(1 - scrollFade * held);
      }
    };

    const layout = () => {
      syncBlueSplit(section, stage);
      const points = buildPoints(stage);
      pointsRef.current = points;
      const mobile = window.matchMedia("(max-width: 800px)").matches;
      const faceSize = mobile ? 62 : 84;

      path.setAttribute("d", roundedPath(points, mobile ? 12 : 36));
      dotRef.current.setAttribute("cx", points[0].x);
      dotRef.current.setAttribute("cy", points[0].y);

      const width = stage.clientWidth;
      const height = stage.clientHeight;
      svgRef.current.setAttribute("viewBox", `0 0 ${width} ${height}`);
      svgRef.current.setAttribute("width", width);
      svgRef.current.setAttribute("height", height);

      const total = path.getTotalLength();
      const start = clamp((faceSize * 0.46 + 18) / total, 0.04, 0.24);
      let end = 1;
      for (let step = 0; step < 40; step += 1) {
        const probe = path.getPointAtLength(end * total);
        if (probe.y <= height - 0.5) break;
        end = Math.max(start + 0.45, end - 0.004);
      }
      rangeRef.current = { start, end };

      faceRef.current.style.width = `${faceSize}px`;
      faceRef.current.style.height = `${faceSize}px`;

      const origin = path.getPointAtLength(start * total);
      const bubble = bubbleRef.current.querySelector(".bubble");
      const bubbleWidth = bubble.offsetWidth;
      const bubbleHeight = bubble.offsetHeight;
      let left = origin.x + faceSize * 0.46;
      let top = origin.y - bubbleHeight - faceSize * (mobile ? 0.7 : 0.78);
      let tail = "left";

      if (mobile) {
        const pin = section.querySelector(".hero-pin");
        const pinRect = pin.getBoundingClientRect();
        const stageRect = stage.getBoundingClientRect();
        const split = parseFloat(pin.style.getPropertyValue("--split")) / 100 || 0.62;
        const blueTop = pinRect.top + pinRect.height * split - stageRect.top;
        tail = "right";
        left = Math.min(origin.x - bubbleWidth * 0.35, width - bubbleWidth - 16);
        top = Math.max(blueTop + 10, origin.y - bubbleHeight - 28);
      } else if (left + bubbleWidth > width - 12) {
        left = origin.x - bubbleWidth - faceSize * 0.2;
        tail = "right";
      }
      left = clamp(left, 12, Math.max(12, width - bubbleWidth - 12));
      top = clamp(top, 8, Math.max(8, height - bubbleHeight - 12));

      bubbleRef.current.style.left = `${left}px`;
      bubbleRef.current.style.top = `${top}px`;
      bubbleRef.current.dataset.tail = tail;

      if (!drawn) {
        if (!reducedMotion) {
          path.style.strokeDasharray = `${total}`;
          path.style.strokeDashoffset = `${total}`;
          path.getBoundingClientRect();
          path.style.transition = "stroke-dashoffset 1.35s cubic-bezier(0.22, 1, 0.36, 1)";
          path.style.strokeDashoffset = "0";
        }
        drawn = true;
        setReady(true);
      } else {
        path.style.transition = "none";
        path.style.strokeDasharray = "none";
        path.style.strokeDashoffset = "0";
      }

      progress = readProgress();
      renderFace(progress);
    };

    const tick = () => {
      const target = readProgress();
      const distance = target - progress;
      progress += distance * (reducedMotion ? 1 : 0.085);
      if (Math.abs(distance) < 0.0005) progress = target;

      if (target > 0.018 && !smiled) {
        smiled = true;
        bounceFace();
      }
      if (target < 0.006) {
        smiled = false;
        faceRef.current?.classList.remove("is-bouncing");
      }

      const smileTarget = smiled ? 1 : 0;
      smileAmount += (smileTarget - smileAmount) * (reducedMotion ? 1 : 0.16);
      if (Math.abs(smileTarget - smileAmount) < 0.004) smileAmount = smileTarget;

      renderFace(progress);
      frame = window.requestAnimationFrame(tick);
    };

    layout();
    const observer = new ResizeObserver(layout);
    observer.observe(stage);
    frame = window.requestAnimationFrame(tick);

    return () => {
      observer.disconnect();
      window.cancelAnimationFrame(frame);
    };
  }, []);

  useEffect(() => {
    if (!menuOpen) return undefined;
    const close = () => setMenuOpen(false);
    window.addEventListener("resize", close);
    return () => window.removeEventListener("resize", close);
  }, [menuOpen]);

  return (
    <section className="hero" id="top" ref={sectionRef}>
      <div className="hero-pin">
        <header className="nav">
          <a className="logo" href="#top" aria-label="Rhutuja, home">
            <img src="/images/logo.jpg" alt="" />
          </a>

          <nav className="nav-links" aria-label="Primary">
            {LINKS.map((link) => (
              <a key={link.label} href={link.href}>
                {link.label}
              </a>
            ))}
          </nav>

          <div className="nav-end">
            <a className="cta" href="#contact">
              Get in touch
            </a>
            <button
              className="menu-button"
              type="button"
              aria-expanded={menuOpen}
              aria-controls="mobile-menu"
              onClick={() => setMenuOpen((open) => !open)}
            >
              <span className="sr-only">{menuOpen ? "Close menu" : "Open menu"}</span>
              <span />
              <span />
            </button>
          </div>

          {menuOpen && (
            <nav className="mobile-menu" id="mobile-menu" aria-label="Mobile">
              {LINKS.map((link) => (
                <a key={link.label} href={link.href} onClick={() => setMenuOpen(false)}>
                  {link.label}
                </a>
              ))}
            </nav>
          )}
        </header>

        <div className="stage" ref={stageRef}>
          <h1 className="headline">
            <span className="line">Hey!</span>
            <span className="line">I’m Rhutuja</span>
          </h1>
          <p className="tagline">I turn messy systems into tools people actually use.</p>
          <div className="character-wrap">
            <img
              className="character"
              src="/images/hero.gif"
              alt="Illustrated portrait of Rhutuja holding a sunflower bouquet"
            />
          </div>

          <div className={`trail${ready ? " is-ready" : ""}`}>
            <svg ref={svgRef} className="trail-svg" aria-hidden="true">
              <path ref={pathRef} className="trail-path" />
              <circle ref={dotRef} className="trail-dot" r="3.5" />
            </svg>

            <div className="face-rider" ref={faceRef}>
              <img ref={neutralRef} src="/images/face-neutral.png" alt="" />
              <img ref={smileRef} src="/images/face-smile.png" alt="" />
            </div>

            <div className="bubble-anchor" ref={bubbleRef}>
              <span className="thought thought-1" aria-hidden="true" />
              <span className="thought thought-2" aria-hidden="true" />
              <p className="bubble">Scroll to make me smile!</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
