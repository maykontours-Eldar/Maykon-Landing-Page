/*
 * Maykon Tours — local accessibility toolbar + legal info modal.
 * Fully self-contained: no external service, no account, no signup.
 * State (font size step, high-contrast) persists via localStorage.
 */
(function () {
  "use strict";

  var STORAGE_KEY = "maykon-a11y";
  var root = document.documentElement;
  var state = { fontStep: 0, contrast: false };

  function loadState() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        var parsed = JSON.parse(raw);
        if (typeof parsed.fontStep === "number") state.fontStep = parsed.fontStep;
        if (typeof parsed.contrast === "boolean") state.contrast = parsed.contrast;
      }
    } catch (e) {
      /* localStorage unavailable — continue with defaults */
    }
  }

  function saveState() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      /* ignore */
    }
  }

  function clampStep(step) {
    return Math.max(-2, Math.min(4, step));
  }

  function applyState() {
    root.style.fontSize = state.fontStep === 0 ? "" : 100 + state.fontStep * 12 + "%";
    root.classList.toggle("a11y-contrast", state.contrast);
  }

  loadState();
  applyState();

  document.addEventListener("DOMContentLoaded", function () {
    var toggle = document.getElementById("a11y-toggle");
    var modal = document.getElementById("a11y-modal");
    if (!toggle || !modal) return;

    var closeBtn = document.getElementById("a11y-modal-close");
    var backdrop = document.getElementById("a11y-modal-backdrop");

    function openModal() {
      modal.hidden = false;
      toggle.setAttribute("aria-expanded", "true");
      document.body.style.overflow = "hidden";
    }

    function closeModal() {
      modal.hidden = true;
      toggle.setAttribute("aria-expanded", "false");
      document.body.style.overflow = "";
    }

    toggle.addEventListener("click", function () {
      if (modal.hidden) {
        openModal();
      } else {
        closeModal();
      }
    });

    if (closeBtn) closeBtn.addEventListener("click", closeModal);
    if (backdrop) backdrop.addEventListener("click", closeModal);

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && !modal.hidden) closeModal();
    });

    var actionButtons = modal.querySelectorAll("[data-a11y-action]");
    for (var i = 0; i < actionButtons.length; i++) {
      actionButtons[i].addEventListener("click", function () {
        var action = this.getAttribute("data-a11y-action");
        if (action === "font-inc") {
          state.fontStep = clampStep(state.fontStep + 1);
        } else if (action === "font-dec") {
          state.fontStep = clampStep(state.fontStep - 1);
        } else if (action === "contrast") {
          state.contrast = !state.contrast;
        } else if (action === "reset") {
          state.fontStep = 0;
          state.contrast = false;
        }
        applyState();
        saveState();
      });
    }
  });
})();
