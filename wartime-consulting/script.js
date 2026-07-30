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
            "Votre message est prêt dans votre messagerie. Cliquez sur Envoyer — on vous répond sous 48 heures.";
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
      sansmoi: "une entreprise qui tourne sans vous",
      marque: "devenir une référence",
      scaler: "changer de dimension",
      vivre: "bien vivre de votre activité"
    };

    function has(arr, x) { return arr && arr.indexOf(x) !== -1; }
    function val(name) {
      var el = form.querySelector('input[name="' + name + '"]:checked');
      return el ? el.value : null;
    }
    function multi(name) {
      return Array.prototype.map.call(
        form.querySelectorAll('input[name="' + name + '"]:checked'),
        function (el) { return el.value; }
      );
    }

    /* Limite les questions multi-choix à 2 réponses (désactive le reste). */
    Array.prototype.forEach.call(form.querySelectorAll(".quiz__q--multi"), function (g) {
      var max = parseInt(g.getAttribute("data-max") || "2", 10);
      var boxes = g.querySelectorAll('input[type="checkbox"]');
      g.addEventListener("change", function () {
        var n = g.querySelectorAll('input[type="checkbox"]:checked').length;
        Array.prototype.forEach.call(boxes, function (b) {
          if (!b.checked) b.disabled = (n >= max);
        });
      });
    });

    /* Lecture 1 — alignement : ambition déclarée vs rôle réel au quotidien. */
    function readAlignement(a, jours) {
      var prod = has(jours, "produire"), ops = has(jours, "ops"),
          pil = has(jours, "piloter"), vend = has(jours, "vendre");
      if (pil && !prod && !ops)
        return "Bonne posture : vous pilotez, vous ne faites pas tout vous-même. Reste à voir si la machine derrière suit vraiment — c'est là qu'on regarde.";
      if ((a === "sansmoi" || a === "scaler" || a === "marque") && (prod || ops)) {
        var quoi = prod ? "vous produisez encore vous-même" : "vous gérez encore l'opérationnel vous-même";
        return "Désaligné. Vous voulez " + AMB[a] + ", mais " + quoi + ". Tant que tout passe par vos mains, vous vous êtes créé un job, pas une entreprise. C'est ça qui vous tient au plafond.";
      }
      if (a === "vivre" && (prod || ops))
        return "Au moins c'est cohérent. Mais « bien vivre » a un plafond bas — et on parie que vous le sentez déjà venir.";
      if (vend && !prod && !ops)
        return "Vous passez vos journées à vendre. Ça remplit la caisse — mais si c'est vous seul qui vendez, l'entreprise s'arrête avec vous.";
      return "Votre ambition et vos journées se tiennent à peu près. Le désalignement est plus fin — c'est là que notre vraie lecture creuse.";
    }

    /* Lecture 2 — le premier domino, lu dans les chiffres. */
    function readDomino(v) {
      var aud = +v.q3, ca = +v.q4, marge = v.q5, conv = v.q6, fid = v.q7,
          panier = +v.q8, canaux = v.q9, amb = v.q1;
      var veutGrandir = (amb === "scaler" || amb === "sansmoi" || amb === "marque");
      var actif = has(canaux, "reseaux") || has(canaux, "demarche");

      if (ca >= 2 && marge === "0")
        return "Gros chiffre, marge écrasée. Vous travaillez pour le décor : le vrai blocage, c'est votre modèle et vos coûts — pas votre volume.";
      if (marge === "nsp")
        return "Vous ne connaissez pas votre marge nette. C'est le premier chiffre à tenir : sans lui, vous pilotez à l'aveugle. On commence par là.";
      if (aud >= 2 && (ca <= 1 || conv === "0" || conv === "nsp"))
        return "Vous avez l'attention, pas la vente. Beaucoup de monde vous découvre, peu achètent — vous parlez aux mauvaises personnes, ou vous leur promettez le mauvais truc. Ce n'est PAS un problème d'audience.";
      if ((conv === "2" || conv === "3") && (fid === "0" || fid === "nsp"))
        return "Vous convertissez, mais personne ne revient. Votre promesse dépasse votre produit, ou vous vendez à des gens de passage. Vous remplissez un seau percé.";
      if ((amb === "scaler" || amb === "sansmoi") && panier <= 1)
        return "Vous voulez grossir, mais à ce panier il vous faut un volume énorme. Le blocage, c'est votre offre — montez en gamme ou changez de modèle.";
      if (veutGrandir && has(canaux, "rien") && !actif)
        return "Vous voulez que ça grossisse, mais rien ne va chercher le client. Vous attendez. On ne passe pas un cap en attendant.";
      if (veutGrandir && !actif && (has(canaux, "boa") || has(canaux, "passage")))
        return "Vous dépendez d'un canal que vous ne contrôlez pas — le bouche-à-oreille, le passage. Pour changer de dimension, il vous faut un canal que VOUS actionnez.";
      if (aud <= 1 && ca <= 1)
        return "Vous n'avez pas encore de signal clair. Avant d'optimiser quoi que ce soit, il vous faut UN canal qui ramène, répétable. Le reste vient après.";
      return "Vos fondations tiennent debout. Le vrai domino est plus fin — et c'est exactement là que notre lecture complète rentre dans le détail.";
    }

    /* Le titre : le signal le plus fort, en une phrase. */
    function headline(a, jours, v) {
      var prod = has(jours, "produire"), ops = has(jours, "ops");
      if ((a === "sansmoi" || a === "scaler" || a === "marque") && (prod || ops))
        return "Vous vous êtes créé un job, pas une entreprise.";
      if (+v.q4 >= 2 && v.q5 === "0") return "Vous travaillez pour le décor.";
      if (v.q5 === "nsp") return "Vous pilotez à l'aveugle.";
      if (+v.q3 >= 2 && (+v.q4 <= 1 || v.q6 === "0" || v.q6 === "nsp")) return "Vous avez l'attention. Pas la vente.";
      if ((v.q6 === "2" || v.q6 === "3") && (v.q7 === "0" || v.q7 === "nsp")) return "Vous remplissez un seau percé.";
      if (+v.q3 <= 1 && +v.q4 <= 1) return "Pas encore de signal. Il vous faut un canal.";
      return "Les fondations tiennent. Le levier est ailleurs.";
    }

    var hint = document.getElementById("lr-hint");
    var radios = ["q1", "q3", "q4", "q5", "q6", "q7", "q8", "q10"];
    var groups = ["q2", "q9"];

    form.addEventListener("submit", function (e) {
      e.preventDefault();

      var missing = null, i;
      for (i = 0; i < radios.length; i++) { if (!val(radios[i])) { missing = radios[i]; break; } }
      if (!missing) { for (i = 0; i < groups.length; i++) { if (multi(groups[i]).length === 0) { missing = groups[i]; break; } } }

      if (missing) {
        if (hint) hint.hidden = false;
        var el = form.querySelector('[name="' + missing + '"]');
        var block = el && el.closest ? el.closest("fieldset") : null;
        if (block) block.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "center" });
        return;
      }
      if (hint) hint.hidden = true;

      var v = {};
      radios.forEach(function (n) { v[n] = val(n); });
      v.q2 = multi("q2");
      v.q9 = multi("q9");
      var textEl = form.querySelector('[name="q11"]');
      v.q11 = textEl ? textEl.value : "";

      document.getElementById("lr-headline").textContent = headline(v.q1, v.q2, v);
      document.getElementById("lr-align").textContent = readAlignement(v.q1, v.q2);
      document.getElementById("lr-domino").textContent = readDomino(v);

      var echo = document.getElementById("lr-echo");
      if (v.q11 && v.q11.trim()) {
        echo.textContent = "Vous ciblez : « " + v.q11.trim() + " ». On verra si vos chiffres racontent la même histoire.";
        echo.hidden = false;
      } else {
        echo.hidden = true;
      }

      result.hidden = false;
      result.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
    });
  })();
})();
