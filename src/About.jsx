import { useEffect, useRef } from "react";

const COPY = [
  "An Electronics and Telecommunication engineer turned designer. Turns out I like wireframes more than wires. (get it???)",
  "Sole designer on a climate-tech product, taking it from first sketch to developer handoff across web and mobile. I’m also the person behind the odd graphics, posters and social posts.",
  "Outside work, I dance, cook, or bake every now and then. I read when I can (sometimes more, sometimes less), and I’m always on the lookout for a new hobby. Being a total beginner again is a good reminder of what it feels like to open a product for the first time.",
];

const ITEMS = [
  { src: "/images/about/dance.png", angle: -148, radius: 1.02, wave: 0.78, size: 58 },
  { src: "/images/about/pot.png", angle: 168, radius: 0.96, wave: 0.22, size: 52 },
  { src: "/images/about/books.png", angle: 142, radius: 0.9, wave: 0.08, size: 56 },
  { src: "/images/about/cake.png", angle: -108, radius: 0.92, wave: 0.48, size: 54 },
  { src: "/images/about/music.png", angle: -58, radius: 0.98, wave: 0.34, size: 50 },
  { src: "/images/about/art.png", angle: -18, radius: 1, wave: 0.6, size: 52 },
  { src: "/images/about/laptop.png", angle: 28, radius: 0.98, wave: 0.9, size: 54 },
  { src: "/images/about/trail.png", angle: 112, radius: 0.72, wave: 0.44, size: 36, spark: true },
  { src: "/images/about/spark.png", angle: -128, radius: 0.62, wave: 0.16, size: 16, spark: true },
  { src: "/images/about/spark-2.png", angle: -78, radius: 0.58, wave: 0.4, size: 18, spark: true },
  { src: "/images/about/spark-1.png", angle: 96, radius: 0.7, wave: 0.7, size: 13, spark: true },
  { src: "/images/about/spark-4.png", angle: 188, radius: 0.64, wave: 0.84, size: 12, spark: true },
  { src: "/images/about/spark-3.png", angle: -36, radius: 0.74, wave: 0.54, size: 12, spark: true },
];

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function smoothstep(edge0, edge1, value) {
  const t = clamp((value - edge0) / (edge1 - edge0), 0, 1);
  return t * t * (3 - 2 * t);
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
  const portraitUpRef = useRef(null);
  const titleRef = useRef(null);
  const copyRef = useRef(null);
  const waveRef = useRef(null);

  useEffect(() => {
    const section = sectionRef.current;
    const pin = pinRef.current;
    const line = lineRef.current;
    const face = faceRef.current;
    const portrait = portraitRef.current;
    const portraitUp = portraitUpRef.current;
    const title = titleRef.current;
    const copy = copyRef.current;
    const wave = waveRef.current;
    const icons = [...pin.querySelectorAll(".about-icon")];
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

      const portraitWidth = Math.min(narrow ? 210 : 340, width * (narrow ? 0.52 : 0.3));
      const portraitHeight = portraitWidth;
      const center = { x: width * 0.5, y: height * (narrow ? 0.5 : 0.56) };
      const end = {
        x: Math.min(width - 96, center.x + portraitWidth * 0.16),
        y: Math.max(96, center.y - portraitHeight * 0.4),
      };
      const projects = document.querySelector(".projects");
      const rawLine = projects ? getComputedStyle(projects).getPropertyValue("--line-x") : "";
      const lineX = clamp(parseFloat(rawLine) || width - (narrow ? 48 : 96), end.x + 72, width - 24);
      const turnY = end.y;
      const corner = { x: lineX, y: turnY };
      const start = { x: lineX, y: -12 };
      const path = elbow(start, corner, end, narrow ? 18 : 36);
      line.setAttribute("d", path);
      line.style.strokeDasharray = "none";
      line.style.strokeDashoffset = "0";
      line.style.opacity = String(1 - smoothstep(0.76, 0.88, progress));

      const length = line.getTotalLength();
      const ride = smoothstep(0.04, 0.4, progress);
      const point = line.getPointAtLength(ride * length);
      const faceSize = narrow ? 56 : 72;
      face.style.width = `${faceSize}px`;
      face.style.height = `${faceSize}px`;
      face.style.transform = `translate(${point.x}px, ${point.y}px) translate(-50%, -62%)`;
      face.style.opacity = String(smoothstep(0.02, 0.07, progress) * (1 - smoothstep(0.38, 0.5, progress)));

      const settled = { x: width * (narrow ? 0.22 : 0.14), y: height * (narrow ? 0.8 : 0.82) };
      const arrive = smoothstep(0.38, 0.54, progress);
      const settle = smoothstep(0.74, 0.92, progress);
      const portraitScale = mix(mix(0.28, 1, arrive), narrow ? 0.68 : 0.56, settle);
      const portraitX = mix(mix(end.x, center.x, arrive), settled.x, settle);
      const portraitY = mix(mix(end.y + portraitHeight * 0.28, center.y, arrive), settled.y, settle);
      const portraitTransform = `translate(${portraitX}px, ${portraitY}px) translate(-50%, -50%) scale(${portraitScale})`;
      portrait.style.width = `${portraitWidth}px`;
      portrait.style.height = `${portraitHeight}px`;
      portrait.style.transform = portraitTransform;
      portraitUp.style.width = `${portraitWidth}px`;
      portraitUp.style.height = `${portraitHeight}px`;
      portraitUp.style.transform = `translate(${portraitX}px, ${portraitY - portraitHeight * portraitScale * 0.07}px) translate(-50%, -50%) scale(${portraitScale})`;
      const shown = smoothstep(0.38, 0.5, progress);
      const look = smoothstep(0.5, 0.64, progress) * (1 - smoothstep(0.76, 0.9, progress));
      portrait.style.opacity = String(shown * (1 - look));
      portraitUp.style.opacity = String(shown * look);

      const gaze = {
        x: portraitX - portraitWidth * portraitScale * 0.1,
        y: portraitY - portraitHeight * portraitScale * 0.58,
      };
      const reach = narrow ? Math.min(width, height) * 0.34 : portraitWidth * portraitScale;
      const haloRadiusX = reach * (narrow ? 0.8 : 0.7);
      const haloRadiusY = reach * 0.24;

      const waveY = height * (narrow ? 0.84 : 0.82);
      const waveAmp = narrow ? 14 : 22;
      const settledScale = narrow ? 0.72 : 0.58;
      const waveLeft = settled.x + portraitWidth * settledScale * 0.46;
      const waveRight = width * (narrow ? 0.96 : 0.94);
      const wavePoint = (t) => {
        const x = mix(waveLeft, waveRight, t);
        const y = waveY + Math.sin(t * Math.PI * 2.2) * waveAmp;
        return { x, y };
      };
      let waveD = "";
      for (let step = 0; step <= 24; step += 1) {
        const pointOnWave = wavePoint(step / 24);
        waveD += `${step === 0 ? "M" : "L"} ${pointOnWave.x.toFixed(1)} ${pointOnWave.y.toFixed(1)} `;
      }
      wave.setAttribute("d", waveD);
      wave.style.opacity = String(smoothstep(0.78, 0.9, progress) * 0.85);

      icons.forEach((icon, index) => {
        const item = ITEMS[index];
        const appear = smoothstep(0.5 + index * 0.01, 0.64 + index * 0.01, progress);
        const scatter = smoothstep(0.74, 0.92, progress);
        const orbit = reduced ? 0 : time * 0.16;
        const bob = Math.sin(time * 0.85 + index) * (scatter > 0.2 ? 0 : 4);
        const radians = (item.angle * Math.PI) / 180 + orbit;
        const halo = {
          x: gaze.x + Math.cos(radians) * haloRadiusX * item.radius + bob,
          y: gaze.y + Math.sin(radians) * haloRadiusY * item.radius,
        };
        const along = wavePoint(item.wave);
        const at = {
          x: mix(mix(gaze.x, halo.x, appear), along.x, scatter),
          y: mix(mix(gaze.y, halo.y, appear), along.y, scatter),
        };
        const size = item.size * (narrow ? 0.72 : 1) * mix(0.2, 1, appear);
        icon.style.width = `${size}px`;
        icon.style.transform = `translate(${at.x}px, ${at.y}px) translate(-50%, -50%)`;
        const twinkle = item.spark ? 0.7 + 0.3 * (0.5 + 0.5 * Math.sin(time * 2.2 + index * 1.3)) : 1;
        icon.style.opacity = String(appear * twinkle);
      });

      title.style.opacity = String(smoothstep(0, 0.08, progress));
      title.style.transform = `translateY(${mix(10, 0, smoothstep(0, 0.08, progress))}px)`;
      const copyIn = smoothstep(0.8, 0.94, progress);
      copy.style.opacity = String(copyIn);
      copy.style.transform = `translateY(${mix(18, 0, copyIn)}px)`;
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
        <h2 className="about-title" ref={titleRef}>
          About Me
        </h2>
        <svg className="about-svg" aria-hidden="true">
          <path ref={lineRef} className="about-line" />
          <path ref={waveRef} className="about-wave" />
        </svg>
        <img className="about-face" ref={faceRef} src="/images/face-smile.png" alt="" />
        <img
          className="about-portrait"
          ref={portraitRef}
          src="/images/about/portrait.png"
          alt="Illustrated portrait of Rhutuja"
        />
        <img
          className="about-portrait about-portrait-up"
          ref={portraitUpRef}
          src="/images/about/portrait-up.png"
          alt=""
        />
        {ITEMS.map((item) => (
          <img
            key={`${item.src}-${item.angle}`}
            className="about-icon"
            src={item.src}
            alt=""
          />
        ))}
        <div className="about-copy" ref={copyRef}>
          {COPY.map((paragraph) => (
            <p key={paragraph.slice(0, 24)}>{paragraph}</p>
          ))}
        </div>
      </div>
    </section>
  );
}
