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

/* ---- Pro motion: GSAP hero, scroll reveals, counters, video ---- */
(function () {
  "use strict";

  /* Header shadow on scroll */
  var header = document.getElementById("siteHeader");
  function onScroll() { if (header) header.classList.toggle("scrolled", window.scrollY > 12); }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* Click-to-play product video */
  var player = document.getElementById("videoPlayer");
  var playBtn = document.getElementById("videoPlayBtn");
  function playVideo() {
    if (!player || player.dataset.playing) return;
    player.dataset.playing = "1";
    player.style.cursor = "default";
    var v = document.createElement("video");
    var s1 = document.createElement("source");
    s1.src = "assets/video/practicefellow-demo.mp4"; /* local copy once uploaded to repo */
    s1.type = "video/mp4";
    var s2 = document.createElement("source");
    s2.src = "https://muse.ai/files/1313649305169976/38774401878874588/rmohzqzl2qwcxfuplh5xl817/practicefellow-demo.mp4"; /* hosted fallback */
    s2.type = "video/mp4";
    v.appendChild(s1); v.appendChild(s2);
    v.controls = true;
    v.playsInline = true;
    v.poster = "assets/video/practicefellow-demo-poster.jpg";
    player.innerHTML = "";
    player.appendChild(v);
    v.play().catch(function () {});
  }
  if (playBtn) playBtn.addEventListener("click", function (e) { e.stopPropagation(); playVideo(); });
  if (player) player.addEventListener("click", playVideo);

  /* Animated counters */
  function animateCount(el) {
    var target = parseFloat(el.getAttribute("data-count") || "0");
    var prefix = el.getAttribute("data-prefix") || "";
    var suffix = el.getAttribute("data-suffix") || "";
    var dur = 1600, t0 = null;
    function fmt(n) { return prefix + Math.round(n).toLocaleString("en-US") + suffix; }
    function tick(t) {
      if (!t0) t0 = t;
      var p = Math.min((t - t0) / dur, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = fmt(target * eased);
      if (p < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* GSAP-powered motion (graceful fallback without it) */
  if (window.gsap && !reduceMotion) {
    gsap.registerPlugin(ScrollTrigger);

    /* Hero entrance */
    gsap.from("[data-hero]", {
      y: 36, opacity: 0, duration: 0.9, stagger: 0.12, ease: "power3.out", delay: 0.15
    });

    /* Scroll reveals */
    gsap.utils.toArray("[data-reveal]").forEach(function (el) {
      gsap.from(el, {
        y: 44, opacity: 0, duration: 0.85, ease: "power3.out",
        scrollTrigger: { trigger: el, start: "top 88%", once: true }
      });
    });

    /* Counters fire when visible */
    document.querySelectorAll("[data-count]").forEach(function (el) {
      ScrollTrigger.create({
        trigger: el, start: "top 92%", once: true,
        onEnter: function () { animateCount(el); }
      });
    });

    /* Subtle parallax on orbs */
    gsap.to(".orb-1", { y: 60, scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: 1 } });
    gsap.to(".orb-2", { y: -40, scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: 1 } });

    /* Tour panel content animates on tab switch */
    var tabs = document.querySelectorAll("#tourTabs .tab");
    tabs.forEach(function (tab) {
      tab.addEventListener("click", function () {
        var i = parseInt(tab.getAttribute("data-tour"), 10);
        var panels = document.querySelectorAll(".tour-panel");
        if (panels[i]) gsap.from(panels[i], { y: 18, opacity: 0, duration: 0.45, ease: "power2.out" });
      });
    });
  } else {
    /* No GSAP or reduced motion: just run counters when visible */
    var counted = new WeakSet();
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting && !counted.has(en.target)) {
          counted.add(en.target);
          if (!reduceMotion) animateCount(en.target); else {
            var t = parseFloat(en.target.getAttribute("data-count") || "0");
            en.target.textContent = (en.target.getAttribute("data-prefix") || "") + Math.round(t).toLocaleString("en-US") + (en.target.getAttribute("data-suffix") || "");
          }
          io.unobserve(en.target);
        }
      });
    }, { threshold: 0.4 });
    document.querySelectorAll("[data-count]").forEach(function (el) { io.observe(el); });
  }
})();
