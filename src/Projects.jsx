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

function overlapArea(a, b) {
  const width = Math.min(a.right, b.right) - Math.max(a.left, b.left);
  const height = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
  return width > 0 && height > 0 ? width * height : 0;
}

function placeNote({ note, cards, section, faceTop, faceCenter, faceSize, narrow, preferredCard }) {
  const pad = narrow ? 12 : 16;
  const gap = narrow ? 8 : 10;
  const noteWidth = note.offsetWidth || 1;
  const noteHeight = note.offsetHeight || 1;
  const sectionRect = section.getBoundingClientRect();
  const faceLeft = faceCenter - faceSize / 2;
  const faceRight = faceCenter + faceSize / 2;
  const faceMid = faceTop + faceSize * 0.42;

  const textBoxes = [...section.querySelectorAll(".projects-heading h2, .projects-heading p")].map((node) => {
    const range = document.createRange();
    range.selectNodeContents(node);
    const rect = range.getBoundingClientRect();
    return {
      left: rect.left - sectionRect.left,
      top: rect.top - sectionRect.top,
      right: rect.right - sectionRect.left,
      bottom: rect.bottom - sectionRect.top,
    };
  });
  const cardBoxes = cards.map((card) => {
    const rect = card.getBoundingClientRect();
    return {
      left: rect.left - sectionRect.left,
      top: rect.top - sectionRect.top,
      right: rect.right - sectionRect.left,
      bottom: rect.bottom - sectionRect.top,
    };
  });
  const blocked = cardBoxes.concat(textBoxes);

  const view = {
    left: pad - sectionRect.left,
    top: 8 - sectionRect.top,
    right: window.innerWidth - pad - sectionRect.left,
    bottom: window.innerHeight - 8 - sectionRect.top,
  };

  const candidates = [];
  const measure = (side, left, top) => {
    const box = { left, top, right: left + noteWidth, bottom: top + noteHeight };
    const overlap = blocked.reduce((sum, card) => sum + overlapArea(box, card), 0);
    const overflow =
      Math.max(0, view.left - box.left) +
      Math.max(0, box.right - view.right) +
      Math.max(0, view.top - box.top) +
      Math.max(0, box.bottom - view.bottom);
    const centerX = left + noteWidth / 2;
    const centerY = top + noteHeight / 2;
    const distance = Math.hypot(centerX - faceCenter, centerY - (faceTop + faceSize / 2));
    return { side, left, top, overlap, overflow, distance };
  };

  const add = (side, anchorX, anchorY) => {
    let left = anchorX;
    let top = anchorY;
    if (side === "above") {
      left = anchorX - noteWidth / 2;
      top = anchorY - noteHeight;
    } else if (side === "left") {
      left = anchorX - noteWidth;
      top = anchorY - noteHeight / 2;
    } else {
      top = anchorY - noteHeight / 2;
    }

    const raw = measure(side, left, top);
    let shiftX = 0;
    let shiftY = 0;
    if (left < view.left) shiftX = view.left - left;
    if (left + noteWidth + shiftX > view.right) shiftX += view.right - (left + noteWidth + shiftX);
    if (top < view.top) shiftY = view.top - top;
    if (top + noteHeight + shiftY > view.bottom) shiftY += view.bottom - (top + noteHeight + shiftY);
    const fitted = shiftX || shiftY ? measure(side, left + shiftX, top + shiftY) : raw;
    // Sliding into view is only useful when it stays off the cards.
    candidates.push(fitted.overlap <= raw.overlap + 8 ? fitted : raw);
  };

  add("above", faceCenter, faceTop - gap);
  add("left", faceLeft - gap, faceMid);
  add("right", faceRight + gap, faceMid);

  cardBoxes.forEach((card, index) => {
    const nearFace = faceTop < card.bottom && faceTop + faceSize > card.top - 80;
    if (!nearFace && index !== preferredCard) return;
    add("above", faceCenter, card.top - gap);
    const roomLeft = card.left - view.left;
    const roomRight = view.right - card.right;
    const besideY = clamp(faceMid, card.top + noteHeight / 2 + 8, card.bottom - noteHeight / 2 - 8);
    if (roomLeft > noteWidth * 0.55) add("left", card.left - gap, besideY);
    if (roomRight > noteWidth * 0.55) add("right", card.right + gap, besideY);
  });

  const spaceLeft = faceLeft - view.left;
  const spaceRight = view.right - faceRight;
  candidates.sort((a, b) => {
    if (a.overlap !== b.overlap) return a.overlap - b.overlap;
    if (a.overflow !== b.overflow) return a.overflow - b.overflow;
    const aClear = a.overlap < 8 && a.overflow < 2;
    const bClear = b.overlap < 8 && b.overflow < 2;
    if (aClear && bClear && a.side !== b.side) {
      if (!narrow && a.side === "above") return -1;
      if (!narrow && b.side === "above") return 1;
      if (narrow && spaceLeft > spaceRight + 24 && a.side === "left") return -1;
      if (narrow && spaceRight > spaceLeft + 24 && a.side === "right") return -1;
      if (narrow && spaceLeft > spaceRight + 24 && b.side === "left") return 1;
      if (narrow && spaceRight > spaceLeft + 24 && b.side === "right") return 1;
    }
    return a.distance - b.distance;
  });

  const best = candidates[0];
  if (!best || best.overlap > 20 || best.overflow > 24) {
    note.style.opacity = "0";
    return;
  }
  note.dataset.side = best.side;
  if (best.side === "above") {
    note.style.left = `${best.left + noteWidth / 2}px`;
    note.style.top = `${best.top + noteHeight}px`;
    note.style.setProperty("--origin", "50% 100%");
    const dot = clamp(((faceCenter - best.left) / noteWidth) * 100, 16, 84);
    note.style.setProperty("--dot", `${dot}%`);
  } else if (best.side === "left") {
    note.style.left = `${best.left + noteWidth}px`;
    note.style.top = `${best.top + noteHeight / 2}px`;
    note.style.setProperty("--origin", "100% 58%");
  } else {
    note.style.left = `${best.left}px`;
    note.style.top = `${best.top + noteHeight / 2}px`;
    note.style.setProperty("--origin", "0% 58%");
  }
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
      // The smile's chin ends at 67% of the image. The rest of the center is
      // empty, which is where the line shows. Drop the face so the chin meets
      // the card and the lower hair rests on it.
      const neckDrop = faceSize * 0.4 + 4;
      const sticks = cards.map((card) => origin + card.offsetTop + neckDrop);
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
      top = clamp(top, 0, lineEnd + neckDrop);

      const faceTopEdge = top - faceSize;
      let behind = false;
      cards.forEach((card) => {
        const cardTop = origin + card.offsetTop;
        const cardBottom = cardTop + card.offsetHeight;
        const into = top - cardTop;
        if (into > neckDrop + 10 && faceTopEdge < cardBottom - 12) behind = true;
      });

      face.style.top = `${top}px`;
      face.style.left = `${lineX}px`;
      face.style.width = `${faceSize}px`;
      face.style.height = `${faceSize}px`;
      face.classList.toggle("is-stuck", stuck !== -1 && !behind);
      face.classList.toggle("is-behind", behind);
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
      placeNote({
        note,
        cards,
        section,
        faceTop: top - faceSize,
        faceCenter: lineX,
        faceSize,
        narrow,
        preferredCard: stuck,
      });
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
      <div className="project-note" ref={noteRef} data-side="above">
        <div className="project-note-body">
          <span className="project-thought project-thought-1" />
          <span className="project-thought project-thought-2" />
          <p />
        </div>
      </div>
    </section>
  );
}
