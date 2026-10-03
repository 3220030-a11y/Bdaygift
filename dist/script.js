/* ==================================================================
   1. REFERENCIAS A LOS ELEMENTOS DEL HTML
   ================================================================== */
const experience = document.querySelector(".experience");
const hero = document.querySelector(".hero");
const invitation = document.querySelector(".invitation");
const gifts = document.querySelector(".gifts");

const scenes = [...document.querySelectorAll(".scene")];
const parallaxElements = [...document.querySelectorAll("[data-depth]")];

const openGiftButton = document.querySelector("#open-gift");
const yesButton = document.querySelector("#answer-yes");
const noButton = document.querySelector("#answer-no");
const invitationMessage = document.querySelector("#invitation-message");

const openSongsButton = document.querySelector("#open-songs");
const songsPanel = document.querySelector("#songs-panel");
const closeSongsButton = document.querySelector("#close-songs");
const songVideos = [...document.querySelectorAll(".song-card video")];

const openMemoriesButton = document.querySelector("#open-memories");
const memoriesPanel = document.querySelector("#memories-panel");
const closeMemoriesButton = document.querySelector("#close-memories");
const memoryGrid = document.querySelector("#memory-grid");
const memoryLightbox = document.querySelector("#memory-lightbox");
const lightboxImage = document.querySelector("#lightbox-image");
const lightboxCounter = document.querySelector("#lightbox-counter");
const closeLightboxButton = document.querySelector("#close-lightbox");
const previousPhotoButton = document.querySelector("#previous-photo");
const nextPhotoButton = document.querySelector("#next-photo");

/* Fotografías preparadas en gallery-data.js. */
const galleryPhotos = Array.isArray(window.REBECA_GALLERY) ? window.REBECA_GALLERY : [];

const openMessagesButton = document.querySelector("#open-messages");
const messagesPanel = document.querySelector("#messages-panel");
const closeMessagesButton = document.querySelector("#close-messages");

const openWishButton = document.querySelector("#open-wish");
const wishPanel = document.querySelector("#wish-panel");
const closeWishButton = document.querySelector("#close-wish");
const wishScene = document.querySelector("#wish-scene");
const blowCandlesButton = document.querySelector("#blow-candles");
const wishMessage = document.querySelector("#wish-message");
const confettiCanvas = document.querySelector("#confetti-canvas");

/* Lista centralizada para que nunca queden dos paneles abiertos a la vez. */
const giftPanels = [songsPanel, memoriesPanel, messagesPanel, wishPanel];

/* Detecta si el dispositivo prefiere menos movimiento. */
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

/* ==================================================================
   2. CONFIGURACIÓN Y ESTADO DE LAS ESCENAS
   ================================================================== */
const SCENE_DURATION = 3300; // Tiempo de cada imagen: 3.3 segundos.

let activeScene = 0;
let autoplayId;
let videosAreReady = false;
let confettiAnimationId;
let messageTimerId;
let galleryIsReady = false;
let currentPhotoIndex = 0;
let lightboxTrigger;
let swipeStartX = 0;

/** Muestra la escena siguiente de la portada. */
function showNextScene() {
  scenes[activeScene].classList.remove("is-active");
  activeScene = (activeScene + 1) % scenes.length;
  scenes[activeScene].classList.add("is-active");
}

/** Inicia o reinicia el cambio automático de imágenes. */
function startAutoplay() {
  window.clearInterval(autoplayId);

  if (!reduceMotion.matches) {
    autoplayId = window.setInterval(showNextScene, SCENE_DURATION);
  }
}

/* ==================================================================
   3. EFECTO PARALLAX DE LA PORTADA
   ================================================================== */
function updateParallax(clientX, clientY) {
  if (reduceMotion.matches) return;

  const x = (clientX / window.innerWidth - 0.5) * -24;
  const y = (clientY / window.innerHeight - 0.5) * -18;

  parallaxElements.forEach((element) => {
    const depth = Number(element.dataset.depth) || 0;
    element.style.setProperty("--px", `${(x * depth).toFixed(2)}px`);
    element.style.setProperty("--py", `${(y * depth).toFixed(2)}px`);
  });
}

hero.addEventListener("pointermove", (event) => {
  updateParallax(event.clientX, event.clientY);
});

hero.addEventListener("pointerleave", () => {
  parallaxElements.forEach((element) => {
    element.style.setProperty("--px", "0px");
    element.style.setProperty("--py", "0px");
  });
});

/* ==================================================================
   4. NAVEGACIÓN ENTRE LAS TRES PANTALLAS
   ================================================================== */
openGiftButton.addEventListener("click", () => {
  window.clearInterval(autoplayId);
  invitation.removeAttribute("aria-hidden");
  experience.classList.add("show-invitation");

  window.setTimeout(() => yesButton.focus(), reduceMotion.matches ? 0 : 900);
});

noButton.addEventListener("click", () => {
  invitationMessage.textContent = "Pero lo hice para ti… ¿Le das una oportunidad?";
  noButton.hidden = true;
  yesButton.focus();
});

yesButton.addEventListener("click", () => {
  noButton.hidden = true;
  gifts.removeAttribute("aria-hidden");
  experience.classList.add("show-gifts");

  window.setTimeout(() => openSongsButton.focus(), reduceMotion.matches ? 0 : 900);
});

/* ==================================================================
   5. PANELES DEL REGALO
   Estas funciones comunes mantienen la navegación ordenada y evitan
   que la página se bloquee al abrir o cerrar una sección.
   ================================================================== */
/**
 * Activa las fuentes de video la primera vez que se abre el panel.
 * Así los MP4 no retrasan la carga inicial de la portada.
 */
function prepareVideos() {
  if (videosAreReady) return;

  songVideos.forEach((video) => {
    const source = video.querySelector("source[data-src]");
    source.src = source.dataset.src;
    video.preload = "metadata";
    video.load();
  });

  videosAreReady = true;
}

/** Detiene todas las canciones que estén reproduciéndose. */
function pauseSongs() {
  songVideos.forEach((video) => video.pause());
}

/** Limpia la animación de la vela para poder repetirla al volver a entrar. */
function resetWish() {
  window.clearTimeout(messageTimerId);
  window.cancelAnimationFrame(confettiAnimationId);

  const context = confettiCanvas.getContext("2d");
  context.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);

  wishScene.classList.remove("candles-out");
  wishMessage.classList.remove("is-visible");
  wishMessage.hidden = true;
  blowCandlesButton.disabled = false;
}

/** Oculta los otros paneles antes de abrir el seleccionado. */
function hideOtherPanels(activePanel) {
  giftPanels.forEach((panel) => {
    if (panel !== activePanel) panel.hidden = true;
  });

  if (activePanel !== songsPanel) pauseSongs();
  if (activePanel !== memoriesPanel) closeLightbox(false);
  if (activePanel !== wishPanel) resetWish();
}

/** Abre un panel y lo lleva a la zona visible de la pantalla. */
function openPanel(panel, closeButton) {
  hideOtherPanels(panel);
  panel.hidden = false;

  // Espera a que el navegador dibuje el panel antes de calcular su posición.
  window.requestAnimationFrame(() => {
    gifts.scrollTo({
      top: Math.max(panel.offsetTop - 24, 0),
      behavior: reduceMotion.matches ? "auto" : "smooth",
    });
    closeButton.focus({ preventScroll: true });
  });
}

/** Cierra un panel y devuelve el foco a su botón del menú. */
function closePanel(panel, openButton) {
  panel.hidden = true;
  gifts.scrollTo({
    top: 0,
    behavior: reduceMotion.matches ? "auto" : "smooth",
  });
  openButton.focus({ preventScroll: true });
}

/* ==================================================================
   6. GALERÍA RESPONSIVE Y VISOR DE FOTOGRAFÍAS
   Las miniaturas se crean al abrir la sección por primera vez.
   ================================================================== */
function renderGallery() {
  if (galleryIsReady) return;

  const fragment = document.createDocumentFragment();

  galleryPhotos.forEach((photo, index) => {
    const button = document.createElement("button");
    const image = document.createElement("img");

    button.className = "memory-card";
    button.type = "button";
    button.dataset.photoIndex = String(index);
    button.setAttribute("aria-label", `Abrir fotografía ${index + 1} de ${galleryPhotos.length}`);
    button.style.setProperty("--memory-index", String(index));

    image.src = photo.thumb;
    image.alt = "";
    image.width = photo.width;
    image.height = photo.height;
    image.loading = "lazy";
    image.decoding = "async";

    button.append(image);
    fragment.append(button);
  });

  memoryGrid.append(fragment);
  galleryIsReady = true;
}

/** Actualiza la fotografía ampliada y adelanta la carga de la siguiente. */
function updateLightboxPhoto() {
  const photo = galleryPhotos[currentPhotoIndex];
  if (!photo) return;

  lightboxImage.src = photo.full;
  lightboxCounter.textContent = `${currentPhotoIndex + 1} / ${galleryPhotos.length}`;

  const nextIndex = (currentPhotoIndex + 1) % galleryPhotos.length;
  const preloadNextPhoto = new Image();
  preloadNextPhoto.src = galleryPhotos[nextIndex].full;
}

function openLightbox(index, trigger) {
  if (!galleryPhotos.length) return;

  currentPhotoIndex = index;
  lightboxTrigger = trigger;
  updateLightboxPhoto();
  memoryLightbox.hidden = false;
  document.body.classList.add("lightbox-open");
  window.requestAnimationFrame(() => closeLightboxButton.focus({ preventScroll: true }));
}

function closeLightbox(returnFocus = true) {
  if (memoryLightbox.hidden) return;

  memoryLightbox.hidden = true;
  document.body.classList.remove("lightbox-open");

  if (returnFocus && lightboxTrigger) {
    lightboxTrigger.focus({ preventScroll: true });
  }
}

function showAdjacentPhoto(direction) {
  currentPhotoIndex = (currentPhotoIndex + direction + galleryPhotos.length) % galleryPhotos.length;
  updateLightboxPhoto();
}

openSongsButton.addEventListener("click", () => {
  prepareVideos();
  openPanel(songsPanel, closeSongsButton);
});

closeSongsButton.addEventListener("click", () => {
  pauseSongs();
  closePanel(songsPanel, openSongsButton);
});

openMemoriesButton.addEventListener("click", () => {
  renderGallery();
  openPanel(memoriesPanel, closeMemoriesButton);
});

closeMemoriesButton.addEventListener("click", () => {
  closeLightbox(false);
  closePanel(memoriesPanel, openMemoriesButton);
});

openMessagesButton.addEventListener("click", () => {
  openPanel(messagesPanel, closeMessagesButton);
});

closeMessagesButton.addEventListener("click", () => {
  closePanel(messagesPanel, openMessagesButton);
});

memoryGrid.addEventListener("click", (event) => {
  const selectedPhoto = event.target.closest(".memory-card");
  if (!selectedPhoto) return;

  openLightbox(Number(selectedPhoto.dataset.photoIndex), selectedPhoto);
});

closeLightboxButton.addEventListener("click", () => closeLightbox());
previousPhotoButton.addEventListener("click", () => showAdjacentPhoto(-1));
nextPhotoButton.addEventListener("click", () => showAdjacentPhoto(1));

/* Cierra el visor al pulsar el fondo oscuro. */
memoryLightbox.addEventListener("click", (event) => {
  if (event.target === memoryLightbox) closeLightbox();
});

/* Navegación por teclado para computadora. */
document.addEventListener("keydown", (event) => {
  if (memoryLightbox.hidden) return;

  if (event.key === "Escape") closeLightbox();
  if (event.key === "ArrowLeft") showAdjacentPhoto(-1);
  if (event.key === "ArrowRight") showAdjacentPhoto(1);
});

/* Deslizamiento horizontal para cambiar de foto en celulares. */
memoryLightbox.addEventListener("pointerdown", (event) => {
  swipeStartX = event.clientX;
});

memoryLightbox.addEventListener("pointerup", (event) => {
  const distance = event.clientX - swipeStartX;
  if (Math.abs(distance) < 55) return;
  showAdjacentPhoto(distance > 0 ? -1 : 1);
});

openWishButton.addEventListener("click", () => {
  resetWish();
  openPanel(wishPanel, closeWishButton);
});

closeWishButton.addEventListener("click", () => {
  resetWish();
  closePanel(wishPanel, openWishButton);
});

/* Permite reproducir solo un video a la vez. */
songVideos.forEach((selectedVideo) => {
  selectedVideo.addEventListener("play", () => {
    songVideos.forEach((video) => {
      if (video !== selectedVideo) video.pause();
    });
  });
});

/* ==================================================================
   7. VELAS, CONFETI Y MENSAJE DE CUMPLEAÑOS
   El canvas se crea al pulsar el pastel y se limpia al terminar.
   ================================================================== */
function launchConfetti() {
  const context = confettiCanvas.getContext("2d");
  const bounds = wishScene.getBoundingClientRect();
  const width = bounds.width;
  const height = bounds.height;
  const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);

  confettiCanvas.width = Math.round(width * pixelRatio);
  confettiCanvas.height = Math.round(height * pixelRatio);
  context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);

  const colors = ["#ff4f9a", "#ffd36e", "#ffffff", "#b967ff", "#ff8ac2", "#73ddff"];
  const particles = Array.from({ length: 180 }, () => {
    const angle = Math.random() * Math.PI * 2;
    const speed = 4 + Math.random() * 10;

    return {
      x: width / 2,
      y: height * 0.58,
      velocityX: Math.cos(angle) * speed,
      velocityY: Math.sin(angle) * speed - 4,
      size: 5 + Math.random() * 8,
      rotation: Math.random() * Math.PI,
      rotationSpeed: (Math.random() - 0.5) * 0.35,
      color: colors[Math.floor(Math.random() * colors.length)],
      life: 90 + Math.random() * 50,
    };
  });

  function drawConfetti() {
    context.clearRect(0, 0, width, height);

    particles.forEach((particle) => {
      particle.velocityX *= 0.992;
      particle.velocityY += 0.16;
      particle.x += particle.velocityX;
      particle.y += particle.velocityY;
      particle.rotation += particle.rotationSpeed;
      particle.life -= 1;

      context.save();
      context.globalAlpha = Math.max(0, Math.min(1, particle.life / 24));
      context.translate(particle.x, particle.y);
      context.rotate(particle.rotation);
      context.fillStyle = particle.color;
      context.fillRect(-particle.size / 2, -particle.size / 4, particle.size, particle.size / 2);
      context.restore();
    });

    if (particles.some((particle) => particle.life > 0 && particle.y < height + 30)) {
      confettiAnimationId = window.requestAnimationFrame(drawConfetti);
    } else {
      context.clearRect(0, 0, width, height);
    }
  }

  drawConfetti();
}

function celebrateBirthday() {
  if (wishScene.classList.contains("candles-out")) return;

  wishScene.classList.add("candles-out");
  blowCandlesButton.disabled = true;

  if (!reduceMotion.matches) launchConfetti();

  messageTimerId = window.setTimeout(() => {
    wishMessage.hidden = false;
    window.requestAnimationFrame(() => wishMessage.classList.add("is-visible"));
  }, reduceMotion.matches ? 0 : 650);
}

blowCandlesButton.addEventListener("click", celebrateBirthday);

/* ==================================================================
   8. CONTROL DEL AUTOPLAY SEGÚN EL ESTADO DE LA PÁGINA
   ================================================================== */
document.addEventListener("visibilitychange", () => {
  if (document.hidden) {
    window.clearInterval(autoplayId);
  } else if (!experience.classList.contains("show-invitation")) {
    startAutoplay();
  }
});

reduceMotion.addEventListener("change", startAutoplay);
startAutoplay();
