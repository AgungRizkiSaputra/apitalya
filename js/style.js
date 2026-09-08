document.addEventListener("DOMContentLoaded", () => {
  const btnOpen = document.getElementById("btn-open");
  const cover = document.getElementById("cover");
  const mainContent = document.getElementById("main-content");
  const bgMusic = document.getElementById("bg-music");
  const musicControl = document.getElementById("music-control");
  let isPlaying = false;

  // 1. Buka Undangan & Putar Musik
  btnOpen.addEventListener("click", () => {
    cover.classList.add("slide-up");
    mainContent.classList.remove("content-hidden");
    musicControl.classList.remove("hide");

    bgMusic.play().then(() => {
      isPlaying = true;
    }).catch(err => console.log("Autoplay blocked:", err));
  });

  // 2. Play/Pause Musik
  musicControl.addEventListener("click", () => {
    if (isPlaying) {
      bgMusic.pause();
      musicControl.innerHTML = '<i class="fa-solid fa-compact-disc"></i>';
    } else {
      bgMusic.play();
      musicControl.innerHTML = '<i class="fa-solid fa-compact-disc fa-spin"></i>';
    }
    isPlaying = !isPlaying;
  });

  // 3. Countdown Timer
  const targetDate = new Date("December 26, 2026 08:00:00").getTime();

  const updateCountdown = () => {
    const now = new Date().getTime();
    const difference = targetDate - now;

    if (difference > 0) {
      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      document.getElementById("days").innerText = days;
      document.getElementById("hours").innerText = hours;
      document.getElementById("minutes").innerText = minutes;
      document.getElementById("seconds").innerText = seconds;
    }
  };

  setInterval(updateCountdown, 1000);
  updateCountdown();

  // 4. Form Ucapan (RSVP Client-side)
  const rsvpForm = document.getElementById("rsvp-form");
  const wishesList = document.getElementById("wishes-list");
  const wishesStorageKey = "afid-alya-wishes";

  const saveWishes = () => {
    const wishes = [...wishesList.querySelectorAll(".wish-item")].map((wish) => ({
      name: wish.dataset.name,
      message: wish.dataset.message
    }));

    localStorage.setItem(wishesStorageKey, JSON.stringify(wishes));
  };

  const createWishCard = (name, message) => {
    const wishCard = document.createElement("div");
    wishCard.classList.add("wish-item", "card-3d", "reveal-on-scroll", "is-visible");
    wishCard.dataset.name = name;
    wishCard.dataset.message = message;
    wishCard.innerHTML = `<div class="wish-content"><strong>${escapeHtml(name)}</strong><p>${escapeHtml(message)}</p></div><button class="delete-wish" type="button" aria-label="Hapus ucapan"><i class="fa-regular fa-trash-can"></i></button>`;
    return wishCard;
  };

  try {
    const savedWishes = JSON.parse(localStorage.getItem(wishesStorageKey) || "[]");
    savedWishes.forEach(({ name, message }) => {
      if (name && message) wishesList.append(createWishCard(name, message));
    });
  } catch (error) {
    localStorage.removeItem(wishesStorageKey);
  }

  if (rsvpForm) {
    rsvpForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const name = document.getElementById("guest-name").value;
      const message = document.getElementById("guest-message").value;

      if (name && message) {
        wishesList.prepend(createWishCard(name, message));
        saveWishes();
        rsvpForm.reset();
      }
    });
  }

  wishesList.addEventListener("click", (event) => {
    const deleteButton = event.target.closest(".delete-wish");
    if (deleteButton) {
      deleteButton.closest(".wish-item").remove();
      saveWishes();
    }
  });

  document.getElementById("clear-wishes")?.addEventListener("click", () => {
    wishesList.replaceChildren();
    localStorage.removeItem(wishesStorageKey);
  });

  const galleryToggle = document.getElementById("gallery-toggle");
  const galleryMore = document.getElementById("gallery-more");

  galleryToggle?.addEventListener("click", () => {
    const isExpanded = galleryMore.classList.toggle("is-expanded");
    galleryToggle.setAttribute("aria-expanded", String(isExpanded));
    galleryToggle.querySelector("span").textContent = isExpanded ? "Tampilkan lebih sedikit" : "Lihat lebih banyak";
    galleryToggle.querySelector("i").classList.toggle("is-up", isExpanded);

    if (isExpanded) {
      galleryMore.querySelectorAll(".reveal-on-scroll").forEach((item) => item.classList.add("is-visible"));
    }
  });

  // Salin nomor rekening hadiah digital
  const copyAccountButtons = document.querySelectorAll(".copy-account");

  copyAccountButtons.forEach((copyAccountButton) => {
    const copyStatus = copyAccountButton.parentElement.querySelector(".copy-status");

    copyAccountButton.addEventListener("click", async () => {
      const accountNumber = copyAccountButton.dataset.copyAccount;

      try {
        await navigator.clipboard.writeText(accountNumber);
      } catch (error) {
        const temporaryInput = document.createElement("input");
        temporaryInput.value = accountNumber;
        document.body.appendChild(temporaryInput);
        temporaryInput.select();
        document.execCommand("copy");
        temporaryInput.remove();
      }

      copyStatus.textContent = "Nomor rekening berhasil disalin";
      window.setTimeout(() => {
        copyStatus.textContent = "";
      }, 2400);
    });
  });

  // Animasi ringan ketika section masuk ke viewport
  const revealElements = document.querySelectorAll(".reveal-on-scroll");

  if ("IntersectionObserver" in window) {
    const revealObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.14 });

    revealElements.forEach((element) => revealObserver.observe(element));
  } else {
    revealElements.forEach((element) => element.classList.add("is-visible"));
  }

  function escapeHtml(text) {
    return text.replace(/[&<>"']/g, (m) => {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[m];
    });
  }

  // 5. INTERACTIVE 3D TILT EFFECT UNTUK KARTU (MOUSE/TOUCH)
  const tiltElements = document.querySelectorAll(".tilt-element");

  tiltElements.forEach(card => {
    card.addEventListener("mousemove", (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const centerX = rect.width / 2;
      const centerY = rect.height / 2;

      const rotateX = ((y - centerY) / centerY) * -12;
      const rotateY = ((x - centerX) / centerX) * 12;

      card.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-5px)`;
    });

    card.addEventListener("mouseleave", () => {
      card.style.transform = "rotateX(0deg) rotateY(0deg) translateY(0px)";
    });
  });

  // 6. CANVAS PARTIKEL ELEGAN 3D DILATAR BELAKANG
  const canvas = document.getElementById("canvas3d");
  if (canvas) {
    const ctx = canvas.getContext("2d");
    let width = canvas.width = window.innerWidth;
    let height = canvas.height = window.innerHeight;

    window.addEventListener("resize", () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    });

    const particles = Array.from({ length: 45 }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      z: Math.random() * 3 + 1,
      radius: Math.random() * 2.5 + 1,
      speedY: Math.random() * 0.5 + 0.2,
      opacity: Math.random() * 0.5 + 0.2
    }));

    function animateParticles() {
      ctx.clearRect(0, 0, width, height);

      particles.forEach(p => {
        p.y -= p.speedY;
        if (p.y < -10) {
          p.y = height + 10;
          p.x = Math.random() * width;
        }

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius * p.z * 0.5, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(197, 160, 89, ${p.opacity})`;
        ctx.fill();
      });

      requestAnimationFrame(animateParticles);
    }

    animateParticles();
  }
});