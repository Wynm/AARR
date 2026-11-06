/* AARR — منطق الواجهة العامة */
(function () {
  "use strict";
  var CFG = window.AARR_CONFIG || {};

  /* ---------- محتوى ديناميكي ---------- */
  var features = [
    { t: "أدوات الذكاء الاصطناعي موضحة بالعربية", d: "أفضل 40+ أداة مع السعر بالدرهم، نقاط القوة والضعف، ومتى تستعمل كل واحدة (كتابة، صور، صوت، فيديو، أتمتة).", i: "M9 3v10a3 3 0 0 0 3 3m-3-13a3 3 0 0 1 3-3h1a3 3 0 0 1 3 3m-7 0h8M12 16v5" },
    { t: "خصص خدمتك حسب طلب السوق", d: "كيف تختار تخصصاً مربحاً في المغرب: كتابة محتوى، إدارة سوشيال، ترجمة، تصميم، أتمتة — وما يبحث عنه العملاء فعلياً.", i: "M3 12l6 6L21 6" },
    { t: "تسعير بالدرهم بثقة", d: "جداول تسعير جاهزة (مقدمة/قياسي/احترافي)، أمثلة واقعية لمشاريع مغربية، وفنون قول «سعري 1500 درهم» دون إحراج.", i: "M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" },
    { t: "قوالب جاهزة للنسخ واللصق", d: "12 قالباً: رسالة عرض سعر، متابعة عميل، الرد على «السعر غالي»، عقد مصغر، قائمة تسليم — كلها بالعربية وبالفرنسية.", i: "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6" },
    { t: "خطة 30 يوم إلى أول عميل", d: "يوم بيوم: من بناء ملفك على خمسات/مستقل/لينكدإن إلى أول عرض مدفوع — بجرعات يومية لا تتجاوز 90 دقيقة.", i: "M8 2v4m8-4v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z" },
    { t: "تحديثات مجانية مدى الحياة", d: "تتغير الأدوات كل شهر — تدفع مرة واحدة وتحصل على كل إصدار جديد مجاناً، مع ملحقات موسمية حسب المواسم (الأعياد، الصيف…).", i: "M12 8v4l2.5 2.5M21 12a9 9 0 1 1-2.64-6.36M21 3v6h-6" }
  ];
  var chapters = [
    "لماذا الآن؟ الذكاء الاصطناعي والعمل الحر في المغرب 2026",
    "خريطة 30 يوم: من الصفر إلى أول عميل",
    "أفضل 40 أداة ذكاء اصطناعي مع السعر والتوافر بالعربية",
    "اختيار التخصص: كتابة، سوشيال، ترجمة، تصميم، أتمتة",
    "بناء ملفك الاحترافي على خمسات ومستقل ولينكدإن",
    "التسعير بالدرهم: جداول وأمثلة تفاوض حقيقية",
    "قوالب جاهزة: 12 رسالة عرض سعر ومتابعة وإقناع",
    "خطة محتوى 30 يوم للتسويق لنفسك مجاناً",
    "إدارة الوقت وإنجاز العمل بسرعة مع AI (وصولاً لجودة عالية)",
    "الأخطاء العشرة القاتلة للمستقل الجديد وكيف تتجنبها",
    "ذكاء اصطناعي بمسؤولية: السرية، الهلوسة، والحدود القانونية",
    "بعد أول عميل: رفع السعر، الحفاظ على العملاء، والتوسع"
  ];
  var faqs = [
    { q: "هل أحتاج خبرة برمجية أو تقنية؟", a: "لا نهائياً. كل الأدوات مشروحة من الصفر، والقوالب جاهزة للنسخ واللصق. إذا كنت تستعمل واتساب ويوتيوب فأنت جاهز تماماً." },
    { q: "هل الدليل مناسب لمن يتقن الفرنسية فقط؟", a: "نعم، أمثلة القوالب موجودة بالعربية والفرنسية، ومعظم الأدوات تدعم اللغتين." },
    { q: "ما هي مدة استلام الدليل بعد الطلب؟", a: "التسليم تلقائي وفوري بعد الدفع عبر رابط الدفع (Payhip/Gumroad): يصلك إيميل فيه رابط التحميل خلال دقائق." },
    { q: "ما هي سياسة استرجاع المال؟", a: "ضمان كامل خلال 14 يوماً من تاريخ الشراء — مراسلة واحدة على بريد الدعم ونعيد لك المبلغ كاملاً دون أسئلة." },
    { q: "هل سأربح مبلغاً معيناً بعد قراءة الدليل؟", a: "لا يستطيع أحد أن يضمن دخلك — النتائج تعتمد على التطبيق والجهد والسوق. ما نضمنه هو وضوح المسار، جودة الأدوات، وقوالب توفر عليك أشهر من التجربة." },
    { q: "هل سأحصل على تحديثات الأدوات الجديدة؟", a: "نعم — كل مشتري يحصل على كل الإصدارات والتحديثات المستقبلية مجاناً مدى الحياة." },
    { q: "كيف أدفع إذا لم تكن عندي بطاقة بنكية دولية؟", a: "يمكنك الدفع ببطاقة محلية مع Payhip/Gumroad، أو التواصل معنا عبر البريد ونرتب حلاً متاحاً في المغرب (تمت دراسة خيارات الدفع المحلي بعناية)." }
  ];

  function svgIcon(path) {
    return '<svg viewBox="0 0 24 24" fill="none" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="' + path + '"/></svg>';
  }
  var fg = document.getElementById("featuresGrid");
  if (fg) fg.innerHTML = features.map(function (f) {
    return '<article class="card"><div class="icon-bubble">' + svgIcon(f.i) + '</div><h3>' + f.t + '</h3><p>' + f.d + '</p></article>';
  }).join("");

  var cl = document.getElementById("chaptersList");
  if (cl) cl.innerHTML = chapters.map(function (c, i) {
    return '<li><span class="n">' + String(i + 1).padStart(2, "0") + "</span><span>" + c + "</span></li>";
  }).join("");

  var fl = document.getElementById("faqList");
  if (fl) fl.innerHTML = faqs.map(function (f, i) {
    return '<details' + (i === 0 ? " open" : "") + '><summary>' + f.q + '</summary><p>' + f.a + "</p></details>";
  }).join("");

  /* ---------- التنقل للجوال ---------- */
  var toggle = document.getElementById("navToggle");
  var links = document.getElementById("navLinks");
  if (toggle && links) toggle.addEventListener("click", function () { links.classList.toggle("open"); });

  /* ---------- Toast ---------- */
  var toastEl = document.getElementById("toast");
  function toast(msg) {
    if (!toastEl) return;
    toastEl.textContent = msg;
    toastEl.classList.add("show");
    setTimeout(function () { toastEl.classList.remove("show"); }, 4200);
  }

  /* ---------- أزرار الشراء ---------- */
  function goBuy() {
    if (CFG.buyUrl) {
      window.open(CFG.buyUrl, "_blank", "noopener,noreferrer");
      return;
    }
    toast("زر الدفع يُفعّل فور ربط مزوّد الدفع — سجّل الآن وستصلك دعوة بالشراء أولاً وبسعر الإطلاق.");
    var lead = document.getElementById("lead");
    if (lead) lead.scrollIntoView({ behavior: "smooth" });
  }
  ["buyBtnTop", "buyBtnPricing"].forEach(function (id) {
    var b = document.getElementById(id);
    if (b) b.addEventListener("click", goBuy);
  });

  /* ---------- التقاط UTM ---------- */
  function utm(param) {
    try { return new URLSearchParams(window.location.search).get(param) || null; } catch (e) { return null; }
  }

  /* ---------- نموذج التقاط العملاء ---------- */
  var LOCAL_KEY = "aarr_leads_local";
  var form = document.getElementById("leadForm");
  var msg = document.getElementById("formMsg");
  var submitBtn = document.getElementById("leadSubmit");

  function saveLocal(lead) {
    try {
      var arr = JSON.parse(localStorage.getItem(LOCAL_KEY) || "[]");
      arr.push(lead);
      localStorage.setItem(LOCAL_KEY, JSON.stringify(arr));
      return true;
    } catch (e) { return false; }
  }

  async function saveRemote(lead) {
    var url = (CFG.supabaseUrl || "").replace(/\/$/, "") + "/rest/v1/leads";
    var key = CFG.supabaseAnonKey || "";
    if (!url || !key) throw new Error("missing config");
    var res = await fetch(url, {
      method: "POST",
      headers: {
        "apikey": key,
        "Authorization": "Bearer " + key,
        "Content-Type": "application/json",
        "Prefer": "return=minimal"
      },
      body: JSON.stringify(lead)
    });
    if (!res.ok) throw new Error("HTTP " + res.status);
    return true;
  }

  if (form) form.addEventListener("submit", async function (ev) {
    ev.preventDefault();
    // فخ البوتات
    if (form.elements.company && form.elements.company.value) { setMsg("تعذر التسجيل — حاول مرة أخرى.", false); return; }

    var name = form.elements.full_name.value.trim();
    var email = form.elements.email.value.trim().toLowerCase();
    var phone = form.elements.whatsapp.value.trim();
    var consent = document.getElementById("fConsent").checked;

    if (name.length < 2) return setMsg("فضلاً، أدخل الاسم كاملاً.", false);
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]{2,}$/.test(email)) return setMsg("بريد إلكتروني غير صالح.", false);
    if (!consent) return setMsg("الموافقة على سياسة الخصوصية ضرورية لإرسال الهدية.", false);

    var lead = {
      full_name: name,
      email: email,
      whatsapp: phone || null,
      source: "landing",
      interest: "ebook-ai-freelance",
      consent: consent,
      utm_source: utm("utm_source"),
      utm_medium: utm("utm_medium"),
      utm_campaign: utm("utm_campaign")
    };

    submitBtn.disabled = true;
    setMsg("جاري الحفظ…", true, true);
    var remote = false;
    try { await saveRemote(lead); remote = true; } catch (e) { remote = false; }
    var local = saveLocal(lead);

    if (remote) {
      setMsg("تم بنجاح! ✅ تحقق من بريدك — وصلتك الهدية ورابط القائمة التأسيسية.", true);
      toast("أهلاً بك في عائلة AARR!");
      form.reset();
    } else if (local) {
      setMsg("حُفظت بياناتك محلياً على هذا الجهاز. تعذر الاتصال بالخادم الآن — ستجد مانسخة في لوحة العمليات، وستُرسل تلقائياً عند تفعيل الاتصال.", false);
    } else {
      setMsg("حدث خطأ غير متوقع. أعد المحاولة، أو راسلنا على " + (CFG.supportEmail || "البريد") + ".", false);
    }
    submitBtn.disabled = false;
  });

  function setMsg(text, ok, neutral) {
    if (!msg) return;
    msg.textContent = text;
    msg.className = "form-msg " + (neutral ? "" : ok ? "ok" : "err");
  }

  /* ---------- بريد الدعم في التذييل ---------- */
  var fe = document.getElementById("footEmail");
  if (fe && CFG.supportEmail) { fe.textContent = CFG.supportEmail; fe.href = "mailto:" + CFG.supportEmail; }
})();
