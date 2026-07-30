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
     Les formulaires sont branchés sur Netlify Forms (attribut data-netlify).
     Une fois le site en ligne sur Netlify, chaque envoi arrive dans ton
     tableau Netlify + par email (à régler dans Netlify → Forms → Notifications
     → ajouter wartimemail@gmail.com).
     En local / aperçu (pas d'hébergeur derrière), on bascule sur la messagerie
     du visiteur, pré-remplie vers cette adresse : */
  var CONTACT_EMAIL = "wartimemail@gmail.com";

  function show(form, success) {
    form.style.display = "none";
    success.classList.add("is-visible");
  }

  function mailtoLink(subject, body) {
    return "mailto:" + CONTACT_EMAIL +
      "?subject=" + encodeURIComponent(subject) +
      "&body=" + encodeURIComponent(body);
  }

  /* Encode le formulaire en x-www-form-urlencoded (format attendu par Netlify),
     y compris le champ caché form-name. */
  function encodeForm(form) {
    var data = new FormData(form), pairs = [];
    data.forEach(function (v, k) {
      pairs.push(encodeURIComponent(k) + "=" + encodeURIComponent(v));
    });
    return pairs.join("&");
  }

  function submitNetlify(form) {
    return fetch(form.getAttribute("action") || "/", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: encodeForm(form)
    }).then(function (r) { if (!r.ok) throw new Error("post failed"); });
  }

  /* Formulaire CONTACT — la vraie demande. */
  (function () {
    var form = document.getElementById("contact-form");
    var success = document.getElementById("contact-success");
    if (!form || !success) return;

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (!form.checkValidity()) { form.reportValidity(); return; }

      submitNetlify(form)
        .then(function () { show(form, success); })
        .catch(function () {
          // Pas d'hébergeur derrière (aperçu / local) → on ouvre la messagerie.
          var subject = "Nouveau contact — " + (form.nom.value || "");
          var body =
            "Nom : " + form.nom.value + "\n" +
            "Email : " + form.email.value + "\n" +
            "Activité : " + form.activite.value + "\n\n" +
            "Ce qui n'avance plus aujourd'hui :\n" + form.blocage.value;
          window.location.href = mailtoLink(subject, body);
          success.textContent =
            "Ton message est prêt dans ta messagerie. Clique sur Envoyer — je te réponds sous 48 heures.";
          show(form, success);
        });
    });
  })();

  /* Formulaire DOCTRINE — le visiteur veut le PDF : on le lui donne toujours,
     et on capture le prénom + email via Netlify en arrière-plan. */
  (function () {
    var form = document.getElementById("doctrine-form");
    var success = document.getElementById("doctrine-success");
    if (!form || !success) return;

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (!form.checkValidity()) { form.reportValidity(); return; }
      submitNetlify(form).catch(function () {}).then(function () { show(form, success); });
    });
  })();

  /* ---------- Lecture express — moteur de règles (méthode WarTime) ----------
     Les 10 réponses passent dans les règles ci-dessous et sortent une lecture
     teaser : alignement du patron + premier domino. Le reste (pôle rentable,
     actif sous-exploité, plan) est réservé à la vraie lecture payante. */
  (function () {
    var form = document.getElementById("lecture");
    var result = document.getElementById("lecture-result");
    if (!form || !result) return;

    // TODO: coller ici le lien de paiement Stripe (Payment Link) quand le
    // compte est prêt. Tant que c'est vide, le bouton mène au formulaire.
    var STRIPE_LINK = "";
    if (STRIPE_LINK) document.getElementById("lr-pay").setAttribute("href", STRIPE_LINK);

    var AMB = {
      sansmoi: "une boîte qui tourne sans toi",
      marque: "devenir une référence",
      scaler: "scaler",
      vivre: "bien vivre de ton truc"
    };
    var JOUR = { produire: "produire", vendre: "vendre", ops: "gérer l'opérationnel", piloter: "piloter" };

    function val(name) {
      var el = form.querySelector('input[name="' + name + '"]:checked');
      return el ? el.value : null;
    }

    /* Lecture 1 — alignement du patron : ambition déclarée vs journées réelles. */
    function readAlignement(a, j) {
      if (j === "piloter")
        return "Bonne posture : tu pilotes, tu fais pas tout toi-même. Reste à voir si la machine derrière suit vraiment — c'est là que je regarde.";
      if ((a === "sansmoi" || a === "scaler" || a === "marque") && (j === "produire" || j === "ops"))
        return "Désaligné. Tu veux " + AMB[a] + ", mais tes journées, c'est " + JOUR[j] + ". Tant que tout passe par tes mains, tu construis pas une entreprise — tu t'es créé un job. C'est ça qui te tient au plafond.";
      if (a === "vivre" && (j === "produire" || j === "ops"))
        return "Au moins c'est cohérent. Mais « bien vivre » a un plafond bas — et je parie que tu le sens déjà venir.";
      if (j === "vendre")
        return "Tu passes tes journées à vendre. Ça remplit la caisse — mais si c'est QUE toi qui vends, la boîte s'arrête avec toi.";
      return "Ton ambition et tes journées se tiennent à peu près. Le désalignement est plus fin — c'est là que ma vraie lecture creuse.";
    }

    /* Lecture 2 — le premier domino : prospect / message / promesse via les chiffres. */
    function readDomino(v) {
      var aud = +v.q3, ventes = +v.q4, conv = +v.q5, ret = +v.q6, prix = +v.q7, prosp = +v.q8, amb = v.q1;
      if (aud >= 2 && (ventes <= 1 || conv <= 1))
        return "T'as l'attention, pas la vente. Grosse audience, faibles ventes — tu parles aux mauvaises personnes, ou tu leur promets le mauvais truc. C'est PAS un problème d'audience.";
      if (conv >= 2 && ret === 0)
        return "Tu convertis, mais personne revient. Ta promesse dépasse ton produit, ou tu vends à des gens de passage. Tu remplis un seau percé.";
      if ((amb === "scaler" || amb === "sansmoi") && prix <= 1)
        return "Tu veux grossir, mais à ce prix il te faut un volume de dingue. Le blocage, c'est ton offre — monte en gamme ou change de modèle.";
      if ((amb === "scaler" || amb === "sansmoi" || amb === "marque") && prosp === 0)
        return "Tu veux que ça grossisse, mais tu vas pas chercher le client. Tu attends qu'on vienne. Tu veux le résultat sans le geste.";
      if (aud <= 1 && ventes <= 1)
        return "T'as pas encore de signal clair. Avant d'optimiser quoi que ce soit, il te faut UN canal qui ramène, répétable. Le reste vient après.";
      return "Tes fondations tiennent debout. Le vrai domino est plus fin — et c'est exactement là que ma lecture complète rentre dans le détail.";
    }

    /* Le titre : le signal le plus fort, en une phrase. */
    function headline(a, j, v) {
      if ((a === "sansmoi" || a === "scaler" || a === "marque") && (j === "produire" || j === "ops"))
        return "Tu t'es créé un job, pas une entreprise.";
      if (+v.q3 >= 2 && (+v.q4 <= 1 || +v.q5 <= 1)) return "T'as l'attention. Pas la vente.";
      if (+v.q5 >= 2 && +v.q6 === 0) return "Tu remplis un seau percé.";
      if (+v.q3 <= 1 && +v.q4 <= 1) return "Pas encore de signal. Faut un canal.";
      return "Les fondations tiennent. Le levier est ailleurs.";
    }

    var hint = document.getElementById("lr-hint");

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var need = ["q1", "q2", "q3", "q4", "q5", "q6", "q7", "q8", "q9"];
      var missing = null;
      for (var i = 0; i < need.length; i++) {
        if (!val(need[i])) { missing = need[i]; break; }
      }
      if (missing) {
        if (hint) hint.hidden = false;
        var fs = form.querySelector('input[name="' + missing + '"]');
        if (fs && fs.closest) {
          var block = fs.closest("fieldset");
          if (block) block.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "center" });
        }
        return;
      }
      if (hint) hint.hidden = true;

      var v = {};
      need.forEach(function (n) { v[n] = val(n); });
      var textEl = form.querySelector('[name="q10"]');
      v.q10 = textEl ? textEl.value : "";

      document.getElementById("lr-headline").textContent = headline(v.q1, v.q2, v);
      document.getElementById("lr-align").textContent = readAlignement(v.q1, v.q2);
      document.getElementById("lr-domino").textContent = readDomino(v);

      var echo = document.getElementById("lr-echo");
      if (v.q10 && v.q10.trim()) {
        echo.textContent = "Tu dis vendre : « " + v.q10.trim() + " ». On verra si tes chiffres racontent la même histoire.";
        echo.hidden = false;
      } else {
        echo.hidden = true;
      }

      result.hidden = false;
      result.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
    });
  })();
})();
