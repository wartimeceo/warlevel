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
            "Votre message est prêt dans votre messagerie. Cliquez sur Envoyer — nous vous répondons sous 48 heures.";
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

    /* =====================================================================
       Moteur WarTime — nous ne cherchons pas ce qui ne fonctionne pas,
       nous cherchons ce qui se contredit. Chaque lecture raconte une
       histoire en quatre temps :
         1. Ce que vous cherchez à construire  (l'ambition)
         2. Ce que vos réponses racontent       (la contradiction)
         3. Ce que cela produit                 (la conséquence)
         4. Ce que nous regarderions ensuite    (la suite, honnête)
       + la maturité du système : dépendante → structurée → scalable.
       ===================================================================== */

    /* Ce que vous cherchez à construire — l'ambition, reformulée. */
    function poursuit(v) {
      return {
        sansmoi: "Une entreprise qui tourne sans vous.",
        marque:  "Une marque, une référence dans votre secteur.",
        scaler:  "Changer d'échelle, franchir un vrai palier.",
        vivre:   "Une activité qui vous fait vivre sereinement."
      }[v.q1] || "Passer votre prochain cap.";
    }

    /* Les contradictions possibles, par ordre de gravité. Le moteur les
       teste TOUTES : il en révèle une (la dominante) et tease les autres.
       Le cerveau veut la suite — c'est ce qui donne envie du diagnostic. */
    var DETECTORS = [
      { // 1. Le fondateur contredit l'entreprise qu'il dit vouloir.
        label: "La dépendance au fondateur",
        test: function (v) {
          var g = v.q2, veut = (v.q1 === "scaler" || v.q1 === "sansmoi" || v.q1 === "marque");
          return veut && (has(g, "produire") || has(g, "ops"));
        },
        build: function (v) {
          var g = v.q2, fait = [];
          if (has(g, "produire")) fait.push("vous produisez encore");
          if (has(g, "ops")) fait.push("vous gérez l'opérationnel");
          fait.push("vous gardez les décisions");
          var liste = fait.join(", ").replace(/,([^,]*)$/, " et$1");
          var vise = poursuit(v).toLowerCase().replace(/\.$/, "");
          return {
            racontent: "Vous dites viser « " + vise + " ». Pourtant, " + liste +
              ". Aujourd'hui, votre organisation raconte l'inverse de votre ambition.",
            produit: "Vous travaillez davantage chaque année sans créer davantage de liberté. Votre croissance reste plafonnée par votre présence.",
            suite: "Votre organisation, votre acquisition et votre modèle — pour comprendre d'où vient cette dépendance, et concevoir le système qui s'en libère."
          };
        }
      },
      { // 2. Le chiffre d'affaires contredit la marge.
        label: "La valeur qui fuit",
        test: function (v) { return +v.q4 >= 2 && v.q5 === "0"; },
        build: function () { return {
          racontent: "Votre chiffre d'affaires dit que ça marche. Votre marge dit le contraire. Les deux ne peuvent pas avoir raison en même temps.",
          produit: "Vous produisez du volume, pas de la valeur. Plus vous grossissez à ce rythme, plus l'écart se creuse.",
          suite: "Votre structure de coûts et votre modèle de prix — pour voir précisément où la valeur se perd."
        }; }
      },
      { // 3. Le discours contredit les données.
        label: "Le pilotage à l'aveugle",
        test: function (v) { return v.q5 === "nsp"; },
        build: function () { return {
          racontent: "Vous savez où vous voulez aller, mais vous ne connaissez pas votre marge nette. Vous dirigez sur un tableau de bord auquel il manque l'aiguille principale.",
          produit: "Chaque décision se prend à l'estime. Certaines vous coûtent sans que vous le voyiez.",
          suite: "Vos chiffres réels — pour remettre l'aiguille et décider sur du concret, pas sur une impression."
        }; }
      },
      { // 4. Les ventes contredisent l'audience.
        label: "L'attention sans la vente",
        test: function (v) { return +v.q3 >= 2 && (+v.q4 <= 1 || v.q6 === "0" || v.q6 === "nsp"); },
        build: function () { return {
          racontent: "Votre audience grandit. Vos ventes, non. Ce que vous publiez attire — mais pas ceux qui achètent.",
          produit: "Vous alimentez une audience venue pour du gratuit. L'attention monte ; la valeur créée ne se transforme pas en revenus.",
          suite: "Votre offre et votre proposition de valeur — parce que le prochain cap n'est pas plus de contenu, c'est une offre qui convertit."
        }; }
      },
      { // 5. La conversion contredit la rétention.
        label: "Le réservoir percé",
        test: function (v) { return (v.q6 === "2" || v.q6 === "3") && (v.q7 === "0" || v.q7 === "nsp"); },
        build: function () { return {
          racontent: "Vous convertissez, mais personne ne revient. Votre acquisition fonctionne ; votre entreprise, elle, ne retient pas la valeur qu'elle crée.",
          produit: "Vous remplissez un réservoir percé : chaque mois repart de zéro, et la croissance coûte de plus en plus cher.",
          suite: "Votre produit et votre expérience après l'achat — là où se joue vraiment la rétention."
        }; }
      },
      { // 6. L'ambition d'échelle contredit le panier.
        label: "Le modèle sous l'ambition",
        test: function (v) { return (v.q1 === "scaler" || v.q1 === "sansmoi") && +v.q8 <= 1; },
        build: function () { return {
          racontent: "Vous voulez changer d'échelle, mais à ce panier il vous faudrait un volume que votre modèle ne peut pas porter.",
          produit: "Vous courez pour rester immobile : plus de clients, autant de fatigue, peu de marge.",
          suite: "Votre offre et votre positionnement prix — pour monter en valeur avant de pousser le volume."
        }; }
      },
      { // 7. Vouloir grandir contredit une acquisition passive.
        label: "La croissance passive",
        test: function (v) {
          var veut = (v.q1 === "scaler" || v.q1 === "sansmoi" || v.q1 === "marque");
          var actif = has(v.q9, "reseaux") || has(v.q9, "demarche");
          return veut && (has(v.q9, "rien") || (!actif && (has(v.q9, "boa") || has(v.q9, "passage"))));
        },
        build: function () { return {
          racontent: "Vous voulez grandir, mais rien, aujourd'hui, ne va chercher le client. Votre croissance dépend de ce qui vient tout seul.",
          produit: "Vous êtes à la merci d'un canal que vous ne commandez pas. Le jour où il ralentit, vous n'avez aucun relais.",
          suite: "Votre acquisition — pour construire un canal que vous actionnez, au lieu de le subir."
        }; }
      },
      { // 8. Pas encore de signal.
        label: "L'absence de signal",
        test: function (v) { return +v.q3 <= 1 && +v.q4 <= 1; },
        build: function () { return {
          racontent: "Vous cherchez à passer un cap, mais aucun canal ne ramène de clients de façon répétable. Il n'y a pas encore de système à optimiser.",
          produit: "Sans signal clair, chaque effort part dans une direction différente. L'énergie se disperse.",
          suite: "Votre tout premier canal d'acquisition — trouver celui qui ramène, avant tout le reste."
        }; }
      }
    ];

    /* Cohérent en surface : aucune contradiction majeure. */
    var COHERENT = {
      racontent: "Vos réponses ne révèlent pas de contradiction majeure : ambition, chiffres et quotidien racontent à peu près la même histoire.",
      produit: "C'est souvent à ce stade que le prochain palier se joue dans des détails invisibles de l'extérieur.",
      suite: "Vos chiffres détaillés et votre organisation — pour trouver le point de levier exact."
    };

    /* La phrase à retenir — le verdict qu'on screenshotte et qu'on partage. */
    var VERDICT = {
      "La dépendance au fondateur": "Vous vous êtes créé un job, pas une entreprise.",
      "La valeur qui fuit": "Vous travaillez pour le décor.",
      "Le pilotage à l'aveugle": "Vous dirigez à l'aveugle.",
      "L'attention sans la vente": "Vous avez l'attention. Pas la vente.",
      "Le réservoir percé": "Vous remplissez un réservoir percé.",
      "Le modèle sous l'ambition": "Vous courez pour rester immobile.",
      "La croissance passive": "Vous attendez le client. Une entreprise va le chercher.",
      "L'absence de signal": "Pas encore de système. Juste des efforts."
    };
    var VERDICT_COHERENT = "Vos fondations tiennent. Le vrai levier est plus fin.";

    /* Teste toutes les contradictions ; renvoie celles qui se déclenchent. */
    function detect(v) {
      var out = [];
      DETECTORS.forEach(function (d) { if (d.test(v)) out.push(d); });
      return out;
    }

    /* Maturité du système : une étape, pas un score. 0/1/2. */
    function maturity(v) {
      var jours = v.q2, handsIn = has(jours, "produire") || has(jours, "ops"),
          pil = has(jours, "piloter");
      var team = v.q10, ownsChannel = has(v.q9, "reseaux") || has(v.q9, "demarche");
      var conv = v.q6, fid = v.q7;
      var moteurSain = (conv === "2" || conv === "3") && (fid === "2" || fid === "3");
      if (handsIn && (team === "solo" || team === "petite")) return 0; // dépendante
      if (pil && ownsChannel && moteurSain && (team === "moyenne" || team === "grande")) return 2; // scalable
      return 1; // structurée
    }
    var STAGE_CAP = [
      "Aujourd'hui, votre entreprise a besoin de vous pour tourner. Le prochain système devra tenir sans votre présence.",
      "Votre entreprise tient debout, mais elle ne passe pas encore à l'échelle toute seule. C'est le palier suivant.",
      "Votre entreprise peut grandir sans dépendre de votre présence. Le levier est dans le raffinement, pas dans les fondations."
    ];

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

      // On détecte TOUT, on révèle UNE (la dominante), on tease le reste.
      var found = detect(v);
      var dominant = found.length ? found[0] : null;
      var c = dominant ? dominant.build(v) : COHERENT;
      document.getElementById("lr-headline").textContent = dominant ? VERDICT[dominant.label] : VERDICT_COHERENT;
      document.getElementById("lr-poursuit").textContent = poursuit(v);
      document.getElementById("lr-contradiction").textContent = c.racontent;
      document.getElementById("lr-produit").textContent = c.produit;
      document.getElementById("lr-suite").textContent = c.suite;

      // Le compteur qui crée la tension : « N contradictions, nous n'en révélons qu'une ».
      var others = found.slice(1);
      var countEl = document.getElementById("lr-count");
      if (found.length >= 2) {
        countEl.textContent = "Vos réponses révèlent " + found.length +
          " contradictions. Nous n'en ouvrons qu'une ici — celle qui produit le plus de conséquences.";
      } else if (found.length === 1) {
        countEl.textContent = "Vos réponses révèlent une contradiction centrale — celle qui produit le plus de conséquences.";
      } else {
        countEl.textContent = "Vos réponses ne révèlent pas de contradiction évidente. Le blocage, s'il existe, se joue dans le détail.";
      }

      // Les autres mécanismes : nommés, jamais détaillés. Le cerveau veut la suite.
      var lockLabel = document.getElementById("lr-lock-label");
      var lockList = document.getElementById("lr-others");
      var lockLine = document.getElementById("lr-lock-line");
      if (others.length) {
        lockLabel.textContent = others.length === 1
          ? "Un autre mécanisme détecté" : (others.length + " autres mécanismes détectés");
        lockList.innerHTML = others.map(function (o) { return "<li>" + o.label + "</li>"; }).join("");
        lockLine.textContent = "Volontairement non détaillés ici. C'est le Diagnostic WarTime qui les ouvre — et qui montre comment ils se tiennent.";
      } else {
        lockLabel.textContent = "Ce que nous ne savons pas encore";
        lockList.innerHTML = "<li>Vos chiffres détaillés, votre agenda, votre acquisition, votre offre.</li>";
        lockLine.textContent = "C'est précisément ce qui sépare cette lecture du Diagnostic WarTime.";
      }

      // Maturité : marque l'étape courante et celles déjà franchies.
      var m = maturity(v);
      Array.prototype.forEach.call(result.querySelectorAll(".stage li"), function (li) {
        var k = parseInt(li.getAttribute("data-k"), 10);
        li.classList.remove("is-here", "is-done");
        if (k < m) li.classList.add("is-done");
        if (k === m) li.classList.add("is-here");
      });
      document.getElementById("lr-stage-cap").textContent = STAGE_CAP[m];

      var echo = document.getElementById("lr-echo");
      if (v.q11 && v.q11.trim()) {
        echo.textContent = "Vous ciblez : « " + v.q11.trim() + " ». Le Diagnostic WarTime vérifie si vos chiffres racontent la même histoire.";
        echo.hidden = false;
      } else {
        echo.hidden = true;
      }

      result.hidden = false;
      result.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
    });
  })();
})();
