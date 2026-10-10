(function () {
  "use strict";
  var C = window.SITE_CONFIG || {};
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  /* ---------- Toast ---------- */
  var toastEl = $("#toast"), toastTimer;
  function toast(msg) {
    toastEl.textContent = msg;
    toastEl.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toastEl.hidden = true; }, 4200);
  }

  /* ---------- Footer year ---------- */
  $("#year").textContent = new Date().getFullYear();

  /* ---------- Mobile nav ---------- */
  var nav = $("#site-nav"), toggle = $(".nav-toggle");
  function setNav(open) {
    nav.classList.toggle("open", open);
    toggle.setAttribute("aria-expanded", String(open));
    toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
  }
  toggle.addEventListener("click", function () { setNav(!nav.classList.contains("open")); });
  $$("a", nav).forEach(function (a) { a.addEventListener("click", function () { setNav(false); }); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") setNav(false); });

  /* ---------- Active nav link on scroll ---------- */
  if ("IntersectionObserver" in window) {
    var links = {};
    $$("a", nav).forEach(function (a) { links[a.getAttribute("href").slice(1)] = a; });
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting && links[en.target.id]) {
          $$("a", nav).forEach(function (a) { a.classList.remove("active"); a.removeAttribute("aria-current"); });
          links[en.target.id].classList.add("active");
          links[en.target.id].setAttribute("aria-current", "true");
        }
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    Object.keys(links).forEach(function (id) { var s = document.getElementById(id); if (s) io.observe(s); });
  }

  /* ---------- Contact links from config ---------- */
  var missing = [];
  function mailHref() { return C.email ? "mailto:" + C.email : ""; }
  var urls = { email: mailHref(), linkedin: C.linkedin || "", github: C.github || "" };
  var labels = {
    email: C.email || "",
    linkedin: (C.linkedin || "").replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, ""),
    github: (C.github || "").replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "")
  };
  var hints = {
    email: "Add your email in js/config.js",
    linkedin: "Add your LinkedIn URL in js/config.js",
    github: "Add your GitHub URL in js/config.js"
  };

  $$("[data-link]").forEach(function (a) {
    var k = a.getAttribute("data-link");
    if (urls[k]) {
      a.href = urls[k];
      if (k !== "email") { a.target = "_blank"; a.rel = "noopener noreferrer"; }
    } else {
      a.classList.add("is-unset");
      a.title = hints[k];
      if (missing.indexOf(k) < 0) missing.push(k);
    }
  });

  $$("[data-contact]").forEach(function (li) {
    var k = li.getAttribute("data-contact"), slot = $(".slot", li);
    if (urls[k]) {
      var a = document.createElement("a");
      a.href = urls[k];
      a.textContent = labels[k];
      if (k !== "email") { a.target = "_blank"; a.rel = "noopener noreferrer"; }
      slot.appendChild(a);
    } else {
      var s = document.createElement("span");
      s.className = "hint";
      s.textContent = hints[k];
      slot.appendChild(s);
    }
  });

  /* ---------- Project buttons ---------- */
  $$("[data-project]").forEach(function (a) {
    var p = C.projects && C.projects[a.getAttribute("data-project")];
    var url = p && p[a.getAttribute("data-kind")];
    var span = $("span", a);
    if (url) {
      a.href = url; a.target = "_blank"; a.rel = "noopener noreferrer";
      a.removeAttribute("aria-disabled");
    } else {
      span.textContent += " (coming soon)";
      a.addEventListener("click", function (e) {
        e.preventDefault();
        toast("This link has not been added yet. Add it in js/config.js.");
      });
    }
  });

  /* ---------- Project screenshots replace mockups when present ---------- */
  $$(".shot[data-shot]").forEach(function (box) {
    var img = new Image();
    img.onload = function () {
      img.alt = box.getAttribute("data-alt") || "";
      img.loading = "lazy";
      box.innerHTML = "";
      box.appendChild(img);
    };
    img.src = box.getAttribute("data-shot");
  });

  /* ---------- Profile photo ---------- */
  var photo = $("#profile-photo"), initials = $(".photo-initials"),
      photoInput = $("#photo-input"), photoBtn = $("#photo-btn"),
      photoReset = $("#photo-reset"), photoNote = $("#photo-note"),
      KEY = "portfolio-photo-preview";

  function showPhoto(src) { photo.src = src; photo.hidden = false; initials.hidden = true; }
  function hidePhoto() { photo.removeAttribute("src"); photo.hidden = true; initials.hidden = false; }

  var preview = null;
  try { preview = localStorage.getItem(KEY); } catch (e) {}

  function loadSitePhoto() {
    var t = new Image();
    t.onload = function () { showPhoto(C.photoFile); photoNote.hidden = true; };
    t.onerror = function () { hidePhoto(); photoNote.hidden = false; };
    t.src = C.photoFile || "";
  }
  if (preview) { showPhoto(preview); photoReset.hidden = false; } else { loadSitePhoto(); }

  photoBtn.addEventListener("click", function () { photoInput.click(); });
  photoInput.addEventListener("change", function () {
    var f = photoInput.files && photoInput.files[0];
    if (!f) return;
    if (!/^image\//.test(f.type)) { toast("Choose an image file (JPG or PNG)."); return; }
    var reader = new FileReader();
    reader.onload = function () {
      var im = new Image();
      im.onload = function () {
        var max = 600, r = Math.min(1, max / Math.max(im.width, im.height));
        var cv = document.createElement("canvas");
        cv.width = Math.round(im.width * r); cv.height = Math.round(im.height * r);
        cv.getContext("2d").drawImage(im, 0, 0, cv.width, cv.height);
        var data = cv.toDataURL("image/jpeg", 0.86);
        showPhoto(data);
        photoReset.hidden = false;
        photoNote.hidden = false;
        try { localStorage.setItem(KEY, data); } catch (e) {}
        toast("Photo preview updated on this browser only.");
      };
      im.src = reader.result;
    };
    reader.readAsDataURL(f);
  });
  photoReset.addEventListener("click", function () {
    try { localStorage.removeItem(KEY); } catch (e) {}
    photoReset.hidden = true;
    loadSitePhoto();
  });

  /* ---------- Resume ---------- */
  var resumeUrl = C.resumeFile || "";
  var resumeLinks = $$("[data-resume-link]"), openLink = $("[data-resume-open]");
  var resumeMissing = false;

  resumeLinks.forEach(function (a) {
    a.href = resumeUrl || "#";
    if (a.hasAttribute("download")) a.setAttribute("download", resumeUrl.split("/").pop());
  });
  if (openLink) openLink.href = resumeUrl || "#";

  function guardMissing(e) {
    if (resumeMissing) {
      e.preventDefault();
      toast("The resume PDF has not been added yet. Save it as " + resumeUrl + ".");
    }
  }
  resumeLinks.concat(openLink ? [openLink] : []).forEach(function (a) { a.addEventListener("click", guardMissing); });

  if (resumeUrl && /^https?:/.test(location.protocol)) {
    fetch(resumeUrl, { method: "HEAD" }).then(function (res) {
      if (!res.ok) { resumeMissing = true; return; }
      var paper = $("#resume-preview");
      if (paper) {
        var f = document.createElement("iframe");
        f.src = resumeUrl + "#toolbar=0&view=FitH";
        f.title = "Resume preview (PDF)";
        f.loading = "lazy";
        paper.innerHTML = "";
        paper.classList.add("has-pdf");
        paper.appendChild(f);
      }
    }).catch(function () {});
  }

  /* ---------- Contact form ---------- */
  var form = $("#contact-form"), statusEl = $("#form-status");
  function setStatus(msg, cls) { statusEl.textContent = msg; statusEl.className = "form-status" + (cls ? " " + cls : ""); }
  function validate() {
    var ok = true;
    ["name", "email", "message"].forEach(function (n) {
      var inp = form.elements[n], err = $("#cf-" + n + "-err"), field = inp.parentNode;
      var good = n === "email" ? /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(inp.value.trim()) : inp.value.trim().length > 0;
      field.classList.toggle("invalid", !good);
      err.hidden = good;
      inp.setAttribute("aria-invalid", String(!good));
      if (!good) { ok = false; }
    });
    return ok;
  }
  form.addEventListener("submit", function (e) {
    e.preventDefault();
    setStatus("");
    if (!validate()) { setStatus("Fix the highlighted fields and try again.", "bad"); return; }
    if (form.elements._gotcha.value) return; // spam trap

    var data = { name: form.elements.name.value.trim(), email: form.elements.email.value.trim(), message: form.elements.message.value.trim() };

    if (C.formEndpoint) {
      setStatus("Sending...");
      fetch(C.formEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Accept": "application/json" },
        body: JSON.stringify(data)
      }).then(function (res) {
        if (!res.ok) throw new Error("bad status");
        form.reset();
        setStatus("Message sent. Thank you, I will reply soon.", "ok");
      }).catch(function () {
        setStatus("The message could not be sent. Please email me directly instead.", "bad");
      });
    } else if (C.email) {
      var body = data.message + "\n\n" + data.name + "\n" + data.email;
      location.href = "mailto:" + C.email + "?subject=" + encodeURIComponent("Portfolio enquiry from " + data.name) + "&body=" + encodeURIComponent(body);
      setStatus("Your email app should open with the message ready to send.", "ok");
    } else {
      setStatus("The form is not connected yet. Add an email or form endpoint in js/config.js.", "bad");
    }
  });

  if (missing.length && window.console) {
    console.info("[Portfolio setup] Still to add in js/config.js:", missing.join(", "));
  }
})();
