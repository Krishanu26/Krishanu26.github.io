const menuButton = document.querySelector(".menu-toggle");
const navigation = document.querySelector(".primary-nav");

if (menuButton && navigation) {
  menuButton.addEventListener("click", () => {
    const isExpanded = menuButton.getAttribute("aria-expanded") === "true";
    menuButton.setAttribute("aria-expanded", String(!isExpanded));
    navigation.classList.toggle("is-open", !isExpanded);
  });

  navigation.addEventListener("click", (event) => {
    if (event.target.closest("a")) {
      menuButton.setAttribute("aria-expanded", "false");
      navigation.classList.remove("is-open");
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && menuButton.getAttribute("aria-expanded") === "true") {
      menuButton.setAttribute("aria-expanded", "false");
      navigation.classList.remove("is-open");
      menuButton.focus();
    }
  });
}

const year = document.querySelector("#current-year");
if (year) year.textContent = String(new Date().getFullYear());

const progressBar = document.querySelector(".scroll-progress");
const updateScrollProgress = () => {
  if (!progressBar) return;
  const scrollable = document.documentElement.scrollHeight - window.innerHeight;
  const progress = scrollable > 0 ? (window.scrollY / scrollable) * 100 : 0;
  progressBar.style.width = progress + "%";
};
window.addEventListener("scroll", updateScrollProgress, { passive: true });
updateScrollProgress();

const filterButtons = document.querySelectorAll(".filter-button");
const projectCards = document.querySelectorAll(".project-card[data-category]");
filterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const selectedFilter = button.dataset.filter;
    filterButtons.forEach((item) => {
      const active = item === button;
      item.classList.toggle("is-active", active);
      item.setAttribute("aria-pressed", String(active));
    });
    projectCards.forEach((card) => {
      const shouldShow = selectedFilter === "all" || card.dataset.category === selectedFilter;
      card.classList.toggle("is-hidden", !shouldShow);
    });
  });
});

const revealElements = document.querySelectorAll(".reveal");
if ("IntersectionObserver" in window && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
  const revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });
  revealElements.forEach((element) => revealObserver.observe(element));
} else {
  revealElements.forEach((element) => element.classList.add("is-visible"));
}

// Download the two-page CV PDF from the compressed static assets.
const cvDownloadLinks = document.querySelectorAll("#nav-download-cv, #download-cv, .cv-download");
cvDownloadLinks.forEach((link) => {
  link.addEventListener("click", async (event) => {
    event.preventDefault();
    link.setAttribute("aria-busy", "true");
    try {
      const parts = ["cv-0.txt", "cv-1.txt", "cv-2.txt"];
      const encodedParts = await Promise.all(parts.map(async (part) => {
        const response = await fetch("cv-assets/" + part);
        if (!response.ok) throw new Error("CV file part could not be loaded");
        return response.text();
      }));
      const binary = atob(encodedParts.join(""));
      const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
      if (!("DecompressionStream" in window)) throw new Error("Gzip decompression is not supported");
      const pdfBlob = await new Response(
        new Blob([bytes]).stream().pipeThrough(new DecompressionStream("gzip"))
      ).blob();
      const downloadUrl = URL.createObjectURL(new Blob([pdfBlob], { type: "application/pdf" }));
      const downloadLink = document.createElement("a");
      downloadLink.href = downloadUrl;
      downloadLink.download = "Krishanu-Jana-CV.pdf";
      document.body.appendChild(downloadLink);
      downloadLink.click();
      downloadLink.remove();
      window.setTimeout(() => URL.revokeObjectURL(downloadUrl), 1500);
    } catch (error) {
      // Keep the readable web CV available if a browser blocks PDF generation.
      window.location.href = "cv.html";
    } finally {
      link.removeAttribute("aria-busy");
    }
  });
});


// Lightweight particle field: no external 3D library or network dependency.
const particleCanvas = document.querySelector("#particle-field");
if (particleCanvas && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
  const context = particleCanvas.getContext("2d");
  if (context) {
    let particles = [];
    let frame = 0;
    let width = 0;
    let height = 0;
    const pointer = { x: -1000, y: -1000 };
    const resizeParticles = () => {
      const rect = particleCanvas.getBoundingClientRect();
      const ratio = Math.min(window.devicePixelRatio || 1, 1.5);
      width = rect.width;
      height = rect.height;
      particleCanvas.width = Math.round(width * ratio);
      particleCanvas.height = Math.round(height * ratio);
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      const count = Math.min(72, Math.max(26, Math.round(width / 13)));
      particles = Array.from({ length: count }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        radius: Math.random() * 1.35 + .35,
        speed: Math.random() * .22 + .08,
        phase: Math.random() * Math.PI * 2
      }));
    };
    const drawParticles = () => {
      context.clearRect(0, 0, width, height);
      particles.forEach((particle, index) => {
        particle.y -= particle.speed;
        if (particle.y < -4) {
          particle.y = height + 4;
          particle.x = Math.random() * width;
        }
        const dx = particle.x - pointer.x;
        const dy = particle.y - pointer.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const alpha = .2 + (Math.sin(frame * .012 + particle.phase) + 1) * .12;
        context.beginPath();
        context.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
        context.fillStyle = "rgba(198,237,112," + (distance < 130 ? .65 : alpha) + ")";
        context.fill();
        if (index % 4 === 0 && index + 4 < particles.length) {
          const other = particles[index + 4];
          const separation = Math.hypot(particle.x - other.x, particle.y - other.y);
          if (separation < 100) {
            context.beginPath();
            context.moveTo(particle.x, particle.y);
            context.lineTo(other.x, other.y);
            context.strokeStyle = "rgba(255,121,87," + (.12 * (1 - separation / 100)) + ")";
            context.lineWidth = .6;
            context.stroke();
          }
        }
      });
      frame += 1;
      requestAnimationFrame(drawParticles);
    };
    const hero = particleCanvas.closest(".hero");
    if (hero) {
      hero.addEventListener("pointermove", (event) => {
        const rect = particleCanvas.getBoundingClientRect();
        pointer.x = event.clientX - rect.left;
        pointer.y = event.clientY - rect.top;
      }, { passive: true });
      hero.addEventListener("pointerleave", () => {
        pointer.x = -1000;
        pointer.y = -1000;
      });
    }
    resizeParticles();
    window.addEventListener("resize", resizeParticles, { passive: true });
    requestAnimationFrame(drawParticles);
  }
}

// Pointer-responsive 3D monogram. Touch and reduced-motion users get a calm static view.
const tiltScene = document.querySelector("[data-tilt-scene]");
if (tiltScene && window.matchMedia("(hover: hover) and (pointer: fine)").matches &&
    !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
  const world = tiltScene.querySelector(".scene-world");
  if (world) {
    tiltScene.addEventListener("pointermove", (event) => {
      const bounds = tiltScene.getBoundingClientRect();
      const x = (event.clientX - bounds.left) / bounds.width - .5;
      const y = (event.clientY - bounds.top) / bounds.height - .5;
      world.style.setProperty("--scene-x", (-y * 15 - 8).toFixed(2) + "deg");
      world.style.setProperty("--scene-y", (x * 19 + 10).toFixed(2) + "deg");
    });
    tiltScene.addEventListener("pointerleave", () => {
      world.style.setProperty("--scene-x", "-8deg");
      world.style.setProperty("--scene-y", "10deg");
    });
  }
}

// Give project cards a restrained 3D tilt and move their specular highlight with the pointer.
const depthCards = document.querySelectorAll(".project-card");
if (window.matchMedia("(hover: hover) and (pointer: fine)").matches &&
    !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
  depthCards.forEach((card) => {
    card.addEventListener("pointermove", (event) => {
      const bounds = card.getBoundingClientRect();
      const x = (event.clientX - bounds.left) / bounds.width;
      const y = (event.clientY - bounds.top) / bounds.height;
      card.style.setProperty("--tilt-y", ((x - .5) * 5).toFixed(2) + "deg");
      card.style.setProperty("--tilt-x", ((.5 - y) * 4).toFixed(2) + "deg");
      card.style.setProperty("--shine-x", (x * 100).toFixed(1) + "%");
      card.style.setProperty("--shine-y", (y * 100).toFixed(1) + "%");
    });
    card.addEventListener("pointerleave", () => {
      card.style.setProperty("--tilt-x", "0deg");
      card.style.setProperty("--tilt-y", "0deg");
      card.style.setProperty("--shine-x", "50%");
      card.style.setProperty("--shine-y", "50%");
    });
  });
}
