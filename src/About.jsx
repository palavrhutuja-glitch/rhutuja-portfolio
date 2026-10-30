import { useEffect, useRef } from "react";

const COPY = [
  "An Electronics and Telecommunication engineer turned designer. Turns out I like wireframes more than wires. (get it??!)",
  "Sole designer on a climate-tech product, taking it from first sketch to developer handoff across web and mobile. I’m also the person behind the wall graphics, posters and social posts.",
  "Outside work, I dance, cook, or bake every now and then. I read when I can (sometimes more, sometimes less), and I’m always on the lookout for a new hobby. Being a total beginner again is a good reminder of what it feels like to open a product for the first time.",
];

// hx/hy: place on the arc above her head. 0,0 is the crown; negative y is up.
// wave: [x, y] as fractions of the pinned frame.
const ITEMS = [
  { id: "cake", src: "/images/about/cake.png", size: 54, hx: 0.02, hy: -0.78, wave: [0.56, 0.83] },
  { id: "dance", src: "/images/about/dance.png", size: 56, hx: -0.68, hy: -0.58, wave: [0.91, 0.66] },
  { id: "books", src: "/images/about/books.png", size: 50, hx: -1.05, hy: -0.02, wave: [0.3, 0.73] },
  { id: "pot", src: "/images/about/pot.png", size: 48, hx: -1.22, hy: -0.4, wave: [0.38, 0.77] },
  { id: "music", src: "/images/about/music.png", size: 48, hx: 0.66, hy: -0.5, wave: [0.48, 0.75] },
  { id: "art", src: "/images/about/art.png", size: 48, hx: 1.18, hy: -0.32, wave: [0.68, 0.77] },
  { id: "laptop", src: "/images/about/laptop.png", size: 52, hx: 1.05, hy: -0.08, wave: [0.8, 0.79] },
  { id: "spark-cake", src: "/images/about/spark.png", size: 13, spark: true, hx: -0.28, hy: -0.7, wave: [0.33, 0.66] },
  { id: "spark-dance", src: "/images/about/spark-2.png", size: 12, spark: true, hx: -0.42, hy: -0.28, wave: [0.44, 0.69] },
  { id: "spark-pot", src: "/images/about/spark-1.png", size: 11, spark: true, hx: -0.95, hy: -0.48, wave: [0.53, 0.82] },
  { id: "spark-books", src: "/images/about/spark-3.png", size: 12, spark: true, hx: -0.48, hy: -0.08, wave: [0.62, 0.69] },
  { id: "spark-high", src: "/images/about/spark-4.png", size: 12, spark: true, hx: 0.32, hy: -0.62, wave: [0.72, 0.64] },
  { id: "spark-low", src: "/images/about/spark.png", size: 11, spark: true, hx: 0.48, hy: -0.22, wave: [0.36, 0.86] },
  { id: "spark-cake-under", src: "/images/about/spark-2.png", size: 13, spark: true, wave: [0.6, 0.9] },
  { id: "spark-laptop", src: "/images/about/spark-1.png", size: 14, spark: true, wave: [0.86, 0.72] },
  { id: "spark-dance-under", src: "/images/about/spark-3.png", size: 12, spark: true, wave: [0.95, 0.78] },
  { id: "spark-books-under", src: "/images/about/spark-4.png", size: 11, spark: true, wave: [0.31, 0.8] },
  { id: "dot-1", dot: true, size: 5, hx: -0.42, hy: -0.55, wave: [0.42, 0.62] },
  { id: "dot-2", dot: true, size: 4, hx: 0.42, hy: -0.72, wave: [0.55, 0.6] },
  { id: "dot-3", dot: true, size: 5, hx: 1.18, hy: -0.95, wave: [0.7, 0.58] },
  { id: "dot-4", dot: true, size: 4, hx: -1.35, hy: -0.15, wave: [0.97, 0.63] },
  { id: "dot-5", dot: true, size: 6, spark: true, wave: [0.24, 0.86] },
  { id: "moon", moon: true, size: 28, wave: [0.85, 0.58] },
];

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function smoothstep(edge0, edge1, value) {
  const t = clamp((value - edge0) / (edge1 - edge0), 0, 1);
  return t * t * (3 - 2 * t);
}

function rise(value) {
  const t = clamp(value, 0, 1);
  return 1 - (1 - t) ** 3;
}

function mix(a, b, t) {
  return a + (b - a) * t;
}

function elbow(start, corner, end, radius) {
  const legA = Math.hypot(corner.x - start.x, corner.y - start.y);
  const legB = Math.hypot(end.x - corner.x, end.y - corner.y);
  const curve = Math.min(radius, legA * 0.45, legB * 0.45);
  const before = {
    x: corner.x,
    y: corner.y - Math.sign(corner.y - start.y) * curve,
  };
  const after = {
    x: corner.x - Math.sign(corner.x - end.x) * curve,
    y: corner.y,
  };
  return `M ${start.x.toFixed(1)} ${start.y.toFixed(1)} L ${before.x.toFixed(1)} ${before.y.toFixed(1)} Q ${corner.x.toFixed(1)} ${corner.y.toFixed(1)} ${after.x.toFixed(1)} ${after.y.toFixed(1)} L ${end.x.toFixed(1)} ${end.y.toFixed(1)}`;
}

export default function About() {
  const sectionRef = useRef(null);
  const pinRef = useRef(null);
  const lineRef = useRef(null);
  const faceRef = useRef(null);
  const portraitRef = useRef(null);
  const titleRef = useRef(null);
  const copyRef = useRef(null);
  const waveRef = useRef(null);

  useEffect(() => {
    const section = sectionRef.current;
    const pin = pinRef.current;
    const line = lineRef.current;
    const face = faceRef.current;
    const portrait = portraitRef.current;
    const title = titleRef.current;
    const copy = copyRef.current;
    const wave = waveRef.current;
    const icons = [...pin.querySelectorAll(".about-icon")];
    const paragraphs = [...copy.querySelectorAll("p")];
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let frame = 0;

    const place = (now) => {
      const width = pin.clientWidth;
      const height = pin.clientHeight;
      const narrow = width <= 800;
      const scrollable = section.offsetHeight - window.innerHeight;
      const progress = reduced
        ? 1
        : clamp(-section.getBoundingClientRect().top / Math.max(1, scrollable), 0, 1);
      const time = reduced ? 0 : now / 1000;

      const portraitWidth = Math.min(narrow ? 220 : 360, width * (narrow ? 0.58 : 0.3));
      const portraitHeight = portraitWidth;
      const faceSize = narrow ? 72 : 84;
      const emergeX = width * 0.5;
      // Her face is 36% down the image and the drawing runs to the bottom edge.
      // Seat that edge on the bottom of the frame.
      const seatedFaceY = height - portraitHeight * 0.64;
      const lineEnd = { x: emergeX, y: seatedFaceY + faceSize * 0.14 };
      const projects = document.querySelector(".projects");
      const rawLine = projects ? getComputedStyle(projects).getPropertyValue("--line-x") : "";
      const parsedLine = parseFloat(rawLine);
      const lineX = clamp(Number.isFinite(parsedLine) ? parsedLine : width - (narrow ? 48 : 96), 24, width - 16);
      const view = window.innerHeight;
      const corner = { x: lineX, y: lineEnd.y };
      const start = { x: lineX, y: 0 };
      line.setAttribute("d", elbow(start, corner, lineEnd, narrow ? 18 : 36));
      line.style.strokeDasharray = "none";
      line.style.strokeDashoffset = "0";

      const length = line.getTotalLength();
      // One pace for the drop, the corner, and the straight line, so the turn
      // does not stall and then jump.
      const meet = Math.min(view * 0.42, view - 160);
      const aboutTop = section.getBoundingClientRect().top;
      const into = Math.max(0, meet - aboutTop);
      const pace = 0.72;
      const ride = reduced ? 1 : clamp((into * pace) / Math.max(1, length), 0, 1);
      const arrivedAt = length / pace;
      const revealSpan = Math.max(1, view * 0.85);
      const past = reduced ? revealSpan + view * 2 : Math.max(0, into - arrivedAt);
      const reveal = clamp(past / revealSpan, 0, 1);
      const become = smoothstep(0, 0.28, reveal);
      const grow = smoothstep(0.16, 0.72, reveal);
      const haloSpan = Math.max(1, view * 2.2);
      const haloClock = reduced ? 1 : clamp((past - revealSpan * 0.75) / haloSpan, 0, 1);
      const slide = smoothstep(0.58, 0.8, haloClock);
      const anchorX = mix(emergeX, portraitWidth * 0.5 + width * 0.05, slide);
      const anchorY = seatedFaceY;
      const portraitScale = mix(0.42, 1, grow);
      const crown = {
        x: anchorX,
        y: anchorY - portraitHeight * portraitScale * 0.232,
      };

      line.style.opacity = String(1 - smoothstep(0.05, 0.35, reveal));
      const point = line.getPointAtLength(ride * length);
      face.style.width = `${faceSize}px`;
      face.style.height = `${faceSize}px`;
      face.style.transform = `translate(${point.x}px, ${point.y}px) translate(-50%, -64%)`;
      const onLine = reduced ? false : into > 0 && become < 0.92;
      face.style.opacity = onLine ? "1" : "0";

      portrait.style.width = `${portraitWidth}px`;
      portrait.style.height = `${portraitHeight}px`;
      portrait.style.transformOrigin = "50% 36%";
      portrait.style.transform = `translate(${anchorX}px, ${anchorY}px) translate(-50%, -36%) scale(${portraitScale})`;
      portrait.style.opacity = String(ride >= 0.999 ? become : 0);

      const orbitRx = Math.min(width * (narrow ? 0.42 : 0.32), portraitWidth * 0.95);
      const orbitRy = Math.max(28, portraitHeight * (narrow ? 0.12 : 0.14));
      const orbitCx = emergeX;
      const orbitCy = crown.y - 18 - orbitRy;
      const spin = smoothstep(0.2, 0.56, haloClock) * Math.PI * 0.9;
      const release = smoothstep(0.56, 0.84, haloClock);
      const ring = smoothstep(0.12, 0.28, haloClock) * (1 - release);

      const hairRight = anchorX + portraitWidth * portraitScale * 0.404;
      const waveAmp = narrow ? 16 : 28;
      const wavePoint = (t) => {
        const x = mix(hairRight + 18, width * 0.97, t);
        // Dip under the pot, crest through the cake, dip at the laptop, rise at the dancer.
        const wave = Math.cos(((t - 0.16) / 0.6) * Math.PI * 2);
        const y = anchorY - portraitHeight * portraitScale * 0.1 + wave * waveAmp;
        return { x, y };
      };
      let waveD = "";
      if (release < 0.55) {
        waveD = `M ${(orbitCx - orbitRx).toFixed(1)} ${orbitCy.toFixed(1)} A ${orbitRx.toFixed(1)} ${orbitRy.toFixed(1)} 0 1 1 ${(orbitCx + orbitRx).toFixed(1)} ${orbitCy.toFixed(1)} A ${orbitRx.toFixed(1)} ${orbitRy.toFixed(1)} 0 1 1 ${(orbitCx - orbitRx).toFixed(1)} ${orbitCy.toFixed(1)}`;
        wave.style.opacity = String(ring);
      } else {
        for (let step = 0; step <= 28; step += 1) {
          const spot = wavePoint(step / 28);
          waveD += `${step === 0 ? "M" : "L"} ${spot.x.toFixed(1)} ${spot.y.toFixed(1)} `;
        }
        wave.style.opacity = String(smoothstep(0.5, 0.72, release));
      }
      wave.setAttribute("d", waveD);

      const orbitAngle = {
        cake: -2.35,
        dance: 0.45,
        books: 1.2,
        pot: 1.9,
        music: 2.65,
        art: -1.15,
        laptop: -0.4,
        "spark-cake": -2.7,
        "spark-dance": 0.15,
        "spark-pot": 2.2,
        "spark-books": 1.45,
        "spark-high": -1.6,
        "spark-low": -0.75,
        "dot-1": 2.95,
        "dot-2": -1.85,
        "dot-3": 0.9,
        "dot-4": 1.6,
      };
      const waveLift = {
        books: -30,
        pot: 34,
        music: -30,
        cake: -6,
        art: -26,
        laptop: 32,
        dance: -36,
        moon: -30,
        "spark-cake": -22,
        "spark-dance": -14,
        "spark-pot": 10,
        "spark-books": -20,
        "spark-high": -26,
        "spark-low": 16,
        "spark-cake-under": 18,
        "spark-laptop": 12,
        "spark-dance-under": 8,
        "spark-books-under": 14,
        "dot-1": -22,
        "dot-2": -30,
        "dot-3": -16,
        "dot-4": 10,
        "dot-5": 16,
      };
      const waveSlot = {
        books: 0.05,
        pot: 0.16,
        music: 0.32,
        cake: 0.46,
        art: 0.6,
        laptop: 0.74,
        dance: 0.96,
        moon: 0.86,
        "spark-cake": 0.4,
        "spark-dance": 0.22,
        "spark-pot": 0.12,
        "spark-books": 0.52,
        "spark-high": 0.68,
        "spark-low": 0.86,
        "dot-1": 0.1,
        "dot-2": 0.28,
        "dot-3": 0.55,
        "dot-4": 0.8,
        "dot-5": 0.38,
      };

      icons.forEach((icon, index) => {
        const item = ITEMS[index];
        const stagger = (index % 7) * 0.018;
        const pop = reduced ? 1 : smoothstep(0.02 + stagger, 0.18 + stagger, haloClock);
        const base = orbitAngle[item.id] ?? index * 0.7;
        const radius = item.spark || item.dot ? 0.86 : item.moon ? 0 : 1;
        const angle = base + spin;
        const gathered = smoothstep(0.06, 0.3, haloClock);
        const rx = orbitRx * mix(0.42, radius || 0.92, gathered);
        const ry = orbitRy * mix(0.42, radius || 0.92, gathered);
        const onRing = {
          x: orbitCx + Math.cos(angle) * rx,
          y: orbitCy + Math.sin(angle) * ry,
        };
        const slot = waveSlot[item.id];
        const along = wavePoint(slot == null ? (index % 10) / 10 : slot);
        const lift = (waveLift[item.id] || 0) * (narrow ? 0.75 : 1);
        const at = {
          x: mix(onRing.x, along.x, release),
          y: mix(onRing.y, along.y + lift, release),
        };
        const twinkle = item.spark || item.dot ? 0.35 + 0.65 * (0.5 + 0.5 * Math.sin(time * 1.6 + index * 1.4)) : 1;
        const sparkScale = item.spark ? 0.82 + 0.18 * (0.5 + 0.5 * Math.sin(time * 1.6 + index)) : 1;
        const size = item.size * (narrow ? 0.72 : 1) * mix(0.2, 1, pop) * sparkScale;
        icon.style.width = `${size}px`;
        icon.style.height = item.dot || item.moon ? `${size}px` : "auto";
        icon.style.transform = `translate(${at.x}px, ${at.y}px) translate(-50%, -50%)`;
        icon.style.zIndex = "3";
        const show = item.moon ? release : pop;
        icon.style.opacity = String(show * twinkle);
      });

      const titleIn = rise(smoothstep(0, 0.1, progress));
      title.style.opacity = String(titleIn);
      title.style.transform = `translateY(${mix(16, 0, titleIn)}px)`;
      paragraphs.forEach((paragraph, index) => {
        const column = rise(smoothstep(0.78 + index * 0.05, 0.9 + index * 0.04, progress));
        paragraph.style.opacity = String(column);
        paragraph.style.transform = `translateY(${mix(16, 0, column)}px)`;
      });
    };

    const tick = (now) => {
      place(now);
      frame = window.requestAnimationFrame(tick);
    };

    const onResize = () => place(performance.now());
    place(performance.now());
    frame = window.requestAnimationFrame(tick);
    window.addEventListener("resize", onResize);

    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  return (
    <section className="about" id="about" ref={sectionRef}>
      <div className="about-pin" ref={pinRef}>
        <div className="about-row">
          <h2 className="about-title" ref={titleRef}>
            About Me
          </h2>
          <div className="about-copy" ref={copyRef}>
            {COPY.map((paragraph) => (
              <p key={paragraph.slice(0, 24)}>{paragraph}</p>
            ))}
          </div>
        </div>
        <svg className="about-svg" aria-hidden="true">
          <path ref={lineRef} className="about-line" />
          <path ref={waveRef} className="about-wave" />
        </svg>
        <img className="about-face" ref={faceRef} src="/images/face-smile.png" alt="" />
        <img
          className="about-portrait"
          ref={portraitRef}
          src="/images/about/portrait-up.png"
          alt="Illustrated portrait of Rhutuja"
        />
        {ITEMS.map((item) =>
          item.moon ? (
            <svg key={item.id} className="about-icon about-moon" viewBox="0 0 32 32" aria-hidden="true">
              <path d="M22 5.5a11 11 0 1 0 0 21 8.5 8.5 0 1 1 0-21z" />
            </svg>
          ) : item.dot ? (
            <span key={item.id} className="about-icon about-dot" />
          ) : (
            <img key={item.id} className="about-icon" src={item.src} alt="" />
          )
        )}
      </div>
    </section>
  );
}
