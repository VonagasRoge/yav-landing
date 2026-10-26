(() => {
  const track = document.querySelector("[data-gallery-track]");
  const prev = document.querySelector("[data-gallery-prev]");
  const next = document.querySelector("[data-gallery-next]");

  if (track && prev && next) {
    const scrollBySlide = (direction) => {
      const slide = track.querySelector(".gallery__slide");
      if (!slide) return;
      const amount = slide.getBoundingClientRect().width + 24;
      track.scrollBy({ left: direction * amount, behavior: "smooth" });
    };

    prev.addEventListener("click", () => scrollBySlide(-1));
    next.addEventListener("click", () => scrollBySlide(1));
  }

  const burger = document.querySelector(".header__burger");
  const navLeft = document.querySelector(".header__nav--left");
  const navRight = document.querySelector(".header__nav--right");

  if (burger && navLeft && navRight) {
    burger.addEventListener("click", () => {
      const open = burger.getAttribute("aria-expanded") === "true";
      burger.setAttribute("aria-expanded", String(!open));
      navLeft.classList.toggle("is-open", !open);
      navRight.classList.toggle("is-open", !open);
      document.body.classList.toggle("menu-open", !open);
    });
  }

  initHeroParticles();
  initStarSpin();
})();

function initStarSpin() {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const stars = document.querySelectorAll(".js-star");
  if (!stars.length || reduceMotion) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        entry.target.classList.toggle("is-spinning", entry.isIntersecting);
      });
    },
    { threshold: 0.15 }
  );

  stars.forEach((star) => observer.observe(star));
}

function initHeroParticles() {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const canvas = document.querySelector("[data-hero-canvas]");
  const wrap = document.querySelector("[data-hero-particles]");
  if (!canvas || !wrap || reduceMotion) return;

  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const mouse = { x: -9999, y: -9999, active: false };
  let particles = [];
  let rafId = 0;
  let width = 0;
  let height = 0;

  const settings = {
    gap: 1,
    mouseRadius: 70,
    mouseForce: 22,
    ease: 0.09,
    friction: 0.84,
    color: "#ffffff",
    particleSize: 1.5,
    alphaThreshold: 100,
  };

  const lines = [
    {
      text: "ЯВЬ",
      font: (size) => `400 ${size}px Bergamasco, "Times New Roman", serif`,
      sizeAt1440: 117,
      letterSpacing: 0.08,
      gapAfter: 8,
    },
    {
      text: "ЩУКИНСКАЯ",
      font: (size) => `400 ${size}px Bergamasco, "Times New Roman", serif`,
      sizeAt1440: 117,
      letterSpacing: 0.08,
      gapAfter: 28,
    },
    {
      text: "ваше место проявления",
      font: (size) => `400 ${size}px "Golos Text", "Segoe UI", sans-serif`,
      sizeAt1440: 48,
      letterSpacing: 0,
      gapAfter: 48,
    },
    {
      text: "КЛАСТЕР АРТ-ДЕРЕВЕНЬ",
      font: (size) => `400 ${size}px "Roboto Condensed", "Arial Narrow", sans-serif`,
      sizeAt1440: 24,
      letterSpacing: 0.04,
      gapAfter: 0,
    },
  ];

  function scaleFont(base) {
    const page = Math.min(wrap.clientWidth || 847, 847);
    return Math.max(base * (page / 847), base * 0.45);
  }

  function measureLayout(targetWidth) {
    let totalHeight = 40;
    const measured = lines.map((line) => {
      const fontSize = scaleFont(line.sizeAt1440);
      ctx.font = line.font(fontSize);
      ctx.textBaseline = "top";
      const spacing = fontSize * line.letterSpacing;
      let textWidth = 0;
      for (let i = 0; i < line.text.length; i += 1) {
        textWidth += ctx.measureText(line.text[i]).width;
        if (i < line.text.length - 1) textWidth += spacing;
      }
      const block = {
        ...line,
        fontSize,
        textWidth,
        y: totalHeight,
        spacing,
      };
      totalHeight += fontSize * 1.15 + line.gapAfter;
      return block;
    });

    return {
      width: Math.max(targetWidth, Math.ceil(Math.max(...measured.map((m) => m.textWidth)) + 48)),
      height: Math.ceil(totalHeight + 24),
      measured,
    };
  }

  function drawSource(layout) {
    const off = document.createElement("canvas");
    off.width = Math.ceil(layout.width * dpr);
    off.height = Math.ceil(layout.height * dpr);
    const octx = off.getContext("2d", { willReadFrequently: true });
    octx.scale(dpr, dpr);
    octx.clearRect(0, 0, layout.width, layout.height);
    octx.fillStyle = "#fff";
    octx.textBaseline = "top";
    octx.textAlign = "left";

    layout.measured.forEach((line) => {
      octx.font = line.font(line.fontSize);
      const startX = (layout.width - line.textWidth) / 2;
      let x = startX;
      for (let i = 0; i < line.text.length; i += 1) {
        const ch = line.text[i];
        octx.fillText(ch, x, line.y);
        x += octx.measureText(ch).width + line.spacing;
      }
    });

    return octx.getImageData(0, 0, off.width, off.height);
  }

  function buildParticles() {
    const cssWidth = wrap.clientWidth || 847;
    const layout = measureLayout(cssWidth);
    width = layout.width;
    height = layout.height;

    canvas.width = Math.ceil(width * dpr);
    canvas.height = Math.ceil(height * dpr);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    wrap.style.minHeight = `${height}px`;

    const image = drawSource(layout);
    const data = image.data;
    const gap = Math.max(1, Math.round(settings.gap * dpr));
    const next = [];

    for (let y = 0; y < image.height; y += gap) {
      for (let x = 0; x < image.width; x += gap) {
        const i = (y * image.width + x) * 4;
        if (data[i + 3] > settings.alphaThreshold) {
          const ox = x / dpr;
          const oy = y / dpr;
          next.push({
            ox,
            oy,
            x: ox,
            y: oy,
            vx: 0,
            vy: 0,
          });
        }
      }
    }

    particles = next;
  }

  function onPointerMove(event) {
    const rect = canvas.getBoundingClientRect();
    mouse.x = event.clientX - rect.left;
    mouse.y = event.clientY - rect.top;
    mouse.active = true;
  }

  function onPointerLeave() {
    mouse.active = false;
    mouse.x = -9999;
    mouse.y = -9999;
  }

  function frame() {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = settings.color;

    const radius = settings.mouseRadius;
    const radiusSq = radius * radius;
    const dotRadius = settings.particleSize / 2;

    ctx.beginPath();

    for (let i = 0; i < particles.length; i += 1) {
      const p = particles[i];

      if (mouse.active) {
        const dx = p.x - mouse.x;
        const dy = p.y - mouse.y;
        const distSq = dx * dx + dy * dy;
        if (distSq < radiusSq && distSq > 0.01) {
          const dist = Math.sqrt(distSq);
          const force = (radius - dist) / radius;
          const angle = Math.atan2(dy, dx);
          p.vx += Math.cos(angle) * force * settings.mouseForce;
          p.vy += Math.sin(angle) * force * settings.mouseForce;
        }
      }

      p.vx += (p.ox - p.x) * settings.ease;
      p.vy += (p.oy - p.y) * settings.ease;
      p.vx *= settings.friction;
      p.vy *= settings.friction;
      p.x += p.vx;
      p.y += p.vy;

      ctx.moveTo(p.x + dotRadius, p.y);
      ctx.arc(p.x, p.y, dotRadius, 0, Math.PI * 2);
    }

    ctx.fill();

    rafId = requestAnimationFrame(frame);
  }

  function start() {
    cancelAnimationFrame(rafId);
    document.fonts.ready.then(() => {
      buildParticles();
      rafId = requestAnimationFrame(frame);
    });
  }

  canvas.addEventListener("pointermove", onPointerMove);
  canvas.addEventListener("pointerleave", onPointerLeave);
  canvas.addEventListener("pointerdown", onPointerMove);

  let resizeTimer = 0;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(start, 150);
  });

  start();
}
