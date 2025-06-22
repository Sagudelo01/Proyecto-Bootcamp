document.addEventListener("DOMContentLoaded", () => {
  const toggleBtn = document.querySelector("[data-resize-btn]");
  const menuBtn = document.getElementById("menuToggle");
  const darkBtn = document.getElementById("darkModeToggle");
  const clickSound = document.getElementById("clickSound");
  const body = document.body;

  // Activar modo oscuro por hora
  const hour = new Date().getHours();
  if (hour >= 19 || hour < 7) {
    body.classList.add("darkmode");
  }

  // Restaurar modo desde localStorage
  if (localStorage.getItem("darkmode") === "true") {
    body.classList.add("darkmode");
  }

  // Actualizar ícono del botón según modo
  if (body.classList.contains("darkmode")) {
    darkBtn.textContent = "☀️";
  }

  // Botón de modo oscuro con sonido y animación
  darkBtn?.addEventListener("click", () => {
    body.classList.toggle("darkmode");
    const isDark = body.classList.contains("darkmode");
    localStorage.setItem("darkmode", isDark);
    darkBtn.textContent = isDark ? "☀️" : "🌙";
    darkBtn.classList.add("spin");
    setTimeout(() => darkBtn.classList.remove("spin"), 600);
    clickSound?.play();
  });

  // Botones de menú y colapsar sidebar
  [toggleBtn, menuBtn].forEach(btn => {
    btn?.addEventListener("click", () => {
      body.classList.toggle("sb-expanded");
      clickSound?.play();
    });
  });

  // Animación de bloques al aparecer
  const placeholders = document.querySelectorAll(".placeholder > div");
  const observer = new IntersectionObserver(
    entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add("show");
        }
      });
    },
    { threshold: 0.3 }
  );
  placeholders.forEach(div => observer.observe(div));
});

// Partículas flotantes cósmicas
tsParticles.load("tsparticles", {
  background: { color: "#00000000" },
  fpsLimit: 60,
  particles: {
    color: { value: "#ffffff" },
    links: {
      enable: true,
      color: "#999999",
      distance: 120,
      opacity: 0.5,
      width: 0.7
    },
    move: { enable: true, speed: 1.5 },
    number: { value: 50 },
    opacity: { value: 0.4 },
    shape: { type: ["circle", "star"] },
    size: { value: 3 }
  }
});