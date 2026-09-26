// Maykon Tours — crm-lead.js
// Adds a name + phone field to the lead form, sends every submission into the
// Maykon CRM (/crm/leads), and then hands the visitor over to WhatsApp exactly
// as before. Loaded AFTER js/main.js; it intercepts the submit during the
// capture phase, so it replaces main.js's own handler rather than racing it.

(function () {
  "use strict";

  var AGENT_WHATSAPP_LINK = "https://wa.me/972528786250";
  var CRM_LEADS_ENDPOINT =
    "https://maykon-crm-default-rtdb.europe-west1.firebasedatabase.app/crm/leads.json";

  var FIELD_CLASS =
    "w-full rounded-2xl border border-navy-900/10 bg-cream-50 px-4 py-3.5 " +
    "text-navy-900 placeholder:text-navy-900/35 outline-none transition-all " +
    "focus:border-turquoise-500 focus:ring-4 focus:ring-turquoise-100";
  var LABEL_CLASS = "mb-1.5 block text-sm font-semibold text-navy-900";

  function field(id, name, labelText, type, maxLength, extra) {
    var wrap = document.createElement("div");
    var label = document.createElement("label");
    label.setAttribute("for", id);
    label.className = LABEL_CLASS;
    label.textContent = labelText;
    var input = document.createElement("input");
    input.id = id;
    input.name = name;
    input.type = type;
    input.required = true;
    input.maxLength = maxLength;
    input.className = FIELD_CLASS;
    if (extra) {
      Object.keys(extra).forEach(function (k) { input.setAttribute(k, extra[k]); });
    }
    wrap.appendChild(label);
    wrap.appendChild(input);
    return wrap;
  }

  // "2 מבוגרים, 1 ילד (גילאים: 5)" -> "3". Empty string when it cannot be read.
  function paxCount(summary) {
    var adults = /^\s*(\d+)/.exec(summary || "");
    if (!adults) return "";
    var kids = /,\s*(\d+)\s*ילד/.exec(summary || "");
    var total = parseInt(adults[1], 10) + (kids ? parseInt(kids[1], 10) : 0);
    return isFinite(total) && total > 0 ? String(total) : "";
  }

  // Fire and forget. keepalive lets the request outlive the redirect to
  // WhatsApp, and a failure here must never stop that redirect.
  function sendLeadToCrm(payload) {
    try {
      fetch(CRM_LEADS_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        keepalive: true
      })["catch"](function () {});
    } catch (err) {
      /* ignore */
    }
  }

  function sourceTag() {
    var m = /[?&](?:src|utm_source)=([^&]+)/.exec(location.search);
    return m ? decodeURIComponent(m[1]).slice(0, 30) : "landing";
  }

  function addFields(form) {
    if (document.getElementById("lead-name")) return;
    var anchor = document.getElementById("destination");
    var before = anchor ? anchor.closest("div") : form.firstElementChild;
    var parent = before ? before.parentNode : form;
    parent.insertBefore(
      field("lead-name", "name", "שם מלא", "text", 60, { autocomplete: "name" }),
      before
    );
    parent.insertBefore(
      field("lead-phone", "phone", "טלפון", "tel", 20, {
        autocomplete: "tel", inputmode: "tel", dir: "ltr"
      }),
      before
    );
  }

  function onSubmit(e) {
    var form = e.target;
    if (!form || form.id !== "agent-form") return;

    e.preventDefault();
    e.stopPropagation();

    var data = new FormData(form);
    var get = function (k) { return (data.get(k) || "").toString().trim(); };

    var name = get("name");
    var phone = get("phone");
    var travelers = get("travelers");
    var destination = get("destination");
    var dates = get("dates");
    var purpose = get("purpose");
    var budget = get("budget");

    var notes = [];
    if (purpose) notes.push("מטרה והעדפות: " + purpose);
    if (budget) notes.push("תקציב לאדם: " + budget);
    if (travelers) notes.push("הרכב הנסיעה: " + travelers);

    sendLeadToCrm({
      name: name.slice(0, 60),
      phone: phone.slice(0, 20),
      dest: destination.slice(0, 60),
      when: dates.slice(0, 40),
      pax: paxCount(travelers),
      note: notes.join("\n").slice(0, 600),
      src: sourceTag(),
      u: Date.now()
    });

    var lines = [
      "היי! מעוניין/ת בהצעת מחיר לחופשה ✈️",
      "",
      "🙋 שם: " + (name || "-"),
      "📞 טלפון: " + (phone || "-"),
      "👥 כמה אנשים ואיזה גילאים: " + (travelers || "-"),
      "📍 יעד מבוקש: " + (destination || "-"),
      "📅 תאריכים: " + (dates || "-"),
      "🎯 מטרת הנסיעה והעדפות: " + (purpose || "-"),
      "💰 תקציב משוער לאדם: " + (budget || "-"),
      "",
      "נשלח מדף הנחיתה של Maykon Tours"
    ];

    var url = AGENT_WHATSAPP_LINK + "?text=" + encodeURIComponent(lines.join("\n"));

    var submitBtn = form.querySelector('button[type="submit"]');
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.classList.add("opacity-70");
    }

    window.setTimeout(function () { window.location.href = url; }, 250);
  }

  function start() {
    var form = document.getElementById("agent-form");
    if (!form) return;
    addFields(form);
    document.addEventListener("submit", onSubmit, true);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start);
  } else {
    start();
  }
})();
