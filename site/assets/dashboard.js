/* AARR — لوحة العمليات (محلية أولاً + مزامنة اختيارية) */
(function () {
  "use strict";
  var CFG = window.AARR_CONFIG || {};
  var K = { leads: "aarr_leads_local", ledger: "aarr_ledger", pipeline: "aarr_pipeline", svc: "aarr_svc" };

  function read(key, fallback) { try { return JSON.parse(localStorage.getItem(key) || "null") || fallback; } catch (e) { return fallback; } }
  function write(key, val) { localStorage.setItem(key, JSON.stringify(val)); }
  function readSession(key) { try { return sessionStorage.getItem(key) || ""; } catch (e) { return ""; } }
  function writeSession(key, val) { try { if (val) sessionStorage.setItem(key, val); else sessionStorage.removeItem(key); } catch (e) { /* noop */ } }
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]; }); }
  function fmtMAD(n) { return (Number(n) || 0).toLocaleString("fr-MA", { maximumFractionDigits: 0 }) + " د.م"; }
  function todayISO() { return new Date().toISOString().slice(0, 10); }
  function toast(msg) {
    var t = document.getElementById("toast");
    if (!t) return; t.textContent = msg; t.classList.add("show");
    setTimeout(function () { t.classList.remove("show"); }, 4000);
  }
  function csvCell(v) { v = String(v == null ? "" : v); return /[",\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; }
  function downloadCSV(name, header, rows) {
    var lines = [header.map(csvCell).join(",")].concat(rows.map(function (r) { return r.map(csvCell).join(","); }));
    var blob = new Blob(["﻿" + lines.join("\r\n")], { type: "text/csv;charset=utf-8" });
    var a = document.createElement("a");
    a.href = URL.createObjectURL(blob); a.download = name; a.click();
    URL.revokeObjectURL(a.href);
  }

  /* ---------- Tabs ---------- */
  var tabs = document.querySelectorAll(".tab");
  tabs.forEach(function (tab) {
    tab.addEventListener("click", function () {
      tabs.forEach(function (t) { t.classList.toggle("active", t === tab); });
      document.querySelectorAll("[data-panel]").forEach(function (p) { p.hidden = p.id !== "tab-" + tab.dataset.tab; });
      if (tab.dataset.tab === "overview") drawChart();
    });
  });

  /* ---------- Leads ---------- */
  var remoteLeads = []; // من سوبابيس عند الربط
  function allLeads() {
    var local = read(K.leads, []).map(function (l) { l._origin = "محلي"; return l; });
    return remoteLeads.map(function (l) { l._origin = "☁️"; return l; }).concat(local);
  }
  function renderLeads() {
    var q = (document.getElementById("leadSearch").value || "").toLowerCase().trim();
    var rows = allLeads().filter(function (l) {
      return !q || (l.full_name || "").toLowerCase().includes(q) || (l.email || "").toLowerCase().includes(q);
    });
    var tb = document.getElementById("leadsTbody");
    tb.innerHTML = rows.slice(0, 300).map(function (l) {
      var date = (l.created_at || l.created || "").slice(0, 10);
      return "<tr><td>" + esc(date) + "</td><td>" + esc(l.full_name) + "</td><td dir='ltr' style='text-align:left'>" + esc(l.email) + "</td><td dir='ltr'>" + esc(l.whatsapp || "—") + "</td><td>" + esc(l.source || "landing") + " · " + esc(l._origin) + "</td><td>" + statusBadge(l) + "</td><td></td></tr>";
    }).join("") || "<tr><td colspan='7' style='text-align:center;color:#7fa19d;padding:1.5rem'>لا توجد سجلات مطابقة بعد — سجلات الواجهة العامة تظهر هنا تلقائياً.</td></tr>";
    updateKpis();
  }
  function statusBadge(l) {
    var s = l.status || "جديد";
    var cls = s === "ساخن" ? "st-hot" : s === "مغلق" ? "st-won" : s === "خسارة" ? "st-lost" : "st-new";
    return "<span class='badge-status " + cls + "'>" + esc(s) + "</span>";
  }
  document.getElementById("leadSearch").addEventListener("input", renderLeads);
  document.getElementById("addManualLeadBtn").addEventListener("click", function () {
    var n = document.getElementById("manualName"), e = document.getElementById("manualEmail");
    if (n.value.trim().length < 2 || !/^[^@\s]+@[^@\s]+\.[^@\s]{2,}$/.test(e.value)) return toast("اسم أو بريد غير صالح.");
    var arr = read(K.leads, []);
    arr.unshift({ full_name: n.value.trim(), email: e.value.trim().toLowerCase(), whatsapp: null, source: "يدوي", consent: true, created_at: new Date().toISOString() });
    write(K.leads, arr); n.value = ""; e.value = ""; renderLeads(); toast("أُضيف العميل محلياً.");
  });
  document.getElementById("exportLeadsCsvBtn").addEventListener("click", function () {
    downloadCSV("aarr-leads-" + todayISO() + ".csv", ["date", "name", "email", "whatsapp", "source", "consent"],
      allLeads().map(function (l) { return [(l.created_at || "").slice(0, 10), l.full_name, l.email, l.whatsapp || "", l.source || "", l.consent ? "yes" : "no"]; }));
  });
  document.getElementById("clearLocalBtn").addEventListener("click", function () {
    if (confirm("مسح كل السجلات المحلية على هذا الجهاز؟ (النسخة الاحتياطية JSON تنصح بها أولاً)")) { write(K.leads, []); renderLeads(); toast("تم المسح المحلي."); }
  });

  /* ---------- Supabase sync ---------- */
  var syncState = document.getElementById("syncState");
  function setSyncState(text, cls) { syncState.textContent = text; syncState.className = "badge-status " + cls; }
  async function syncSupabase(key) {
    var base = (CFG.supabaseUrl || "").replace(/\/$/, "");
    var res = await fetch(base + "/rest/v1/leads?select=full_name,email,whatsapp,source,consent,created_at&order=created_at.desc&limit=500", {
      headers: { apikey: key, Authorization: "Bearer " + key }
    });
    if (!res.ok) throw new Error("HTTP " + res.status);
    return res.json();
  }
  document.getElementById("connectSyncBtn").addEventListener("click", async function () {
    var key = document.getElementById("serviceKey").value.trim();
    if (key.length < 20) return toast("الصق المفتاح الخدمي أولاً.");
    setSyncState("جارٍ الاتصال…", "st-hot");
    try {
      remoteLeads = await syncSupabase(key);
      writeSession(K.svc, key);
      setSyncState("مربوطة ☁️ (" + remoteLeads.length + ")", "st-won");
      renderLeads(); toast("تمت المزامنة — " + remoteLeads.length + " سجلاً.");
    } catch (err) { setSyncState("فشل: " + err.message, "st-lost"); }
  });
  document.getElementById("disconnectSyncBtn").addEventListener("click", function () {
    remoteLeads = []; writeSession(K.svc, ""); document.getElementById("serviceKey").value = "";
    setSyncState("غير مربوطة", "st-new"); renderLeads();
  });
  (function autoResync() { var k = readSession(K.svc); if (k) { document.getElementById("serviceKey").value = k; syncSupabase(k).then(function (r) { remoteLeads = r; setSyncState("مربوطة ☁️ (" + r.length + ")", "st-won"); renderLeads(); }).catch(function () {}); } })();

  /* ---------- الدفتر المالي ---------- */
  document.getElementById("lgDate").value = todayISO();
  var ledgerForm = document.getElementById("ledgerForm");
  function renderLedger() {
    var rows = read(K.ledger, []).slice().sort(function (a, b) { return b.date.localeCompare(a.date); });
    var tin = 0, tout = 0;
    rows.forEach(function (r) { r.type === "in" ? tin += +r.amount : tout += +r.amount; });
    document.getElementById("ledgerSummary").textContent = "وارد " + fmtMAD(tin) + " − صادر " + fmtMAD(tout) + " = " + fmtMAD(tin - tout);
    document.getElementById("ledgerTbody").innerHTML = rows.map(function (r) {
      return "<tr><td>" + esc(r.date) + "</td><td>" + (r.type === "in" ? "وارد" : "صادر") + "</td><td>" + esc(r.label) + "</td><td>" + fmtMAD(r.amount) + "</td><td><button class='btn btn-danger btn-sm' data-del='" + r.id + "'>✕</button></td></tr>";
    }).join("") || "<tr><td colspan='5' style='text-align:center;color:#7fa19d;padding:1.5rem'>الدفتر فارغ — أضف أول قيد (مثلاً: وارد من نسخة الدليل).</td></tr>";
    updateKpis(); drawChart(); renderKpiTargets();
  }
  ledgerForm.addEventListener("submit", function (e) {
    e.preventDefault();
    var rows = read(K.ledger, []);
    rows.push({ id: Date.now(), date: document.getElementById("lgDate").value, type: document.getElementById("lgType").value, label: document.getElementById("lgLabel").value.trim(), amount: parseFloat(document.getElementById("lgAmount").value) || 0 });
    write(K.ledger, rows); ledgerForm.reset(); document.getElementById("lgDate").value = todayISO();
    renderLedger(); toast("أُضيف القيد.");
  });
  document.getElementById("ledgerTbody").addEventListener("click", function (e) {
    var id = e.target.getAttribute && e.target.getAttribute("data-del");
    if (!id) return;
    write(K.ledger, read(K.ledger, []).filter(function (r) { return String(r.id) !== id; }));
    renderLedger();
  });
  document.getElementById("exportLedgerCsvBtn").addEventListener("click", function () {
    downloadCSV("aarr-ledger-" + todayISO() + ".csv", ["date", "type", "label", "amount_mad"],
      read(K.ledger, []).map(function (r) { return [r.date, r.type === "in" ? "in" : "out", r.label, r.amount]; }));
  });

  /* ---------- خط الأنابيب ---------- */
  var STAGES = [{ id: "new", t: "جديد" }, { id: "hot", t: "مهتم" }, { id: "won", t: "مغلق ✅" }, { id: "lost", t: "خسارة ✗" }];
  var board = document.getElementById("pipelineBoard");
  function renderPipeline() {
    var cards = read(K.pipeline, []);
    board.innerHTML = STAGES.map(function (s) {
      var list = cards.filter(function (c) { return c.stage === s.id; });
      var html = list.map(function (c) {
        return "<div class='pipe-card'><b>" + esc(c.name) + "</b><br><small>" + fmtMAD(c.value || 0) + " · " + esc((c.created_at || "").slice(0, 10)) + "</small><br><span style='display:flex;gap:.3rem;margin-top:.35rem'>" +
          "<button class='btn btn-ghost btn-sm' data-move='-1' data-id='" + c.id + "'>◀</button>" +
          "<button class='btn btn-ghost btn-sm' data-move='1' data-id='" + c.id + "'>▶</button>" +
          "<button class='btn btn-danger btn-sm' data-del-card='" + c.id + "'>✕</button></span></div>";
      }).join("");
      return "<div class='pipe-col'><h3>" + s.t + "<span>" + list.length + "</span></h3>" + html + "</div>";
    }).join("");
    updateKpis(); renderKpiTargets();
  }
  document.getElementById("pipeForm").addEventListener("submit", function (e) {
    e.preventDefault();
    var cards = read(K.pipeline, []);
    cards.push({ id: Date.now(), name: document.getElementById("pipeName").value.trim(), stage: document.getElementById("pipeStage").value, value: parseFloat(document.getElementById("pipeValue").value) || 0, created_at: new Date().toISOString() });
    write(K.pipeline, cards); e.target.reset(); renderPipeline(); toast("أُضيفت الصفقة.");
  });
  board.addEventListener("click", function (e) {
    var t = e.target;
    var move = t.getAttribute && t.getAttribute("data-move");
    var del = t.getAttribute && t.getAttribute("data-del-card");
    var cards = read(K.pipeline, []);
    if (move) {
      var id = +t.getAttribute("data-id");
      cards = cards.map(function (c) {
        if (c.id !== id) return c;
        var idx = STAGES.findIndex(function (s) { return s.id === c.stage; });
        idx = Math.min(STAGES.length - 1, Math.max(0, idx + (+move)));
        c.stage = STAGES[idx].id; return c;
      });
      write(K.pipeline, cards); renderPipeline();
    } else if (del) {
      write(K.pipeline, cards.filter(function (c) { return String(c.id) !== del; })); renderPipeline();
    }
  });

  /* ---------- KPI cards + الأهداف ---------- */
  function revenueIn() { return read(K.ledger, []).filter(function (r) { return r.type === "in"; }).reduce(function (s, r) { return s + (+r.amount || 0); }, 0); }
  function updateKpis() {
    var leads = allLeads();
    var today = new Date().toISOString().slice(0, 10);
    var todayCount = leads.filter(function (l) { return (l.created_at || "").slice(0, 10) === today; }).length;
    var cards = read(K.pipeline, []);
    var open = cards.filter(function (c) { return c.stage === "new" || c.stage === "hot"; }).length;
    var won = cards.filter(function (c) { return c.stage === "won"; }).length;
    var lost = cards.filter(function (c) { return c.stage === "lost"; }).length;
    var rate = won + lost > 0 ? Math.round((won / (won + lost)) * 100) : 0;
    document.getElementById("kLeads").textContent = leads.length;
    document.getElementById("kLeadsToday").textContent = "+" + todayCount + " اليوم";
    document.getElementById("kPipeline").textContent = open;
    document.getElementById("kRevenue").textContent = fmtMAD(revenueIn());
    document.getElementById("kCloseRate").textContent = rate + "%";
  }
  var TARGETS = [
    { t: "عملاء محتملون (الشهر 1)", target: 50, cur: function () { return allLeads().length; } },
    { t: "مبيعات الدليل (الشهر 1)", target: 25, cur: function () { return read(K.pipeline, []).filter(function (c) { return c.stage === "won"; }).length; } },
    { t: "الإيرادات (الشهر 1) د.م", target: 2475, cur: function () { return revenueIn(); } },
    { t: "منشورات محتوى (الشهر 1)", target: 24, cur: function () { return 0; } },
    { t: "مقابلات/مكالمات اكتشاف", target: 8, cur: function () { return 0; } }
  ];
  function renderKpiTargets() {
    var tb = document.getElementById("kpiTargets"); if (!tb) return;
    tb.innerHTML = TARGETS.map(function (x) {
      var cur = x.cur(); var pct = Math.min(100, x.target > 0 ? Math.round((cur / x.target) * 100) : 0);
      return "<tr><td>" + esc(x.t) + "</td><td>" + x.target + "</td><td>" + (typeof cur === "number" ? Math.round(cur * 10) / 10 : cur) + "</td><td>" + pct + "%</td></tr>";
    }).join("");
  }

  /* ---------- الرسم البياني ---------- */
  function drawChart() {
    var cv = document.getElementById("chartFinance"); if (!cv || !cv.getContext) return;
    var ctx = cv.getContext("2d");
    var W = cv.width, H = cv.height; ctx.clearRect(0, 0, W, H);
    var rows = read(K.ledger, []);
    var months = [];
    for (var i = 5; i >= 0; i--) { var d = new Date(); d.setMonth(d.getMonth() - i); months.push(d.toISOString().slice(0, 7)); }
    var tin = months.map(function (m) { return rows.filter(function (r) { return r.type === "in" && (r.date || "").slice(0, 7) === m; }).reduce(function (s, r) { return s + (+r.amount || 0); }, 0); });
    var tout = months.map(function (m) { return rows.filter(function (r) { return r.type === "out" && (r.date || "").slice(0, 7) === m; }).reduce(function (s, r) { return s + (+r.amount || 0); }, 0); });
    var max = Math.max(100, Math.max.apply(null, tin.concat(tout))) * 1.15;
    var pad = 34, bw = (W - pad * 2) / months.length;
    ctx.font = "12px 'IBM Plex Sans Arabic',sans-serif";
    months.forEach(function (m, i) {
      var x = pad + i * bw;
      var hIn = (tin[i] / max) * (H - 54), hOut = (tout[i] / max) * (H - 54);
      ctx.fillStyle = "#2fbf8f"; ctx.fillRect(x + bw * 0.14, H - 28 - hIn, bw * 0.3, hIn);
      ctx.fillStyle = "#e0644f"; ctx.fillRect(x + bw * 0.52, H - 28 - hOut, bw * 0.3, hOut);
      ctx.fillStyle = "#8fb3ad"; ctx.textAlign = "center"; ctx.fillText(m.slice(5) + "/" + m.slice(2, 4), x + bw / 2, H - 10);
    });
    ctx.textAlign = "right"; ctx.fillStyle = "#f4d98c"; ctx.fillText("■ وارد  ■ صادر", W - 10, 16);
    ctx.fillStyle = "#2fbf8f"; ctx.fillRect(W - 78, 6, 10, 10); ctx.fillStyle = "#e0644f"; ctx.fillRect(W - 24, 6, 10, 10);
  }

  /* ---------- نسخ احتياطي JSON ---------- */
  document.getElementById("exportAllBtn").addEventListener("click", function () {
    var dump = { exported_at: new Date().toISOString(), leads_local: read(K.leads, []), ledger: read(K.ledger, []), pipeline: read(K.pipeline, []) };
    var blob = new Blob([JSON.stringify(dump, null, 2)], { type: "application/json" });
    var a = document.createElement("a"); a.href = URL.createObjectURL(blob);
    a.download = "aarr-backup-" + todayISO() + ".json"; a.click(); URL.revokeObjectURL(a.href);
    toast("نُزّلت نسخة احتياطية كاملة.");
  });

  /* ---------- init ---------- */
  renderLeads(); renderLedger(); renderPipeline(); renderKpiTargets();
})();
