document.addEventListener("DOMContentLoaded", () => {
  // =============================================================
  // KONFIGURASI SUPABASE
  // =============================================================
  const SUPABASE_URL = "https://mkoewddusqyvhgdmkpdz.supabase.co"; // Ganti dengan URL Supabase kamu
  const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1rb2V3ZGR1c3F5dmhnZG1rcGR6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg4Njg1NjUsImV4cCI6MjEwNDQ0NDU2NX0.yaYgBkGHpYAlkpB2ffJKA8B_CF4cnwzzhbivzr9ogAU"; // Ganti dengan Anon Key Supabase kamu

  const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  // =============================================================
  // 1. BUKA UNDANGAN & PUTAR MUSIK
  // =============================================================
  const btnOpen = document.getElementById("btn-open");
  const cover = document.getElementById("cover");
  const mainContent = document.getElementById("main-content");
  const bgMusic = document.getElementById("bg-music");
  const musicControl = document.getElementById("music-control");
  let isPlaying = false;

  btnOpen?.addEventListener("click", () => {
    cover.classList.add("slide-up");
    mainContent.classList.remove("content-hidden");
    musicControl.classList.remove("hide");

    bgMusic.play().then(() => {
      isPlaying = true;
    }).catch(err => console.log("Autoplay blocked:", err));
  });

  // 2. Play/Pause Musik
  musicControl?.addEventListener("click", () => {
    if (isPlaying) {
      bgMusic.pause();
      musicControl.innerHTML = '<i class="fa-solid fa-compact-disc"></i>';
    } else {
      bgMusic.play();
      musicControl.innerHTML = '<i class="fa-solid fa-compact-disc fa-spin"></i>';
    }
    isPlaying = !isPlaying;
  });

  // =============================================================
  // 2. COUNTDOWN TIMER
  // =============================================================
  const targetDate = new Date("December 26, 2026 08:00:00").getTime();

  const updateCountdown = () => {
    const now = new Date().getTime();
    const difference = targetDate - now;

    if (difference > 0) {
      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      const elDays = document.getElementById("days");
      const elHours = document.getElementById("hours");
      const elMinutes = document.getElementById("minutes");
      const elSeconds = document.getElementById("seconds");

      if (elDays) elDays.innerText = days;
      if (elHours) elHours.innerText = hours;
      if (elMinutes) elMinutes.innerText = minutes;
      if (elSeconds) elSeconds.innerText = seconds;
    }
  };

  setInterval(updateCountdown, 1000);
  updateCountdown();

  // =============================================================
  // 3. FORM UCAPAN & DATABASE SUPABASE (REALTIME)
  // =============================================================
  const rsvpForm = document.getElementById("rsvp-form");
  const wishesList = document.getElementById("wishes-list");

  const createWishCard = (id, name, message) => {
    const wishCard = document.createElement("div");
    wishCard.classList.add("wish-item", "card-3d", "reveal-on-scroll", "is-visible");
    if (id) wishCard.dataset.id = id;
    wishCard.dataset.name = name;
    wishCard.dataset.message = message;
    wishCard.innerHTML = `
      <div class="wish-content">
        <strong>${escapeHtml(name)}</strong>
        <p>${escapeHtml(message)}</p>
      </div>
      <!--
  <button class="delete-wish" type="button" aria-label="Hapus ucapan">
    <i class="fa-regular fa-trash-can"></i>
  </button>
  -->`;
    return wishCard;
  };

  // Ambil data ucapan dari Supabase
  const fetchWishes = async () => {
    if (!wishesList) return;
    
    const { data: wishes, error } = await supabase
      .from("wishes")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Gagal mengambil data dari Supabase:", error);
      return;
    }

    wishesList.replaceChildren();
    wishes.forEach(({ id, name, message }) => {
      wishesList.append(createWishCard(id, name, message));
    });
  };

  // Submit Ucapan Baru
  if (rsvpForm) {
    rsvpForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const submitBtn = rsvpForm.querySelector("button[type='submit']");
      const nameInput = document.getElementById("guest-name");
      const messageInput = document.getElementById("guest-message");

      const name = nameInput.value.trim();
      const message = messageInput.value.trim();

      if (name && message) {
        if (submitBtn) {
          submitBtn.disabled = true;
          submitBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin me-2"></i> Mengirim...`;
        }

        const { error } = await supabase
          .from("wishes")
          .insert([{ name, message }]);

        if (error) {
          alert("Gagal mengirim ucapan, silakan coba lagi.");
          console.error("Insert error:", error);
        } else {
          rsvpForm.reset();
          await fetchWishes();
        }

        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerHTML = `<i class="fa-solid fa-paper-plane me-2"></i> Kirim Ucapan`;
        }
      }
    });
  }

  // Hapus single ucapan dari Supabase
  wishesList?.addEventListener("click", async (event) => {
    const deleteButton = event.target.closest(".delete-wish");
    if (deleteButton) {
      const wishItem = deleteButton.closest(".wish-item");
      const wishId = wishItem.dataset.id;

      if (wishId) {
        const { error } = await supabase.from("wishes").delete().eq("id", wishId);
        if (error) console.error("Gagal menghapus ucapan:", error);
      }
      wishItem.remove();
    }
  });

  // Hapus semua ucapan dari Supabase
  document.getElementById("clear-wishes")?.addEventListener("click", async () => {
    if (confirm("Apakah Anda yakin ingin menghapus semua ucapan dari database?")) {
      const { error } = await supabase.from("wishes").delete().neq("id", 0);
      if (!error) {
        wishesList.replaceChildren();
      } else {
        console.error("Gagal menghapus semua ucapan:", error);
      }
    }
  });

  // Load awal & listener Realtime Supabase
  fetchWishes();

  supabase
    .channel("public:wishes")
    .on("postgres_changes", { event: "*", schema: "public", table: "wishes" }, () => {
      fetchWishes();
    })
    .subscribe();

  // =============================================================
  // 4. TOGGLE GALERI (LIHAT LEBIH BANYAK)
  // =============================================================
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

  // =============================================================
  // 5. SALIN NOMOR REKENING HADIAH DIGITAL
  // =============================================================
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

      if (copyStatus) {
        copyStatus.textContent = "Nomor rekening berhasil disalin";
        window.setTimeout(() => {
          copyStatus.textContent = "";
        }, 2400);
      }
    });
  });

  // =============================================================
  // 6. ANIMASI SCROLL REVEAL (INTERSECTION OBSERVER)
  // =============================================================
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

  // =============================================================
  // 7. INTERACTIVE 3D TILT EFFECT UNTUK KARTU (MOUSE/TOUCH)
  // =============================================================
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

  // =============================================================
  // 8. CANVAS PARTIKEL ELEGAN 3D DILATAR BELAKANG
  // =============================================================
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