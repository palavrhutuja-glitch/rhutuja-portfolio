import { useEffect, useRef, useState } from "react";

const LINKS = [
  { label: "Home", href: "#top" },
  { label: "Projects", href: "#projects" },
  { label: "About", href: "#about" },
  { label: "Resume", href: "#resume" },
];

function overlapArea(a, b) {
  const width = Math.min(a.right, b.right) - Math.max(a.left, b.left);
  const height = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
  return width > 0 && height > 0 ? width * height : 0;
}

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
  const face = narrow ? 72 : 84;
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
    let bubbleShift = null;

    const readProgress = () => {
      const scrollable = section.offsetHeight - window.innerHeight;
      return scrollable <= 0 ? 0 : clamp(-section.getBoundingClientRect().top / scrollable, 0, 1);
    };

    const placeBubble = (point) => {
      if (!bubbleRef.current || !path.getTotalLength()) return;
      const bubble = bubbleRef.current.querySelector(".bubble");
      const mobile = window.matchMedia("(max-width: 800px)").matches;
      const faceSize = mobile ? 72 : 84;
      const width = stage.clientWidth;
      const height = stage.clientHeight;
      const total = path.getTotalLength();
      const origin = point || path.getPointAtLength(rangeRef.current.start * total);
      const faceLeft = origin.x - faceSize / 2;
      const faceRight = origin.x + faceSize / 2;
      const faceTop = origin.y - faceSize * 0.64;

      const stageRect = stage.getBoundingClientRect();
      const obstacles = [".character", ".headline", ".tagline"].map((selector) => {
        const rect = stage.querySelector(selector).getBoundingClientRect();
        return {
          left: rect.left - stageRect.left,
          top: rect.top - stageRect.top,
          right: rect.right - stageRect.left,
          bottom: rect.bottom - stageRect.top,
        };
      });
      const portrait = obstacles[0];
      const portraitWidth = portrait.right - portrait.left;
      const portraitHeight = portrait.bottom - portrait.top;
      obstacles[0] = {
        left: portrait.left + portraitWidth * 0.23,
        right: portrait.left + portraitWidth * 0.76,
        top: portrait.top + portraitHeight * 0.06,
        bottom: portrait.top + portraitHeight * 0.96,
      };
      if (mobile) {
        const textRight = Math.max(obstacles[1].right, obstacles[2].right);
        const open = width - 16 - textRight;
        bubble.style.maxWidth = `${Math.max(96, Math.min(168, open))}px`;
      } else {
        bubble.style.maxWidth = "";
      }
      const bubbleWidth = bubble.offsetWidth;
      const bubbleHeight = bubble.offsetHeight;

      if (mobile) {
        const sideLeft = faceLeft - bubbleWidth - 12;
        const left = sideLeft >= 12 ? sideLeft : faceRight + 12;
        const top = clamp(faceTop - 4, 12, Math.max(12, height - bubbleHeight - 12));
        bubbleRef.current.style.left = `${clamp(left, 12, Math.max(12, width - bubbleWidth - 12))}px`;
        bubbleRef.current.style.top = `${top}px`;
        bubbleRef.current.dataset.tail = sideLeft >= 12 ? "right" : "left";
        return;
      }

      const floor = 8;
      const pad = 12;
      const character = obstacles[0];
      const textRight = Math.max(obstacles[1].right, obstacles[2].right);
      const textLeft = Math.min(obstacles[1].left, obstacles[2].left);
      const options = [
        { tail: "left", left: origin.x + faceSize * 0.28, top: faceTop - bubbleHeight - 6 },
        { tail: "right", left: origin.x - bubbleWidth - faceSize * 0.12, top: faceTop - bubbleHeight - 6 },
        { tail: "left", left: faceRight + 8, top: origin.y - bubbleHeight * 0.85 },
        { tail: "right", left: faceLeft - bubbleWidth - 8, top: origin.y - bubbleHeight * 0.85 },
        { tail: "left", left: textRight + 12, top: obstacles[2].top },
        { tail: "right", left: textLeft - bubbleWidth - 12, top: obstacles[2].top },
      ];

      const scored = options.map((option) => {
        const minTop = option.top < character.top ? pad : floor;
        let left = clamp(option.left, pad, Math.max(pad, width - bubbleWidth - pad));
        let top = clamp(option.top, minTop, Math.max(minTop, height - bubbleHeight - pad));
        const box = { left, top, right: left + bubbleWidth, bottom: top + bubbleHeight };
        const textOverlap = overlapArea(box, obstacles[1]) + overlapArea(box, obstacles[2]);
        const portraitOverlap = overlapArea(box, obstacles[0]);
        const overlap = textOverlap * 30 + portraitOverlap;
        const shift = Math.abs(left - option.left) + Math.abs(top - option.top);
        const room = option.tail === "left" ? width - faceRight : faceLeft;
        return { ...option, left, top, overlap, shift, room };
      });

      scored.sort((a, b) => a.overlap - b.overlap || a.shift - b.shift || b.room - a.room);
      const best = scored[0];
      if (!bubbleShift || bubbleShift.label !== bubble.textContent) {
        bubbleShift = {
          label: bubble.textContent,
          dx: best.left - origin.x,
          dy: best.top - origin.y,
          tail: best.tail,
        };
      }
      const left = clamp(origin.x + bubbleShift.dx, pad, Math.max(pad, width - bubbleWidth - pad));
      const top = clamp(origin.y + bubbleShift.dy, floor, Math.max(floor, height - bubbleHeight - floor));
      bubbleRef.current.style.left = `${left}px`;
      bubbleRef.current.style.top = `${top}px`;
      bubbleRef.current.dataset.tail = bubbleShift.tail;
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
          bubble.textContent = nextText;
          bubbleShift = null;
        }
        placeBubble(total > 0 ? path.getPointAtLength((rangeRef.current.start + (rangeRef.current.end - rangeRef.current.start) * value) * total) : null);
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
      const faceSize = mobile ? 72 : 84;

      path.setAttribute("d", roundedPath(points, mobile ? 12 : 36));
      dotRef.current.setAttribute("cx", points[0].x);
      dotRef.current.setAttribute("cy", points[0].y);

      const width = stage.clientWidth;
      const height = stage.clientHeight;
      svgRef.current.setAttribute("viewBox", `0 0 ${width} ${height}`);
      svgRef.current.setAttribute("width", width);
      svgRef.current.setAttribute("height", height);

      const total = path.getTotalLength();
      const start = 0;
      let end = 1;
      for (let step = 0; step < 40; step += 1) {
        const probe = path.getPointAtLength(end * total);
        if (probe.y <= height - 0.5) break;
        end = Math.max(start + 0.45, end - 0.004);
      }
      rangeRef.current = { start, end };

      faceRef.current.style.width = `${faceSize}px`;
      faceRef.current.style.height = `${faceSize}px`;

      bubbleShift = null;
      placeBubble();

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
