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
})();
