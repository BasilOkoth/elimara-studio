(() => {
  const CFG = window.ELIMARA_CONFIG || {};
  const $ = s => document.querySelector(s);
  const $$ = s => [...document.querySelectorAll(s)];

  const menuBtn = $("#menuBtn");
  const mobileMenu = $("#mobileMenu");

  if (menuBtn && mobileMenu) {
    menuBtn.addEventListener("click", () => {
      const open = mobileMenu.classList.toggle("open");
      menuBtn.textContent = open ? "Close" : "Menu";
      document.body.classList.toggle("no-scroll", open);
    });
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add("in");
        observer.unobserve(e.target);
      }
    });
  }, { threshold: .12 });

  $$(".fade-up").forEach(el => observer.observe(el));

  $$(".faq-q").forEach(btn =>
    btn.addEventListener("click", () => {
      btn.closest(".faq-item")?.classList.toggle("open");
    })
  );

  window.openElimaraModal = id => {
    const el = document.getElementById(id);

    if (el) {
      el.classList.add("open");
      document.body.classList.add("no-scroll");
    }
  };

  window.closeElimaraModal = id => {
    const el = document.getElementById(id);

    if (el) {
      el.classList.remove("open");
      document.body.classList.remove("no-scroll");
    }
  };

  $$("[data-close]").forEach(btn =>
    btn.addEventListener("click", () =>
      closeElimaraModal(btn.dataset.close)
    )
  );

  $$(".modal").forEach(m =>
    m.addEventListener("click", e => {
      if (e.target === m) {
        closeElimaraModal(m.id);
      }
    })
  );

  function contactMessage(context) {
    const lower = String(context || "").toLowerCase();

    if (lower.includes("commission")) {
      return "Hello Elimara Studio. I’m interested in commissioning a custom computational artwork for my space. I’d like to understand the process, pricing, timelines and how I can share a photo of the wall for a preview.";
    }

    if (lower.includes("private viewing")) {
      return "Hello Elimara Studio. I’d like to arrange a private viewing and learn more about the currently available works, edition details and acquisition process.";
    }

    if (lower.includes("trade") || lower.includes("interior")) {
      return "Hello Elimara Studio. I’m enquiring about a trade or interior-design collaboration. Please share information on commissions, project pricing, available formats and how we can discuss a specific space.";
    }

    return `Hello Elimara Studio. I’m interested in ${context}. Please share the relevant details, availability and next steps.`;
  }

  window.elimaraContact = (context = "an artwork") => {
    const msg = contactMessage(context);

    if (CFG.whatsappNumber) {
      window.open(
        `https://wa.me/${CFG.whatsappNumber}?text=${encodeURIComponent(msg)}`,
        "_blank"
      );
      return;
    }

    if (CFG.email) {
      window.location.href =
        `mailto:${CFG.email}?subject=${encodeURIComponent("Elimara Studio enquiry")}&body=${encodeURIComponent(msg)}`;

      return;
    }

    const body = document.getElementById("contactSetupText");

    if (body) {
      body.textContent = msg;
    }

    openElimaraModal("contactSetupModal");
  };

  window.reserveArtwork = (title, price) => {
    const titleEl = document.getElementById("reserveTitle");
    const priceEl = document.getElementById("reservePrice");
    const hidden = document.getElementById("reserveArtwork");

    if (titleEl) {
      titleEl.textContent = title;
    }

    if (priceEl) {
      priceEl.textContent = `KES ${Number(price).toLocaleString()}`;
    }

    if (hidden) {
      hidden.value = title;
    }

    openElimaraModal("reserveModal");
  };

  const reserveForm = $("#reserveForm");

  if (reserveForm) {
    reserveForm.addEventListener("submit", e => {
      e.preventDefault();

      const fd = new FormData(reserveForm);

      const title = fd.get("artwork");
      const name = fd.get("name");
      const phone = fd.get("phone");
      const location = fd.get("location");

      const msg =
`Hello Elimara Studio. I’m interested in acquiring ${title}. Please share the current availability, edition details, framing options and delivery information.

My details:
Name: ${name}
Phone: ${phone}
Delivery location: ${location}`;

      if (CFG.whatsappNumber) {
        window.open(
          `https://wa.me/${CFG.whatsappNumber}?text=${encodeURIComponent(msg)}`,
          "_blank"
        );
      } else if (CFG.email) {
        window.location.href =
          `mailto:${CFG.email}?subject=${encodeURIComponent("Artwork reservation — " + title)}&body=${encodeURIComponent(msg)}`;
      } else {
        closeElimaraModal("reserveModal");

        const text = $("#contactSetupText");

        if (text) {
          text.textContent = msg;
        }

        openElimaraModal("contactSetupModal");
      }
    });
  }

  const collectorForm = $("#collectorForm");

  if (collectorForm) {
    collectorForm.addEventListener("submit", async e => {
      e.preventDefault();

      const status = $("#collectorStatus");
      const endpoint = CFG.collectorFormEndpoint || "";

      if (!endpoint) {
        if (status) {
          status.textContent =
            "Collector-list submissions are not connected yet.";

          status.className = "micro warning";
        }

        return;
      }

      try {
        const r = await fetch(endpoint, {
          method: "POST",
          body: new FormData(collectorForm),
          headers: {
            Accept: "application/json"
          }
        });

        if (!r.ok) {
          throw new Error("Submission failed");
        }

        collectorForm.reset();

        if (status) {
          status.textContent =
            "Thank you. You are on the Elimara Studio collector list.";

          status.className = "micro success";
        }
      } catch (err) {
        if (status) {
          status.textContent =
            "We could not submit this just now. Please try again.";

          status.className = "micro warning";
        }
      }
    });
  }

  const commissionForm = $("#commissionForm");

  if (commissionForm) {
    commissionForm.addEventListener("submit", e => {
      e.preventDefault();

      const fd = new FormData(commissionForm);

      const msg =
`Hello Elimara Studio. I’m interested in commissioning a custom computational artwork for my space. I’d like to understand the process, pricing, timelines and how I can share a photo of the wall for a preview.

Project details:
Name: ${fd.get("name")}
Organisation: ${fd.get("organisation") || "—"}
Project type: ${fd.get("projectType")}
Space: ${fd.get("space")}
Approx. size: ${fd.get("size")}
Budget: ${fd.get("budget")}
Location: ${fd.get("location")}
Notes: ${fd.get("notes") || "—"}`;

      if (CFG.whatsappNumber) {
        window.open(
          `https://wa.me/${CFG.whatsappNumber}?text=${encodeURIComponent(msg)}`,
          "_blank"
        );
      } else if (CFG.email) {
        window.location.href =
          `mailto:${CFG.email}?subject=${encodeURIComponent("Elimara Studio commission enquiry")}&body=${encodeURIComponent(msg)}`;
      } else {
        const text = $("#contactSetupText");

        if (text) {
          text.textContent = msg;
        }

        openElimaraModal("contactSetupModal");
      }
    });
  }

  const wallInput = $("#wallInput");
  const wallImage = $("#wallImage");
  const artOverlay = $("#artOverlay");
  const placeholder = $("#wallPlaceholder");
  const artSelect = $("#artSelect");
  const artSize = $("#artSize");

  if (wallInput && wallImage && artOverlay) {
    wallInput.addEventListener("change", e => {
      const file = e.target.files?.[0];

      if (!file) {
        return;
      }

      const url = URL.createObjectURL(file);

      wallImage.src = url;
      wallImage.style.display = "block";
      artOverlay.style.display = "block";

      if (placeholder) {
        placeholder.style.display = "none";
      }
    });

    if (artSelect) {
      artSelect.addEventListener("change", () => {
        artOverlay.src = artSelect.value;
      });
    }

    if (artSize) {
      artSize.addEventListener("input", () => {
        artOverlay.style.width = `${artSize.value}%`;
      });
    }

    let dragging = false;
    let ox = 0;
    let oy = 0;

    const stage = $("#wallStage");

    const start = (x, y) => {
      if (!stage) {
        return;
      }

      dragging = true;

      const r = artOverlay.getBoundingClientRect();

      ox = x - r.left;
      oy = y - r.top;
    };

    const move = (x, y) => {
      if (!dragging || !stage) {
        return;
      }

      const sr = stage.getBoundingClientRect();
      const ar = artOverlay.getBoundingClientRect();

      let left = x - sr.left - ox;
      let top = y - sr.top - oy;

      left = Math.max(
        0,
        Math.min(left, sr.width - ar.width)
      );

      top = Math.max(
        0,
        Math.min(top, sr.height - ar.height)
      );

      artOverlay.style.left = `${left}px`;
      artOverlay.style.top = `${top}px`;
      artOverlay.style.transform = "none";
    };

    artOverlay.addEventListener("mousedown", e =>
      start(e.clientX, e.clientY)
    );

    window.addEventListener("mousemove", e =>
      move(e.clientX, e.clientY)
    );

    window.addEventListener("mouseup", () => {
      dragging = false;
    });

    artOverlay.addEventListener(
      "touchstart",
      e => {
        const t = e.touches[0];

        start(t.clientX, t.clientY);
      },
      { passive: true }
    );

    window.addEventListener(
      "touchmove",
      e => {
        if (dragging) {
          const t = e.touches[0];

          move(t.clientX, t.clientY);
        }
      },
      { passive: true }
    );

    window.addEventListener("touchend", () => {
      dragging = false;
    });
  }

  $$(".year").forEach(
    el => el.textContent = new Date().getFullYear()
  );
})();
