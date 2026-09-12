// Maykon Tours — local accessibility toolbar
// Fully self-contained: no external script, no third-party account or signup
// required. Controls text size, contrast, link emphasis and a more readable
// font, and remembers the visitor's choice between visits (localStorage).
(function () {
  "use strict";

  var STORAGE_KEY = "maykon-a11y";
  var root = document.documentElement;
  var defaults = { fontStep: 0, contrast: false, underline: false, readable: false };

  var state;
  try {
    state = Object.assign({}, defaults, JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}"));
  } catch (e) {
    state = Object.assign({}, defaults);
  }

  function save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      /* localStorage unavailable — settings just won't persist */
    }
  }

  function setIndicator(name, on) {
    var el = document.querySelector('[data-a11y-indicator="' + name + '"]');
    if (el) el.textContent = on ? "פעיל" : "כבוי";
  }

  function apply() {
    root.style.fontSize = state.fontStep ? 100 + state.fontStep * 12 + "%" : "";
    root.classList.toggle("a11y-contrast", state.contrast);
    root.classList.toggle("a11y-underline-links", state.underline);
    root.classList.toggle("a11y-readable-font", state.readable);
    setIndicator("contrast", state.contrast);
    setIndicator("underline", state.underline);
    setIndicator("readable", state.readable);
  }

  apply();

  var toggleBtn = document.getElementById("a11y-toggle");
  var panel = document.getElementById("a11y-panel");
  if (!toggleBtn || !panel) return;

  function setPanelOpen(open) {
    panel.hidden = !open;
    toggleBtn.setAttribute("aria-expanded", open ? "true" : "false");
  }

  toggleBtn.addEventListener("click", function () {
    setPanelOpen(panel.hidden);
  });

  document.addEventListener("click", function (e) {
    var inPanel = panel.contains(e.target);
    var onToggle = toggleBtn.contains(e.target);
    if (!panel.hidden && !inPanel && !onToggle) setPanelOpen(false);
  });

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && !panel.hidden) setPanelOpen(false);
  });

  panel.addEventListener("click", function (e) {
    var btn = e.target.closest("[data-a11y-action]");
    if (!btn) return;
    switch (btn.getAttribute("data-a11y-action")) {
      case "font-inc":
        state.fontStep = Math.min(4, state.fontStep + 1);
        break;
      case "font-dec":
        state.fontStep = Math.max(-2, state.fontStep - 1);
        break;
      case "contrast":
        state.contrast = !state.contrast;
        break;
      case "underline":
        state.underline = !state.underline;
        break;
      case "readable":
        state.readable = !state.readable;
        break;
      case "reset":
        state = Object.assign({}, defaults);
        break;
    }
    save();
    apply();
  });
})();
