/* =========================================================
   WARTIME CONSULTING — comportements
   - Séquence d'ouverture du hero
   - Révélation douce au scroll
   - Menu mobile
   - Formulaires (succès local, endpoint à brancher)
   Tout respecte prefers-reduced-motion.
   ========================================================= */
(function () {
  "use strict";

  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Hero : lancer la séquence ---------- */
  var hero = document.getElementById("hero");
  if (hero) {
    if (reduce) {
      hero.classList.add("play"); // états finaux, sans animation (géré en CSS)
    } else {
      // Laisser le layout se poser avant de jouer
      window.requestAnimationFrame(function () {
        window.requestAnimationFrame(function () {
          hero.classList.add("play");
        });
      });
    }
  }

  /* ---------- Révélation au scroll ---------- */
  var reveal = document.querySelectorAll(".reveal");
  if (reduce || !("IntersectionObserver" in window)) {
    reveal.forEach(function (el) { el.classList.add("is-in"); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-in");
          io.unobserve(entry.target);
        }
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.12 });
    reveal.forEach(function (el) { io.observe(el); });
  }

  /* ---------- Menu mobile ---------- */
  var nav = document.querySelector(".nav");
  var toggle = nav && nav.querySelector(".nav__toggle");
  if (toggle) {
    toggle.addEventListener("click", function () {
      var open = nav.classList.toggle("nav--open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
    // Refermer après clic sur un lien
    nav.querySelectorAll(".nav__links a").forEach(function (a) {
      a.addEventListener("click", function () {
        nav.classList.remove("nav--open");
        toggle.setAttribute("aria-expanded", "false");
      });
    });
  }

  /* ---------- Formulaires ----------
     Adresse de réception de tous les messages : */
  var CONTACT_EMAIL = "wartimemail@gmail.com";

  /* Envoi « propre » (le visiteur reste sur la page, le message part tout seul).
     Laisser vide tant que Formspree n'est pas configuré : on ouvre alors la
     messagerie du visiteur, pré-remplie vers CONTACT_EMAIL.
     Pour activer : créer un formulaire gratuit sur formspree.io avec
     wartimemail@gmail.com, puis coller ici le lien fourni (https://formspree.io/f/xxxxxxx). */
  var FORM_ENDPOINT = "";

  function show(form, success) {
    form.style.display = "none";
    success.classList.add("is-visible");
  }

  function mailtoLink(subject, body) {
    return "mailto:" + CONTACT_EMAIL +
      "?subject=" + encodeURIComponent(subject) +
      "&body=" + encodeURIComponent(body);
  }

  function postToEndpoint(form) {
    return fetch(FORM_ENDPOINT, {
      method: "POST",
      body: new FormData(form),
      headers: { Accept: "application/json" }
    });
  }

  /* Formulaire CONTACT — la vraie demande. */
  (function () {
    var form = document.getElementById("contact-form");
    var success = document.getElementById("contact-success");
    if (!form || !success) return;

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (!form.checkValidity()) { form.reportValidity(); return; }

      var subject = "Nouveau contact — " + (form.nom.value || "");
      var body =
        "Nom : " + form.nom.value + "\n" +
        "Email : " + form.email.value + "\n" +
        "Activité : " + form.activite.value + "\n\n" +
        "Ce qui n'avance plus aujourd'hui :\n" + form.blocage.value;

      if (FORM_ENDPOINT) {
        postToEndpoint(form)
          .then(function () { show(form, success); })
          .catch(function () { window.location.href = mailtoLink(subject, body); });
      } else {
        // Sans Formspree : on ouvre la messagerie du visiteur vers wartimemail@gmail.com
        window.location.href = mailtoLink(subject, body);
        success.textContent =
          "Votre message est prêt dans votre messagerie. Cliquez sur Envoyer — je réponds sous 48 heures.";
        show(form, success);
      }
    });
  })();

  /* Formulaire DOCTRINE — le visiteur veut le PDF : on le lui donne toujours.
     Si Formspree est configuré, on capture aussi le prénom + email en arrière-plan. */
  (function () {
    var form = document.getElementById("doctrine-form");
    var success = document.getElementById("doctrine-success");
    if (!form || !success) return;

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (!form.checkValidity()) { form.reportValidity(); return; }
      if (FORM_ENDPOINT) { postToEndpoint(form).catch(function () {}); }
      show(form, success);
    });
  })();
})();
