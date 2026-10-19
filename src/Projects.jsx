import { useEffect, useRef } from "react";

const PROJECTS = [
  {
    id: "circolife",
    note: "Cool job. Literally. Gotta read.",
    title: "Circolife — From device monitor to operational command center",
    tags: ["Enterprise", "B2B", "Mobile"],
    body: "Redesigned the IA for enterprise AC fleets. Now used by 4,600+ operators, with 1 in 4 sessions running a bulk device action.",
    image: "/images/projects/circolife.png",
  },
  {
    id: "airexpert",
    note: "‘I love filling forms!’ said no one ever",
    title: "AirExpert — The Form Was the Flaw",
    tags: ["Field Ops", "Internal Tool", "Mobile"],
    body: "Manual follow-up on field submissions dropped from ~60% to 15–20%.",
    image: "/images/projects/airexpert.png",
  },
  {
    id: "justgofix",
    note: "Tap. Book. Relax.",
    title: "Just Go Fix — Designing Trust From Zero",
    tags: ["Home Services", "B2C", "Mobile"],
    body: "Designed a home services booking app, building first-time user trust in a market still finding its shape.",
    image: "/images/projects/justgofix.png",
  },
];

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function contentRail(width) {
  const narrow = width <= 800;
  const face = narrow ? 56 : 72;
  const gutter = narrow ? 24 : 64;
  const frame = Math.min(width - gutter * 2, 960);
  const frameRight = (width - frame) / 2 + frame;
  return frameRight - face / 2 - (narrow ? 12 : 20);
}

export default function Projects() {
  const sectionRef = useRef(null);
  const faceRef = useRef(null);
  const noteRef = useRef(null);

  useEffect(() => {
    const section = sectionRef.current;
    const face = faceRef.current;
    const note = noteRef.current;
    const noteText = note.querySelector("p");
    let frame = 0;
    let shown = "";

    const place = () => {
      const cards = [...section.querySelectorAll(".project-card")];
      const first = cards[0];
      const last = cards[cards.length - 1];
      const inner = section.querySelector(".projects-inner");
      const heroFace = document.querySelector(".hero .face-rider");
      const view = window.innerHeight;
      const scrollY = window.scrollY;
      const sectionTop = section.offsetTop;
      const origin = inner.offsetTop;
      const path = document.querySelector(".trail-path");
      const stage = document.querySelector(".stage");
      const narrow = section.clientWidth <= 800;
      const faceSize = narrow ? 56 : 72;
      let lineX = contentRail(section.clientWidth);
      if (path && stage && path.getTotalLength()) {
        const end = path.getPointAtLength(path.getTotalLength());
        const stageRect = stage.getBoundingClientRect();
        const sectionRect = section.getBoundingClientRect();
        lineX = stageRect.left - sectionRect.left + end.x;
      }

      const handoff = sectionTop - view;
      const firstMeet = Math.min(view * 0.4, view - 180);
      const laterMeet = Math.min(view * 0.5, view - 160);
      const firstTop = origin + first.offsetTop;
      const approachEnd = sectionTop + firstTop - firstMeet;
      const lineEnd = origin + last.offsetTop + last.offsetHeight;
      const chin = faceSize * (54 / 1254);
      const sticks = cards.map((card) => origin + card.offsetTop + chin);
      const holdFor = (index) => Math.min(narrow ? 90 : 110, view * (index === 0 ? 0.12 : 0.08));
      const meetFor = (index) => (index === 0 ? firstMeet : laterMeet);

      let free = 0;
      if (scrollY > handoff && scrollY < approachEnd) {
        const t = (scrollY - handoff) / Math.max(1, approachEnd - handoff);
        const screenY = view + (firstMeet - view) * t;
        free = screenY - (sectionTop - scrollY);
      } else if (scrollY >= approachEnd) {
        free = scrollY - sectionTop + firstMeet;
      }

      const bubbleRoom = narrow ? 84 : 100;
      let stuck = -1;
      let top = free;
      let cursorScroll = handoff;
      let cursorTop = 0;
      for (let index = 0; index < sticks.length; index += 1) {
        const arriveScroll = sectionTop + sticks[index] - meetFor(index);
        const hold = holdFor(index);
        const cardDoc = sectionTop + origin + cards[index].offsetTop;
        const peek = narrow ? 56 : 88;
        const visibleScroll = cardDoc - view + peek;

        if (index === 0) {
          if (scrollY < arriveScroll) {
            top = free;
            break;
          }
          if (scrollY < arriveScroll + hold) {
            top = sticks[index];
            stuck = index;
            break;
          }
          cursorScroll = arriveScroll + hold;
          cursorTop = sticks[index];
          continue;
        }

        const parkScreen = Math.max(sectionTop - cursorScroll + cursorTop, bubbleRoom);
        const startScroll = Math.max(cursorScroll, visibleScroll);
        if (scrollY < startScroll) {
          top = scrollY - sectionTop + parkScreen;
          stuck = index - 1;
          break;
        }

        const cardScreen = cardDoc - startScroll;
        const meetScreen = clamp(view * 0.38, bubbleRoom + 28, Math.max(bubbleRoom + 28, cardScreen - 80));
        const maxScroll = document.documentElement.scrollHeight - view;
        const upcoming = index < sticks.length - 1 ? hold + 180 : 20;
        const room = Math.max(90, maxScroll - startScroll - upcoming);
        const travelSpan = clamp(cardScreen - meetScreen, 90, room);
        const startTop = startScroll - sectionTop + parkScreen;
        if (scrollY < startScroll + travelSpan) {
          const t = clamp((scrollY - startScroll) / travelSpan, 0, 1);
          const eased = t * t * (3 - 2 * t);
          top = startTop + (sticks[index] - startTop) * eased;
          if (t < 0.16) stuck = index - 1;
          break;
        }

        const arrivedScroll = startScroll + travelSpan;
        if (scrollY < arrivedScroll + hold || index === sticks.length - 1) {
          top = sticks[index];
          stuck = index;
          break;
        }
        cursorScroll = arrivedScroll + hold;
        cursorTop = sticks[index];
      }
      top = clamp(top, 0, lineEnd);

      face.style.top = `${top}px`;
      face.style.left = `${lineX}px`;
      face.style.width = `${faceSize}px`;
      face.style.height = `${faceSize}px`;
      face.classList.toggle("is-stuck", stuck !== -1);
      section.style.setProperty("--line-x", `${lineX}px`);

      const sectionRect = section.getBoundingClientRect();
      const handedOff = scrollY >= handoff - 0.5;
      const inView = sectionRect.bottom > 24 && sectionRect.top <= view + 2;
      face.style.opacity = handedOff && inView ? "1" : "0";
      if (heroFace) heroFace.style.opacity = handedOff ? "0" : "1";

      if (stuck === -1 || !handedOff) {
        note.classList.remove("is-in");
        note.style.opacity = "0";
        shown = "";
        return;
      }

      const message = PROJECTS[stuck].note;
      const fresh = shown !== message;
      if (fresh) {
        note.classList.remove("is-in");
        noteText.textContent = message;
        shown = message;
      }
      note.style.opacity = "1";
      note.style.top = `${top - faceSize - 12}px`;
      const pad = narrow ? 14 : 20;
      const width = note.offsetWidth || 1;
      const limit = window.innerWidth;
      let center = lineX;
      if (center + width / 2 > limit - pad) center = limit - pad - width / 2;
      if (center - width / 2 < pad) center = pad + width / 2;
      note.style.left = `${center}px`;
      note.style.setProperty("--dot", `${clamp(50 + ((lineX - center) / width) * 100, 16, 84)}%`);
      if (fresh) {
        void note.offsetWidth;
        note.classList.add("is-in");
      }
    };

    const tick = () => {
      place();
      frame = window.requestAnimationFrame(tick);
    };

    place();
    frame = window.requestAnimationFrame(tick);
    window.addEventListener("resize", place);

    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("resize", place);
      const heroFace = document.querySelector(".hero .face-rider");
      if (heroFace) heroFace.style.opacity = "1";
    };
  }, [sectionRef]);

  return (
    <section className="projects" id="projects" ref={sectionRef}>
      <div className="projects-line" aria-hidden="true" />
      <div className="projects-inner">
        <header className="projects-heading">
          <h2>Selected Work</h2>
          <p>
            Climate tech, field operations,
            <br />
            and a home services app.
          </p>
        </header>

        <div className="project-list">
          {PROJECTS.map((project) => (
            <article key={project.id} id={project.id} className="project-card">
              <div className="project-media">
                <img src={project.image} alt="" />
              </div>
              <div className="project-copy">
                <h3>{project.title}</h3>
                <ul className="project-tags">
                  {project.tags.map((tag) => (
                    <li key={tag}>{tag}</li>
                  ))}
                </ul>
                <p>{project.body}</p>
                <button className="case-study" type="button">
                  View case study
                  <span aria-hidden="true">→</span>
                </button>
              </div>
            </article>
          ))}
        </div>
      </div>

      <div className="project-face" ref={faceRef}>
        <img src="/images/face-smile.png" alt="" />
      </div>
      <div className="project-note" ref={noteRef}>
        <span className="project-thought project-thought-1" />
        <span className="project-thought project-thought-2" />
        <p />
      </div>
    </section>
  );
}
