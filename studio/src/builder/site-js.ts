/**
 * The only JavaScript generated sites run — written and reviewed by Maison, never by the AI.
 * Progressive enhancement: navigation and forms also work without it.
 */
export const SITE_JS = `(function () {
  "use strict";
  var store = {
    get: function (k) { try { return window.localStorage.getItem(k); } catch (e) { return null; } },
    set: function (k, v) { try { window.localStorage.setItem(k, v); } catch (e) {} }
  };

  // Remember the visitor's language choice and honour it on later visits to the default-language pages.
  document.querySelectorAll("[data-set-lang]").forEach(function (a) {
    a.addEventListener("click", function () { store.set("site-lang", a.getAttribute("data-set-lang")); });
  });
  var body = document.body;
  var pref = store.get("site-lang");
  if (pref && body.dataset.lang === body.dataset.defaultLang && pref !== body.dataset.lang) {
    var alt = document.querySelector('[data-set-lang="' + pref.replace(/[^a-z]/g, "") + '"]');
    if (alt && alt.getAttribute("href")) window.location.replace(alt.getAttribute("href"));
  }

  // Close disclosure menus with Escape or when a link is chosen; return focus to the toggle.
  document.querySelectorAll("details[data-nav], details[data-lang-menu]").forEach(function (d) {
    d.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && d.open) { d.open = false; var s = d.querySelector("summary"); if (s) s.focus(); }
    });
    d.querySelectorAll("a").forEach(function (a) { a.addEventListener("click", function () { d.open = false; }); });
  });

  // Forms: client-side validation with accessible messages, one submission at a time.
  document.querySelectorAll("form[data-form]").forEach(function (form) {
    var sid = form.querySelector('[name="sid"]');
    var t = form.querySelector('[name="t"]');
    if (sid) sid.value = (window.crypto && crypto.randomUUID) ? crypto.randomUUID() : String(Date.now()) + Math.random().toString(16).slice(2);
    if (t) t.value = String(Date.now());
    var status = form.querySelector(".form-status");
    var button = form.querySelector('button[type="submit"]');
    var msg = function (k) { return form.getAttribute("data-msg-" + k) || ""; };
    var setError = function (field, text) {
      var err = document.getElementById(field.id + "-err");
      if (text) { field.setAttribute("aria-invalid", "true"); if (err) { err.textContent = text; err.hidden = false; } }
      else { field.removeAttribute("aria-invalid"); if (err) { err.textContent = ""; err.hidden = true; } }
    };
    var validate = function () {
      var first = null;
      form.querySelectorAll("input:not([type=hidden]):not([name=company_website]), textarea").forEach(function (f) {
        var v = f.value.trim(), e = "";
        if (f.required && !v) e = msg("required");
        else if (f.type === "email" && v && !/^[^\\s@]+@[^\\s@]+\\.[^\\s@]{2,}$/.test(v)) e = msg("email");
        else if (f.maxLength > 0 && v.length > f.maxLength) e = msg("long");
        setError(f, e);
        if (e && !first) first = f;
      });
      return first;
    };
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (form.dataset.busy === "1") return;
      var bad = validate();
      if (bad) { if (status) status.textContent = msg("fix"); bad.focus(); return; }
      form.dataset.busy = "1";
      if (button) button.disabled = true;
      if (status) status.textContent = msg("sending");
      var data = {};
      new FormData(form).forEach(function (v, k) { data[k] = String(v); });
      fetch(form.getAttribute("action"), { method: "POST", headers: { "Content-Type": "application/json", "Accept": "application/json" }, body: JSON.stringify(data) })
        .then(function (r) { return r.json().catch(function () { return {}; }).then(function (j) { return { ok: r.ok, status: r.status, body: j }; }); })
        .then(function (res) {
          if (res.ok) {
            if (status) status.textContent = (res.body && res.body.message) || msg("sent");
            form.querySelectorAll("input:not([type=hidden]), textarea").forEach(function (f) { f.value = ""; });
            if (sid) sid.value = String(Date.now()) + Math.random().toString(16).slice(2);
          } else if (res.status === 429) { if (status) status.textContent = msg("many"); }
          else if (res.status === 503) { if (status) status.textContent = msg("unavailable"); }
          else if (res.status === 422 && res.body && res.body.fields) {
            Object.keys(res.body.fields).forEach(function (name) { var f = form.querySelector('[name="' + name.replace(/[^a-z_]/g, "") + '"]'); if (f) setError(f, msg("required")); });
            if (status) status.textContent = msg("fix");
          } else { if (status) status.textContent = msg("failed"); }
        })
        .catch(function () { if (status) status.textContent = msg("failed"); })
        .then(function () { form.dataset.busy = "0"; if (button) button.disabled = false; });
    });
  });
})();
`;
