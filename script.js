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
const cvDownloadLinks = document.querySelectorAll("#nav-download-cv, #download-cv");
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
