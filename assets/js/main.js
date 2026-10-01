/* PracticeFellow site — shared interactions */
(function () {
  "use strict";

  /* ---- Config: point this at your backend to receive leads server-side ----
     The contact form always saves a copy to localStorage (visible in the
     client dashboard). If LEAD_ENDPOINT is set, it also POSTs JSON there. */
  var LEAD_ENDPOINT = ""; // e.g. "https://api.yourdomain.com/leads"
  var LEADS_KEY = "pf_leads_v1";

  /* ---- Mobile nav ---- */
  var toggle = document.getElementById("navToggle");
  var links = document.getElementById("navLinks");
  if (toggle && links) {
    toggle.addEventListener("click", function () { links.classList.toggle("open"); });
  }

  /* ---- Product tour tabs ---- */
  var tabs = document.querySelectorAll("#tourTabs .tab");
  var panels = document.querySelectorAll(".tour-panel");
  tabs.forEach(function (tab) {
    tab.addEventListener("click", function () {
      tabs.forEach(function (t) { t.classList.remove("active"); });
      panels.forEach(function (p) { p.classList.remove("active"); });
      tab.classList.add("active");
      var i = parseInt(tab.getAttribute("data-tour"), 10);
      if (panels[i]) panels[i].classList.add("active");
    });
  });

  /* ---- FAQ accordion ---- */
  document.querySelectorAll(".faq-item").forEach(function (item) {
    var q = item.querySelector(".faq-q");
    if (!q) return;
    q.addEventListener("click", function () {
      var open = item.classList.contains("open");
      document.querySelectorAll(".faq-item.open").forEach(function (o) { o.classList.remove("open"); });
      if (!open) item.classList.add("open");
    });
  });

  /* ---- Lead storage helpers (shared with dashboard) ---- */
  function getLeads() {
    try { return JSON.parse(localStorage.getItem(LEADS_KEY) || "[]"); }
    catch (e) { return []; }
  }
  function saveLead(lead) {
    var leads = getLeads();
    lead.id = "LD-" + Date.now().toString(36).toUpperCase();
    lead.receivedAt = new Date().toISOString();
    lead.status = lead.status || "New";
    leads.unshift(lead);
    try { localStorage.setItem(LEADS_KEY, JSON.stringify(leads)); } catch (e) {}
    return lead;
  }
  // expose for dashboard
  window.PF = { getLeads: getLeads, saveLead: saveLead, LEADS_KEY: LEADS_KEY, getEndpoint: function(){ return LEAD_ENDPOINT; } };

  /* ---- Contact / demo form ---- */
  var form = document.getElementById("leadForm");
  if (form) {
    form.addEventListener("submit", function (ev) {
      ev.preventDefault();
      var data = {};
      new FormData(form).forEach(function (v, k) { data[k] = String(v).trim(); });
      if (!data.name || !data.email || !data.practice) {
        alert("Please fill in your name, email and practice name.");
        return;
      }
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(data.email)) {
        alert("Please enter a valid email address.");
        return;
      }
      var saved = saveLead(data);
      if (LEAD_ENDPOINT) {
        fetch(LEAD_ENDPOINT, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(saved)
        }).catch(function () { /* local copy already saved */ });
      }
      form.reset();
      var ok = document.getElementById("formOk");
      if (ok) { ok.classList.add("show"); ok.scrollIntoView({ behavior: "smooth", block: "center" }); }
    });
  }
})();
