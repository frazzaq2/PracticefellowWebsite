/* PracticeFellow client dashboard */
(function () {
  "use strict";
  var PAY_KEY = "pf_payments_v1";
  var STRIPE_KEY = "pf_stripe_pk";

  function esc(s){ return String(s == null ? "" : s).replace(/[&<>"']/g, function(c){ return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]; }); }
  function fmtDate(iso){ try { return new Date(iso).toLocaleString(); } catch(e){ return iso; } }
  function money(c){ return "$" + (c/100).toLocaleString(undefined,{minimumFractionDigits:2}); }

  /* ---------- view switching ---------- */
  var links = document.querySelectorAll(".slink");
  var titles = { overview:["Overview","Your pipeline at a glance."], leads:["Leads","Demo requests and inbound interest."], submissions:["Form submissions","Messages from the contact form."], payments:["Payments","Software-service payments via Stripe."], settings:["Settings","Integrations and data controls."] };
  links.forEach(function (a) {
    a.addEventListener("click", function (ev) {
      ev.preventDefault();
      links.forEach(function (x){ x.classList.remove("active"); });
      a.classList.add("active");
      var v = a.getAttribute("data-view");
      document.querySelectorAll(".dash-view").forEach(function (s){ s.classList.remove("active"); });
      document.getElementById("view-" + v).classList.add("active");
      document.getElementById("viewTitle").textContent = titles[v][0];
      document.getElementById("viewSub").textContent = titles[v][1];
    });
  });

  /* ---------- leads ---------- */
  function leads(){ return (window.PF && PF.getLeads()) || []; }
  function seedLeads(){
    var seed = [
      {name:"Dr. Alicia Gomez",email:"alicia@gomezaba.com",phone:"(305) 555-0114",practice:"Gomez ABA Center",specialty:"ABA Therapy",providers:"16–50",type:"Live demo",message:"We run 3 locations and need multi-clinic billing. Currently on a legacy EHR.",status:"Demo scheduled"},
      {name:"Brian Foster",email:"brian@clearspeech.com",phone:"(512) 555-0188",practice:"ClearSpeech Therapy",specialty:"Speech Therapy",providers:"6–15",type:"Pricing quote",message:"Looking for notes + billing in one system. 8 SLPs.",status:"Contacted"},
      {name:"Dr. Priya Nair",email:"priya@metroim.com",phone:"(212) 555-0142",practice:"Metro Internal Medicine",specialty:"Internal Medicine",providers:"2–5",type:"Live demo",message:"Need eligibility checks and ERA posting. Interested in AI scribe waitlist.",status:"New"},
      {name:"Tom Becker",email:"tom@sunriseot.com",phone:"(714) 555-0177",practice:"Sunrise OT Group",specialty:"Occupational Therapy",providers:"6–15",type:"Migration from another EHR",message:"Migrating 400 patients and 2 years of notes. Timeline Q1.",status:"New"}
    ];
    seed.forEach(function(s){ PF.saveLead(s); });
    renderLeads(); renderOverview();
  }
  function statusBadge(st){
    var map = {"New":"purple","Contacted":"amber","Demo scheduled":"green","Customer":"green","Archived":"gray"};
    return '<span class="badge ' + (map[st]||"gray") + '">' + esc(st) + "</span>";
  }
  function renderLeads(){
    var q = (document.getElementById("leadSearch").value || "").toLowerCase();
    var fs = document.getElementById("leadStatus").value;
    var rows = leads().filter(function(l){
      var hay = (l.name+" "+l.email+" "+l.practice).toLowerCase();
      return (!q || hay.indexOf(q) > -1) && (!fs || l.status === fs);
    });
    var html = rows.map(function(l){
      return "<tr><td><b>" + esc(l.name) + "</b></td><td>" + esc(l.email) + "<br><small style='color:var(--faint)'>" + esc(l.phone||"") + "</small></td><td>" + esc(l.practice) + "</td><td>" + esc(l.specialty||"") + "</td><td>" + esc(l.providers||"") + "</td><td>" + esc(l.type||"") + "</td><td style='white-space:nowrap'>" + fmtDate(l.receivedAt) + "</td><td>" + statusBadge(l.status) + "</td></tr>";
    }).join("");
    document.getElementById("leadsBody").innerHTML = html || '<tr><td colspan="8"><div class="empty">No leads yet — submit the <a href="contact.html">contact form</a> or load demo data.</div></td></tr>';
  }
  function renderSubs(){
    var rows = leads().filter(function(l){ return (l.message||"").length > 0; });
    var html = rows.map(function(l){
      return "<tr><td><b>" + esc(l.name) + "</b><br><small style='color:var(--faint)'>" + esc(l.email) + " · " + esc(l.practice) + "</small></td><td>" + esc(l.type||"—") + "</td><td style='max-width:420px'>" + esc(l.message) + "</td><td style='white-space:nowrap'>" + fmtDate(l.receivedAt) + "</td></tr>";
    }).join("");
    document.getElementById("subsBody").innerHTML = html || '<tr><td colspan="4"><div class="empty">No submissions yet.</div></td></tr>';
  }
  function renderOverview(){
    var all = leads();
    var week = all.filter(function(l){ return Date.now() - new Date(l.receivedAt).getTime() < 7*864e5; }).length;
    var demos = all.filter(function(l){ return (l.type||"").toLowerCase().indexOf("demo") > -1; }).length;
    document.getElementById("kLeads").textContent = all.length;
    document.getElementById("kWeek").textContent = week;
    document.getElementById("kDemos").textContent = demos;
    var pays = getPays().filter(function(p){ return p.status === "Paid"; });
    var total = pays.reduce(function(s,p){ return s + p.amount; }, 0);
    document.getElementById("kPay").textContent = money(total);
    var recent = all.slice(0,5).map(function(l){
      return '<div class="mock-row"><span><b>' + esc(l.name) + "</b> · " + esc(l.practice) + " — " + esc(l.type||"lead") + "</span><span>" + statusBadge(l.status) + "</span></div>";
    }).join("");
    document.getElementById("recentList").innerHTML = recent || '<p style="color:var(--faint)">No activity yet.</p>';
  }
  function toCSV(rows, cols){
    var out = [cols.join(",")];
    rows.forEach(function(r){ out.push(cols.map(function(c){ return '"' + String(r[c] == null ? "" : r[c]).replace(/"/g,'""') + '"'; }).join(",")); });
    return out.join("\n");
  }
  function download(name, text){
    var a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([text], {type:"text/csv"}));
    a.download = name; a.click();
  }

  /* ---------- payments ---------- */
  function getPays(){ try { return JSON.parse(localStorage.getItem(PAY_KEY) || "[]"); } catch(e){ return []; } }
  function setPays(p){ try { localStorage.setItem(PAY_KEY, JSON.stringify(p)); } catch(e){} }
  function seedPaysIfEmpty(){
    if (getPays().length) return;
    setPays([
      {id:"PAY-1001",customer:"Gomez ABA Center",desc:"Growth plan — annual (16 providers)",amount:2476800,date:new Date(Date.now()-20*864e5).toISOString(),status:"Paid"},
      {id:"PAY-1002",customer:"ClearSpeech Therapy",desc:"Onboarding & migration fee",amount:250000,date:new Date(Date.now()-9*864e5).toISOString(),status:"Paid"},
      {id:"PAY-1003",customer:"Metro Internal Medicine",desc:"Growth plan — monthly (4 providers)",amount:51600,date:new Date(Date.now()-2*864e5).toISOString(),status:"Pending"}
    ]);
  }
  function renderPays(){
    var rows = getPays();
    document.getElementById("payBody").innerHTML = rows.map(function(p){
      var b = p.status === "Paid" ? "green" : (p.status === "Pending" ? "amber" : "red");
      return "<tr><td><code class='inline'>" + esc(p.id) + "</code></td><td><b>" + esc(p.customer) + "</b></td><td>" + esc(p.desc) + "</td><td><b>" + money(p.amount) + "</b></td><td style='white-space:nowrap'>" + fmtDate(p.date) + "</td><td><span class='badge " + b + "'>" + esc(p.status) + "</span></td></tr>";
    }).join("") || '<tr><td colspan="6"><div class="empty">No payments recorded yet.</div></td></tr>';
    renderOverview();
  }

  /* ---------- stripe key ---------- */
  var keyInput = document.getElementById("stripeKey");
  var savedKey = "";
  try { savedKey = localStorage.getItem(STRIPE_KEY) || ""; } catch(e){}
  if (savedKey) { keyInput.value = savedKey; setStripeStatus(true); }
  function setStripeStatus(on){
    document.getElementById("stripeStatus").innerHTML = on
      ? "✓ Publishable key saved. Add the matching <code>webhook secret</code> on your server (see README) to auto-record payments."
      : "No key saved — payments below are demo records.";
  }
  document.getElementById("saveStripeKey").addEventListener("click", function(){
    var v = keyInput.value.trim();
    if (!v || (v.indexOf("pk_test_") !== 0 && v.indexOf("pk_live_") !== 0)) { alert("Paste a valid Stripe publishable key (pk_test_… or pk_live_…)."); return; }
    try { localStorage.setItem(STRIPE_KEY, v); } catch(e){}
    setStripeStatus(true);
  });

  /* ---------- events ---------- */
  document.getElementById("seedBtn").addEventListener("click", seedLeads);
  document.getElementById("leadSearch").addEventListener("input", renderLeads);
  document.getElementById("leadStatus").addEventListener("change", renderLeads);
  document.getElementById("exportLeads").addEventListener("click", function(){
    download("practicefellow-leads.csv", toCSV(leads(), ["id","name","email","phone","practice","specialty","providers","type","status","receivedAt","message"]));
  });
  document.getElementById("exportPay").addEventListener("click", function(){
    download("practicefellow-payments.csv", toCSV(getPays(), ["id","customer","desc","amount","date","status"]));
  });
  document.getElementById("newPaymentBtn").addEventListener("click", function(){
    var customer = prompt("Customer / practice name:"); if (!customer) return;
    var desc = prompt("Description:", "Growth plan — monthly") || "";
    var amt = parseFloat(prompt("Amount (USD):", "129.00") || "0");
    var pays = getPays();
    pays.unshift({id:"PAY-" + (1000 + pays.length + 1), customer:customer, desc:desc, amount:Math.round(amt*100), date:new Date().toISOString(), status:"Paid"});
    setPays(pays); renderPays();
  });
  document.getElementById("clearData").addEventListener("click", function(){
    if (!confirm("Clear all local demo data (leads + payments)?")) return;
    try { localStorage.removeItem(PF.LEADS_KEY); localStorage.removeItem(PAY_KEY); } catch(e){}
    renderLeads(); renderSubs(); renderPays();
  });

  /* ---------- init ---------- */
  seedPaysIfEmpty();
  renderLeads(); renderSubs(); renderPays();
})();
