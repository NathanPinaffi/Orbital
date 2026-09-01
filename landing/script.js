// Monta o foguete peça por peça: cada <g class="piece"> começa deslocada
// (translateX/Y + rotate) da posição final e anima até (0,0,0) via anime.js.

const startOffsets = {
  "nose":      { x: -180, y: -140, r: -35 },
  "window":    { x: 160,  y: -60,  r: 25 },
  "body":      { x: -160, y: 40,   r: -18 },
  "fin-left":  { x: -200, y: 120,  r: -60 },
  "fin-right": { x: 200,  y: 120,  r: 60 },
  "tip":       { x: 0,    y: -180, r: 0 },
  "glow":      { x: 0,    y: 60,   r: 0 },
  "flame":     { x: 0,    y: 80,   r: 0 },
};

// ordem de montagem: da cauda para o topo, motor liga por último
const assemblyOrder = ["fin-left", "fin-right", "body", "window", "nose", "tip"];

function buildRocket() {
  const svg = document.getElementById("rocket");
  const pieceEl = (name) => svg.querySelector(`[data-piece="${name}"]`);

  // estado inicial: cada peça espalhada e invisível
  Object.entries(startOffsets).forEach(([name, offset]) => {
    anime.set(pieceEl(name), {
      translateX: offset.x,
      translateY: offset.y,
      rotate: offset.r,
      opacity: 0,
    });
  });

  const tl = anime.timeline({ complete: startIdleAnimations });

  assemblyOrder.forEach((name, i) => {
    tl.add(
      {
        targets: pieceEl(name),
        translateX: 0,
        translateY: 0,
        rotate: 0,
        opacity: 1,
        duration: 900,
        easing: "easeOutElastic(1, .65)",
      },
      i === 0 ? 200 : "-=650"
    );
  });

  // motor liga por último, com uma respirada extra
  tl.add(
    {
      targets: [pieceEl("glow"), pieceEl("flame")],
      translateX: 0,
      translateY: 0,
      opacity: 1,
      duration: 400,
      easing: "easeOutQuad",
    },
    "-=150"
  );
}

function startIdleAnimations() {
  // foguete flutua suavemente
  anime({
    targets: "#rocket",
    translateY: [0, -10],
    duration: 2200,
    direction: "alternate",
    loop: true,
    easing: "easeInOutSine",
  });

  // chama tremula
  anime({
    targets: "#flame-path",
    scaleY: [1, 1.15, 0.9, 1],
    scaleX: [1, 0.92, 1.05, 1],
    duration: 500,
    loop: true,
    easing: "easeInOutQuad",
  });

  anime({
    targets: '[data-piece="glow"] ellipse',
    opacity: [0.35, 0.15],
    duration: 700,
    direction: "alternate",
    loop: true,
    easing: "easeInOutSine",
  });
}

// Reveal on scroll para as seções abaixo do hero
function setupScrollReveal() {
  const targets = document.querySelectorAll(".step, .feature-card");
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          anime({
            targets: entry.target,
            opacity: [0, 1],
            translateY: [24, 0],
            duration: 700,
            easing: "easeOutQuad",
            delay: 80,
          });
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.2 }
  );

  targets.forEach((el) => observer.observe(el));
}

// Estrelas com leve paralaxe no scroll
function setupParallax() {
  const stars = document.getElementById("stars");
  window.addEventListener("scroll", () => {
    stars.style.transform = `translateY(${window.scrollY * 0.05}px)`;
  });
}

buildRocket();
setupScrollReveal();
setupParallax();
