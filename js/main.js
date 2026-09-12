// Maykon Tours — main.js
// Vanilla JS: hero slideshow, scroll journey tracker, reveal animations,
// reviews carousel, sticky header, floating WhatsApp CTA, lead form -> WhatsApp redirect.

(function () {
  "use strict";

  /* ----------------------------------------------------------------------
   * 0. DEFERRED HERO IMAGE LOADING (keep first paint fast)
   * ------------------------------------------------------------------- */
  function loadDeferredHeroImages() {
    document.querySelectorAll(".hero-bg-slide img[data-src]").forEach((img) => {
      img.src = img.getAttribute("data-src");
      img.removeAttribute("data-src");
    });
  }
  if (document.readyState === "complete") {
    window.setTimeout(loadDeferredHeroImages, 600);
  } else {
    window.addEventListener("load", () => window.setTimeout(loadDeferredHeroImages, 600));
  }

  /* ----------------------------------------------------------------------
   * 1. HERO BACKGROUND CROSSFADE SLIDESHOW
   * ------------------------------------------------------------------- */
  const heroSlides = Array.from(document.querySelectorAll(".hero-bg-slide"));
  const heroCaption = document.getElementById("hero-caption");
  let heroIndex = 0;
  const HERO_INTERVAL = 4500;

  function showHeroSlide(i) {
    heroSlides.forEach((slide, idx) => {
      slide.classList.toggle("opacity-100", idx === i);
      slide.classList.toggle("opacity-0", idx !== i);
    });
    if (heroCaption && heroSlides[i]) {
      const caption = heroSlides[i].getAttribute("data-caption") || "";
      heroCaption.style.opacity = 0;
      window.setTimeout(() => {
        heroCaption.textContent = caption;
        heroCaption.style.opacity = 1;
      }, 350);
    }
  }

  if (heroSlides.length) {
    showHeroSlide(0);
    window.setInterval(() => {
      heroIndex = (heroIndex + 1) % heroSlides.length;
      showHeroSlide(heroIndex);
    }, HERO_INTERVAL);
  }

  /* ----------------------------------------------------------------------
   * 2. SCROLL JOURNEY TRACKER (compass/plane travels down a path)
   * ------------------------------------------------------------------- */
  const track = document.getElementById("scroll-track");
  const trackFill = document.getElementById("scroll-track-fill");
  const trackIcon = document.getElementById("scroll-track-icon");

  function updateScrollTracker() {
    if (!track) return;
    const doc = document.documentElement;
    const scrollTop = window.scrollY || doc.scrollTop;
    const scrollHeight = doc.scrollHeight - doc.clientHeight;
    const pct = scrollHeight > 0 ? Math.min(1, Math.max(0, scrollTop / scrollHeight)) : 0;

    if (trackFill) {
      trackFill.style.transform = `scaleY(${pct})`;
    }
    if (trackIcon) {
      const trackHeight = track.clientHeight;
      const iconHeight = trackIcon.clientHeight || 28;
      const travel = Math.max(0, trackHeight - iconHeight);
      trackIcon.style.transform = `translateY(${pct * travel}px) rotate(${45 + pct * 270}deg)`;
    }
  }

  let scrollTicking = false;
  function onScroll() {
    if (!scrollTicking) {
      window.requestAnimationFrame(() => {
        updateScrollTracker();
        updateStickyHeader();
        updateFloatingCta();
        scrollTicking = false;
      });
      scrollTicking = true;
    }
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", updateScrollTracker);
  updateScrollTracker();

  /* ----------------------------------------------------------------------
   * 3. REVEAL-ON-SCROLL ANIMATIONS
   * ------------------------------------------------------------------- */
  const revealEls = document.querySelectorAll(".reveal, .reveal-scale, .reveal-stagger");
  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -8% 0px" }
    );
    revealEls.forEach((el) => io.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add("is-visible"));
  }

  /* ----------------------------------------------------------------------
   * 4. REVIEWS CAROUSEL — auto-sliding, swipeable, dot indicators
   * ------------------------------------------------------------------- */
  const carousel = document.getElementById("reviews-carousel");
  const dotsWrap = document.getElementById("reviews-dots");
  let carouselTimer = null;
  let userInteracting = false;
  let resumeTimeout = null;

  if (carousel) {
    const cards = Array.from(carousel.children);

    if (dotsWrap) {
      cards.forEach((_, i) => {
        const dot = document.createElement("button");
        dot.className =
          "h-1.5 w-1.5 rounded-full bg-navy-800/20 transition-all duration-300 data-[active=true]:w-5 data-[active=true]:bg-coral-500";
        dot.setAttribute("aria-label", `ביקורת ${i + 1}`);
        dot.dataset.active = i === 0 ? "true" : "false";
        dot.addEventListener("click", () => {
          scrollCarouselToCard(i);
        });
        dotsWrap.appendChild(dot);
      });
    }

    // Use viewport-relative rects (not scrollLeft/offsetLeft) so this works
    // correctly regardless of the browser's RTL scrollLeft sign convention.
    function getCenteredIndex() {
      const carouselRect = carousel.getBoundingClientRect();
      const carouselCenterX = carouselRect.left + carouselRect.width / 2;
      let closest = 0;
      let closestDist = Infinity;
      cards.forEach((card, i) => {
        const r = card.getBoundingClientRect();
        const dist = Math.abs(r.left + r.width / 2 - carouselCenterX);
        if (dist < closestDist) {
          closestDist = dist;
          closest = i;
        }
      });
      return closest;
    }

    // Scroll the carousel horizontally to center a given card — WITHOUT ever
    // touching the page's vertical scroll position. `scrollIntoView` was used
    // here previously, but it walks the *entire* scroll chain (including the
    // document itself): when the carousel auto-advances while the user has
    // scrolled away to another section (e.g. down at the lead form), the
    // target card is fully outside the vertical viewport, so the browser
    // "helpfully" scrolls the whole page back up to reveal it — even with
    // block:"nearest". `Element.scrollBy()` only ever affects the element
    // it's called on, so it cannot leak into a page-level jump.
    function scrollCarouselToCard(index) {
      const card = cards[index];
      if (!card) return;
      const carouselRect = carousel.getBoundingClientRect();
      const cardRect = card.getBoundingClientRect();
      const carouselCenterX = carouselRect.left + carouselRect.width / 2;
      const cardCenterX = cardRect.left + cardRect.width / 2;
      // Positive when the card sits to the right of center (needs to move left to center).
      const visualDelta = cardCenterX - carouselCenterX;
      // Empirically verified (headless Chromium, representative of the
      // Chromium/WebKit engines that run the overwhelming majority of mobile
      // browsers): in this RTL layout, scrollLeft starts near 0 and grows
      // more NEGATIVE as content scrolls toward later cards, and doing so
      // visually shifts those later cards RIGHTWARD into view (revealing
      // content that was previously off-screen to the left). So a scrollBy
      // delta with the SAME sign as visualDelta produces the correct visual
      // movement here — unlike the standard LTR relationship, where the
      // signs are opposite.
      carousel.scrollBy({ left: visualDelta, behavior: "smooth" });
    }

    function syncDots() {
      if (!dotsWrap) return;
      const closest = getCenteredIndex();
      Array.from(dotsWrap.children).forEach((dot, i) => {
        dot.dataset.active = i === closest ? "true" : "false";
      });
    }

    let carouselTicking = false;
    carousel.addEventListener(
      "scroll",
      () => {
        if (!carouselTicking) {
          window.requestAnimationFrame(() => {
            syncDots();
            carouselTicking = false;
          });
          carouselTicking = true;
        }
      },
      { passive: true }
    );

    function autoAdvance() {
      if (userInteracting) return;
      const current = getCenteredIndex();
      const next = (current + 1) % cards.length;
      scrollCarouselToCard(next);
    }

    function startAutoplay() {
      stopAutoplay();
      carouselTimer = window.setInterval(autoAdvance, 3200);
    }
    function stopAutoplay() {
      if (carouselTimer) window.clearInterval(carouselTimer);
    }

    ["touchstart", "pointerdown", "wheel"].forEach((evt) => {
      carousel.addEventListener(
        evt,
        () => {
          userInteracting = true;
          if (resumeTimeout) window.clearTimeout(resumeTimeout);
          resumeTimeout = window.setTimeout(() => {
            userInteracting = false;
          }, 4500);
        },
        { passive: true }
      );
    });

    window.requestAnimationFrame(syncDots);
    startAutoplay();
  }

  /* ----------------------------------------------------------------------
   * 5. STICKY MINI HEADER (appears after leaving hero)
   * ------------------------------------------------------------------- */
  const stickyHeader = document.getElementById("sticky-header");
  const heroSection = document.getElementById("hero");

  function updateStickyHeader() {
    if (!stickyHeader || !heroSection) return;
    const heroBottom = heroSection.getBoundingClientRect().bottom;
    const shouldShow = heroBottom < 80;
    stickyHeader.classList.toggle("translate-y-0", shouldShow);
    stickyHeader.classList.toggle("opacity-100", shouldShow);
    stickyHeader.classList.toggle("-translate-y-full", !shouldShow);
    stickyHeader.classList.toggle("opacity-0", !shouldShow);
    stickyHeader.classList.toggle("pointer-events-none", !shouldShow);
  }

  /* ----------------------------------------------------------------------
   * 6. FLOATING WHATSAPP QUICK-CONTACT BUTTON
   * ------------------------------------------------------------------- */
  const floatingCta = document.getElementById("floating-whatsapp");

  function updateFloatingCta() {
    if (!floatingCta || !heroSection) return;
    const heroBottom = heroSection.getBoundingClientRect().bottom;
    const shouldShow = heroBottom < 0;
    floatingCta.classList.toggle("opacity-100", shouldShow);
    floatingCta.classList.toggle("translate-y-0", shouldShow);
    floatingCta.classList.toggle("opacity-0", !shouldShow);
    floatingCta.classList.toggle("translate-y-6", !shouldShow);
    floatingCta.classList.toggle("pointer-events-none", !shouldShow);
  }
  updateStickyHeader();
  updateFloatingCta();

  /* ----------------------------------------------------------------------
   * 7. LEAD FORM -> FORMATTED WHATSAPP MESSAGE REDIRECT
   * ------------------------------------------------------------------- */
  const leadForm = document.getElementById("agent-form");
  const AGENT_WHATSAPP_LINK = "https://wa.me/972528786250";

  if (leadForm) {
    leadForm.addEventListener("submit", function (e) {
      e.preventDefault();

      const data = new FormData(leadForm);
      const travelers = (data.get("travelers") || "").toString().trim();
      const destination = (data.get("destination") || "").toString().trim();
      const dates = (data.get("dates") || "").toString().trim();
      const purpose = (data.get("purpose") || "").toString().trim();
      const budget = (data.get("budget") || "").toString().trim();

      const lines = [
        "היי! מעוניין/ת בהצעת מחיר לחופשה ✈️",
        "",
        `👥 כמה אנשים ואיזה גילאים: ${travelers || "-"}`,
        `📍 יעד מבוקש: ${destination || "-"}`,
        `📅 תאריכים: ${dates || "-"}`,
        `🎯 מטרת הנסיעה והעדפות: ${purpose || "-"}`,
        `💰 תקציב משוער לאדם: ${budget || "-"}`,
        "",
        "נשלח מדף הנחיתה של Maykon Tours",
      ];

      const message = lines.join("\n");
      const url = `${AGENT_WHATSAPP_LINK}?text=${encodeURIComponent(message)}`;

      const submitBtn = leadForm.querySelector('button[type="submit"]');
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.classList.add("opacity-70");
      }

      window.location.href = url;
    });
  }

  /* ----------------------------------------------------------------------
   * 8. ANCHOR SCROLL OFFSET (account for sticky header height)
   * ------------------------------------------------------------------- */
  document.querySelectorAll('a[href^="#"]').forEach((link) => {
    link.addEventListener("click", (e) => {
      const id = link.getAttribute("href");
      if (!id || id === "#") return;
      const target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      const top = target.getBoundingClientRect().top + window.scrollY - 64;
      window.scrollTo({ top, behavior: "smooth" });
    });
  });

  /* ----------------------------------------------------------------------
   * 9. TRAVELERS COMPOSITION POPOVER (airline-style +/- with child ages)
   * ------------------------------------------------------------------- */
  (function () {
    const toggle = document.getElementById("travelers-toggle");
    const popover = document.getElementById("travelers-popover");
    const hiddenInput = document.getElementById("travelers");
    const summaryEl = document.getElementById("travelers-summary");
    const adultsCountEl = document.getElementById("adults-count");
    const childrenCountEl = document.getElementById("children-count");
    const childrenAgesWrap = document.getElementById("children-ages");
    const doneBtn = document.getElementById("travelers-done");
    if (!toggle || !popover || !hiddenInput) return;

    const MAX_ADULTS = 9;
    const MAX_CHILDREN = 6;
    let adults = 1;
    let children = 0;
    let childAges = [];

    function pluralAdults(n) {
      return n === 1 ? "מבוגר" : "מבוגרים";
    }
    function pluralChildren(n) {
      return n === 1 ? "ילד" : "ילדים";
    }

    function renderChildAgeSelects() {
      childrenAgesWrap.innerHTML = "";
      if (children === 0) {
        childrenAgesWrap.classList.add("js-hidden");
        return;
      }
      childrenAgesWrap.classList.remove("js-hidden");
      for (let i = 0; i < children; i++) {
        const row = document.createElement("div");
        row.className = "flex items-center justify-between gap-2 rounded-xl bg-cream-50 px-3 py-2";

        const label = document.createElement("span");
        label.className = "text-xs font-semibold text-navy-900/70";
        label.textContent = `גיל ילד ${i + 1}`;

        const select = document.createElement("select");
        select.className =
          "rounded-lg border border-navy-900/10 bg-white px-2 py-1.5 text-sm text-navy-900 outline-none focus:border-turquoise-500";
        select.setAttribute("aria-label", `גיל ילד ${i + 1}`);
        for (let age = 0; age <= 17; age++) {
          const opt = document.createElement("option");
          opt.value = String(age);
          opt.textContent = age === 0 ? "מתחת לשנה" : String(age);
          select.appendChild(opt);
        }
        select.value = String(childAges[i] != null ? childAges[i] : 5);
        select.addEventListener("change", () => {
          childAges[i] = parseInt(select.value, 10);
          updateSummary();
        });

        row.appendChild(label);
        row.appendChild(select);
        childrenAgesWrap.appendChild(row);
      }
    }

    function updateSummary() {
      if (childAges.length < children) {
        while (childAges.length < children) childAges.push(5);
      } else if (childAges.length > children) {
        childAges.length = children;
      }

      let summary = `${adults} ${pluralAdults(adults)}`;
      if (children > 0) {
        const ages = childAges.slice(0, children).join(", ");
        summary += `, ${children} ${pluralChildren(children)} (גילאים: ${ages})`;
      }
      summaryEl.textContent = summary;
      summaryEl.classList.remove("text-navy-900/40");
      summaryEl.classList.add("text-navy-900");
      hiddenInput.value = summary;
    }

    function openPopover() {
      popover.classList.remove("js-hidden");
      toggle.setAttribute("aria-expanded", "true");
    }
    function closePopover() {
      popover.classList.add("js-hidden");
      toggle.setAttribute("aria-expanded", "false");
    }

    toggle.addEventListener("click", (e) => {
      e.stopPropagation();
      if (popover.classList.contains("js-hidden")) openPopover();
      else closePopover();
    });

    if (doneBtn) doneBtn.addEventListener("click", closePopover);

    document.addEventListener("click", (e) => {
      if (
        !popover.classList.contains("js-hidden") &&
        !popover.contains(e.target) &&
        e.target !== toggle &&
        !toggle.contains(e.target)
      ) {
        closePopover();
      }
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && !popover.classList.contains("js-hidden")) closePopover();
    });

    popover.querySelectorAll("[data-traveler-action]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const action = btn.getAttribute("data-traveler-action");
        if (action === "adults-inc") adults = Math.min(MAX_ADULTS, adults + 1);
        else if (action === "adults-dec") adults = Math.max(1, adults - 1);
        else if (action === "children-inc") {
          if (children < MAX_CHILDREN) {
            children += 1;
            renderChildAgeSelects();
          }
        } else if (action === "children-dec") {
          if (children > 0) {
            children -= 1;
            renderChildAgeSelects();
          }
        }
        adultsCountEl.textContent = String(adults);
        childrenCountEl.textContent = String(children);
        updateSummary();
      });
    });

    // Initialize so the hidden field is never empty at submit time.
    renderChildAgeSelects();
    updateSummary();
  })();

  /* ----------------------------------------------------------------------
   * 10. DATES: EXACT DATES vs FLEXIBLE RANGE TOGGLE
   * ------------------------------------------------------------------- */
  (function () {
    const modeButtons = Array.from(document.querySelectorAll(".dates-mode-btn"));
    const exactFields = document.getElementById("dates-exact-fields");
    const rangeField = document.getElementById("dates-range-field");
    const departInput = document.getElementById("date-depart");
    const returnInput = document.getElementById("date-return");
    const rangeInput = document.getElementById("date-range");
    const hiddenDates = document.getElementById("dates");
    if (!modeButtons.length || !hiddenDates) return;

    let mode = "exact";

    function formatDate(value) {
      if (!value) return "";
      const parts = value.split("-");
      if (parts.length !== 3) return value;
      const [y, m, d] = parts;
      return `${d}/${m}/${y}`;
    }

    function updateHiddenDates() {
      if (mode === "exact") {
        const depart = formatDate(departInput ? departInput.value : "");
        const ret = formatDate(returnInput ? returnInput.value : "");
        hiddenDates.value = depart || ret ? `${depart || "?"} - ${ret || "?"}` : "";
      } else {
        hiddenDates.value = rangeInput ? rangeInput.value.trim() : "";
      }
    }

    function setMode(newMode) {
      mode = newMode;
      modeButtons.forEach((btn) => {
        const active = btn.getAttribute("data-dates-mode") === mode;
        btn.classList.toggle("is-active", active);
        btn.setAttribute("aria-pressed", String(active));
      });
      if (mode === "exact") {
        if (exactFields) exactFields.classList.remove("js-hidden");
        if (rangeField) rangeField.classList.add("js-hidden");
        if (departInput) departInput.required = true;
        if (returnInput) returnInput.required = true;
        if (rangeInput) rangeInput.required = false;
      } else {
        if (exactFields) exactFields.classList.add("js-hidden");
        if (rangeField) rangeField.classList.remove("js-hidden");
        if (departInput) departInput.required = false;
        if (returnInput) returnInput.required = false;
        if (rangeInput) rangeInput.required = true;
      }
      updateHiddenDates();
    }

    modeButtons.forEach((btn) => {
      btn.addEventListener("click", () => setMode(btn.getAttribute("data-dates-mode")));
    });

    if (departInput) departInput.addEventListener("change", updateHiddenDates);
    if (returnInput) returnInput.addEventListener("change", updateHiddenDates);
    if (rangeInput) rangeInput.addEventListener("input", updateHiddenDates);

    setMode("exact");
  })();

  /* ----------------------------------------------------------------------
   * 11. SERVICE CARD MODALS (cruises / car rentals / sports+concerts)
   * ------------------------------------------------------------------- */
  (function () {
    const cardButtons = document.querySelectorAll("[data-modal-target]");
    if (!cardButtons.length) return;

    function openModal(modal) {
      modal.classList.remove("js-hidden");
      document.body.style.overflow = "hidden";
    }
    function closeModal(modal) {
      modal.classList.add("js-hidden");
      document.body.style.overflow = "";
    }

    cardButtons.forEach((btn) => {
      btn.addEventListener("click", () => {
        const modal = document.getElementById("modal-" + btn.getAttribute("data-modal-target"));
        if (modal) openModal(modal);
      });
    });

    document.querySelectorAll(".service-modal").forEach((modal) => {
      const closeBtn = modal.querySelector(".service-modal-close");
      const backdrop = modal.querySelector(".service-modal-backdrop");
      const cta = modal.querySelector(".service-modal-cta");
      if (closeBtn) closeBtn.addEventListener("click", () => closeModal(modal));
      if (backdrop) backdrop.addEventListener("click", () => closeModal(modal));
      if (cta) cta.addEventListener("click", () => closeModal(modal));
    });

    document.addEventListener("keydown", (e) => {
      if (e.key !== "Escape") return;
      document.querySelectorAll(".service-modal").forEach((modal) => {
        if (!modal.classList.contains("js-hidden")) closeModal(modal);
      });
    });
  })();
})();
