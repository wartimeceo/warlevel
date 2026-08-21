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

    /* Ce que vous cherchez à construire — l'ambition (q1). */
    function poursuit(v) {
      return {
        reference: "Faire de votre entreprise une référence.",
        scale:     "Changer d'échelle.",
        sansmoi:   "Construire quelque chose qui ne dépend plus de vous.",
        lancement: "Réussir un lancement, un nouveau pari."
      }[v.q1] || "Passer votre prochain cap.";
    }

    /* Les tensions lues dans les FAITS, indépendamment de ce que le
       dirigeant croit. Servent à nommer « les autres mécanismes ». */
    function signals(v) {
      var s = [], ca = +v.q5, marge = v.q6, conv = v.q7, acq = v.q8, fid = v.q9, team = v.q10;
      if (marge === "nsp") s.push({ key: "marge", label: "Le pilotage à l'aveugle" });
      else if (marge === "0" && ca >= 2) s.push({ key: "marge", label: "La valeur qui fuit" });
      if (conv === "0" || conv === "nsp") s.push({ key: "conv", label: "L'attention sans la vente" });
      if (fid === "0" || fid === "nsp") s.push({ key: "fid", label: "Le réservoir percé" });
      if (acq === "rien" || acq === "boa" || acq === "passage") s.push({ key: "acq", label: "La croissance passive" });
      if (v.q1 === "sansmoi" && (team === "solo" || team === "petite")) s.push({ key: "founder", label: "La dépendance au fondateur" });
      return s;
    }

    /* Le cœur : confronter ce que le dirigeant CROIT (q2) à ce que ses
       FAITS racontent. Renvoie { verdict, racontent, produit, suite, primary }. */
    function readContradiction(v, sig) {
      function on(k) { return sig.some(function (s) { return s.key === k; }); }
      var perc = v.q2;

      if (perc === "clients") {
        if (on("fid")) return { primary: "fid",
          verdict: "Vous remplissez un réservoir percé.",
          racontent: "Vous croyez manquer de clients. Vos chiffres disent l'inverse : vous en trouvez, mais vous les perdez. Peu reviennent.",
          produit: "Vous rachetez chaque mois la croissance du mois précédent. Remplir un réservoir qui fuit coûte de plus en plus cher.",
          suite: "Votre produit et l'expérience après l'achat — là où se joue la rétention, pas l'acquisition." };
        if (on("conv")) return { primary: "conv",
          verdict: "Ce n'est pas le volume. C'est l'offre.",
          racontent: "Vous croyez manquer de clients. En réalité, ceux qui vous découvrent n'achètent pas. Le problème n'est pas d'en attirer davantage.",
          produit: "Vous poussez l'acquisition pour compenser une offre qui ne transforme pas : l'entonnoir se remplit par le haut et fuit par le bas.",
          suite: "Votre offre et sa promesse — pourquoi ceux qui vous trouvent devraient acheter, maintenant." };
        if (on("acq")) return { primary: "acq",
          verdict: "Vous attendez le client.",
          racontent: "Vous croyez manquer de clients, mais rien, aujourd'hui, ne va les chercher. Votre acquisition attend qu'ils viennent.",
          produit: "Votre croissance dépend de ce qui vient tout seul. Le jour où ça ralentit, vous n'avez aucun relais.",
          suite: "Un canal d'acquisition que vous actionnez, au lieu de le subir." };
        return { primary: null,
          verdict: "Le manque n'est pas là où vous le cherchez.",
          racontent: "Vous croyez manquer de clients ; vos chiffres ne le confirment pas vraiment. Le manque est ailleurs — dans ce que vous vendez, ou à qui.",
          produit: "Tant que le vrai manque n'est pas nommé, en chercher davantage ne fait que déplacer le problème.",
          suite: "Ce que vos meilleurs clients achètent réellement — et ce qui, dans votre offre, s'en éloigne." };
      }

      if (perc === "offre") {
        if ((v.q7 === "2" || v.q7 === "3") && on("fid")) return { primary: "fid",
          verdict: "Votre offre convertit. Elle ne retient pas.",
          racontent: "Vous accusez votre offre. Elle convertit pourtant. Ce qui casse est en aval : on achète une fois, on ne revient pas.",
          produit: "Votre promesse dépasse ce que vous livrez. Chaque client coûte à acquérir, aucun ne compose dans le temps.",
          suite: "L'expérience après l'achat et la tenue de votre promesse — là où se perd la rétention." };
        if (on("acq")) return { primary: "acq",
          verdict: "Le problème n'est pas l'offre. C'est qui la voit.",
          racontent: "Ce n'est peut-être pas votre offre. Personne ne va la présenter aux bonnes personnes : votre acquisition ne travaille pas.",
          produit: "Une bonne offre sans canal ressemble à une mauvaise offre — le résultat est le même : ça ne vend pas.",
          suite: "Votre acquisition, et l'adéquation entre le canal et ceux à qui l'offre est destinée." };
        return { primary: null,
          verdict: "Souvent, un problème d'offre est un problème de positionnement.",
          racontent: "Votre offre est peut-être en cause. Mais ce qu'on prend pour un problème d'offre est souvent un problème de positionnement : à qui parlez-vous, et pourquoi vous ?",
          produit: "Une offre qui parle à tout le monde ne convainc personne fortement. Elle plaît, sans jamais s'imposer.",
          suite: "Votre positionnement — pour qui, précisément, êtes-vous le bon choix." };
      }

      if (perc === "orga") {
        if (on("founder")) return { primary: "founder",
          verdict: "Le système, c'est vous.",
          racontent: "Votre organisation ne suit plus parce qu'elle repose encore entièrement sur vous. Ce n'est pas un problème de process.",
          produit: "Chaque décision remonte à vous. L'entreprise a votre capacité pour plafond — et votre présence pour condition.",
          suite: "Ce qui doit pouvoir se décider sans vous, et le système qui le permet." };
        if (on("marge")) return { primary: "marge",
          verdict: "Vous réorganisez ce qui perd déjà de la valeur.",
          racontent: "Vous accusez l'organisation. Vos chiffres pointent plus haut : la valeur se perd avant l'exécution, dans votre modèle ou vos prix.",
          produit: "Mieux organiser une activité peu rentable la rend simplement efficace à perdre de l'argent.",
          suite: "Votre modèle et vos marges — avant de toucher à l'organisation." };
        if (on("conv") || on("fid")) return { primary: on("conv") ? "conv" : "fid",
          verdict: "On ne réorganise pas une demande qui ne tient pas.",
          racontent: "Ce que vous prenez pour un problème d'organisation est, en amont, un problème d'offre ou de rétention.",
          produit: "Structurer autour d'une demande fragile ne fait que figer la fragilité.",
          suite: "L'offre et la rétention d'abord ; l'organisation ensuite." };
        return { primary: null,
          verdict: "L'organisation est-elle le problème, ou le symptôme ?",
          racontent: "L'organisation est peut-être en cause. Reste à savoir si elle est le problème — ou le symptôme d'une décision plus ancienne qu'on n'a jamais rouverte.",
          produit: "On empile des règles pour compenser une décision de départ qu'on n'ose plus revoir.",
          suite: "La décision fondatrice derrière votre organisation actuelle." };
      }

      if (perc === "position") {
        if (v.q7 === "2" || v.q7 === "3") return { primary: null,
          verdict: "Pas un problème de force. De clarté.",
          racontent: "Votre positionnement convertit encore. Le problème n'est peut-être pas d'être plus fort, mais plus clair : pour qui, précisément, êtes-vous le bon choix ?",
          produit: "Un positionnement flou fait travailler deux fois plus pour convaincre — et attire les mauvais clients.",
          suite: "Le client pour qui vous êtes une évidence, et tout ce qui, aujourd'hui, le dilue." };
        if ((v.q1 === "reference" || v.q1 === "scale") && on("marge")) return { primary: "marge",
          verdict: "Vous visez le haut avec les prix du milieu.",
          racontent: "Vous voulez monter ; vos marges disent que votre positionnement communique encore « accessible ». L'ambition et les prix ne racontent pas la même histoire.",
          produit: "Vous portez les coûts du premium sans en toucher la valeur. L'écart se paie en marge.",
          suite: "Votre positionnement prix — l'aligner sur ce que vous voulez devenir." };
        return { primary: null,
          verdict: "Dites-vous la même chose que ce qu'on vient chercher ?",
          racontent: "Le positionnement est le bon terrain. La vraie question : votre entreprise dit-elle la même chose que ce que vos meilleurs clients viennent y chercher ?",
          produit: "Quand le discours et la raison réelle d'achat divergent, on attire du monde — rarement les bons.",
          suite: "L'écart entre ce que vous dites être et ce pour quoi on vous choisit vraiment." };
      }

      // perc === "nsp" — le client idéal : on nomme le premier signe.
      if (v.q6 === "nsp") return { primary: "marge",
        verdict: "Vous dirigez sans l'instrument principal.",
        racontent: "Vous sentez que quelque chose cloche sans le nommer. Premier signe : vous ne connaissez pas votre marge. On ne corrige pas ce qu'on ne mesure pas.",
        produit: "Chaque décision se prend à l'estime. Certaines vous coûtent sans que vous le voyiez.",
        suite: "Vos chiffres réels — remettre l'aiguille avant de chercher plus loin." };
      if (on("fid")) return { primary: "fid",
        verdict: "Le problème est après la vente.",
        racontent: "Vous sentez que quelque chose cloche sans le nommer. Un signe fort : vos clients ne reviennent pas. Le problème se cache souvent là où on ne regarde plus — après l'achat.",
        produit: "Vous rachetez chaque mois la croissance perdue. C'est épuisant, et invisible dans le chiffre du mois.",
        suite: "Ce qui se passe après la première vente : la rétention." };
      if (on("conv")) return { primary: "conv",
        verdict: "Vous avez l'attention. Pas la vente.",
        racontent: "Vous sentez que quelque chose cloche sans le nommer. Un signe : beaucoup vous découvrent, peu achètent. Le problème est dans l'offre, pas dans l'effort.",
        produit: "Vous alimentez le haut de l'entonnoir pour compenser un milieu qui ne transforme pas.",
        suite: "Votre offre et sa promesse — pourquoi acheter, et maintenant." };
      if (on("acq")) return { primary: "acq",
        verdict: "Votre croissance dépend du hasard.",
        racontent: "Vous sentez que quelque chose cloche sans le nommer. Un signe : rien ne va chercher le client. Votre croissance dépend de ce qui vient tout seul.",
        produit: "Sans canal que vous actionnez, chaque bon mois est un coup de chance — et chaque mauvais, une énigme.",
        suite: "Un canal d'acquisition que vous contrôlez." };
      return { primary: null,
        verdict: "Vos chiffres ne hurlent pas. C'est justement le sujet.",
        racontent: "Vous sentez que quelque chose cloche sans arriver à le nommer — et vos chiffres ne crient rien de flagrant. La contradiction est plus fine : entre ce que vous voulez devenir et ce que votre entreprise fait vraiment.",
        produit: "C'est le cas le plus fréquent chez ceux qui réussissent déjà : le problème n'est pas visible de l'intérieur.",
        suite: "L'écart entre votre ambition, votre récit et vos actes — exactement ce qu'un regard extérieur voit." };
    }

    /* Le pari — une prédiction falsifiable, sur un comportement qu'on n'a
       PAS demandé. C'est le moment « comment ils savent ça ? ». */
    var PARI = {
      fid:     "Nous parions que votre meilleur mois et votre pire mois tiennent aux mêmes quelques clients — et que vous ne sauriez pas dire, aujourd'hui, lesquels reviendront.",
      conv:    "Nous parions que vous avez déjà baissé un prix ou ajouté une option en espérant convertir davantage. Ça n'a presque rien changé.",
      acq:     "Nous parions que vous ne pouvez pas expliquer précisément pourquoi un bon mois est un bon mois. Il arrive, c'est tout.",
      marge:   "Nous parions qu'au moins une chose que vous vendez vous fait perdre de l'argent — sans que vous le voyiez passer.",
      founder: "Nous parions que les trois dernières décisions qui comptaient sont toutes repassées par vous."
    };
    var PARI_DEFAULT = "Nous parions que si nous demandions à vos cinq meilleurs clients pourquoi ils vous choisissent, leur réponse ne serait pas celle que vous venez d'écrire.";

    /* Maturité du système : une étape, pas un score. 0/1/2. */
    function maturity(v) {
      var team = v.q10, conv = v.q7, fid = v.q9, acq = v.q8;
      var dependant = (team === "solo" || team === "petite") && (v.q1 === "sansmoi" || v.q2 === "orga");
      var moteurSain = (conv === "2" || conv === "3") && (fid === "2" || fid === "3");
      var canalActif = (acq === "reseaux" || acq === "demarche");
      if (dependant) return 0; // dépendante
      if (moteurSain && canalActif && (team === "moyenne" || team === "grande")) return 2; // scalable
      return 1; // structurée
    }
    var STAGE_CAP = [
      "Aujourd'hui, votre entreprise a besoin de vous pour tourner. Le prochain système devra tenir sans votre présence.",
      "Votre entreprise tient debout, mais elle ne passe pas encore à l'échelle toute seule. C'est le palier suivant.",
      "Votre entreprise peut grandir sans dépendre de votre présence. Le levier est dans le raffinement, pas dans les fondations."
    ];

    var hint = document.getElementById("lr-hint");
    var radios = ["q1", "q2", "q5", "q6", "q7", "q8", "q9", "q10"];
    var groups = [];

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
      function txt(n) { var el = form.querySelector('[name="' + n + '"]'); return el ? el.value : ""; }
      v.q3 = txt("q3"); v.q4 = txt("q4"); v.q11 = txt("q11");

      // On confronte ce que le dirigeant CROIT (q2) à ce que ses FAITS racontent.
      var sig = signals(v);
      var c = readContradiction(v, sig);
      document.getElementById("lr-headline").textContent = sig.length ? c.verdict : "Honnêtement, rien ne se contredit assez fort.";
      document.getElementById("lr-poursuit").textContent = poursuit(v);
      document.getElementById("lr-contradiction").textContent = c.racontent;
      document.getElementById("lr-produit").textContent = c.produit;
      document.getElementById("lr-suite").textContent = c.suite;

      // Le pari : on l'affiche seulement s'il y a une vraie tension à lire.
      var pariBlock = document.getElementById("lr-pari-block");
      if (sig.length) {
        document.getElementById("lr-pari").textContent = PARI[c.primary] || PARI_DEFAULT;
        pariBlock.hidden = false;
      } else {
        pariBlock.hidden = true;
      }

      // Le compteur qui crée la tension.
      var others = sig.filter(function (s) { return s.key !== c.primary; });
      var countEl = document.getElementById("lr-count");
      if (sig.length === 0) {
        countEl.textContent = "Ce que vous pensez et ce que vos chiffres montrent racontent à peu près la même histoire. Nous ne voyons pas, ici, de contradiction assez importante pour justifier un diagnostic payant.";
      } else if (sig.length >= 2) {
        countEl.textContent = "Vos réponses révèlent " + sig.length + " tensions. Nous n'en ouvrons qu'une ici — celle qui pèse le plus.";
      } else {
        countEl.textContent = "Vos réponses pointent une tension centrale — celle qui pèse le plus.";
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
      } else if (sig.length === 0) {
        lockLabel.textContent = "Notre parti pris";
        lockList.innerHTML = "<li>Nous préférons vous le dire plutôt que vous vendre un diagnostic dont vous n'avez pas besoin.</li>";
        lockLine.textContent = "Revenez le jour où quelque chose coince sans que vous arriviez à voir quoi.";
      } else {
        lockLabel.textContent = "Ce que nous ne savons pas encore";
        lockList.innerHTML = "<li>Vos chiffres détaillés, votre organisation, votre offre, votre récit.</li>";
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

      // Le CTA s'adapte : pas de contradiction → pas de vente forcée.
      var payBtn = document.getElementById("lr-pay");
      if (payBtn) payBtn.textContent = sig.length ? "Le Diagnostic WarTime — 990 €" : "Nous écrire quand quelque chose coince";

      // On reprend ses mots : ce qui vous a mené ici devient ce qui vous retient.
      var echo = document.getElementById("lr-echo");
      var q4 = (v.q4 || "").trim(), q11 = (v.q11 || "").trim();
      if (q4) {
        echo.textContent = "Vous dites que votre succès vient de « " + q4 + " ». Souvent, ce qui vous a mené jusqu'ici devient exactement ce qui vous retient.";
        echo.hidden = false;
      } else if (q11) {
        echo.textContent = "Vous visez : « " + q11 + " ». Le Diagnostic WarTime vérifie si vos actes racontent déjà cette histoire.";
        echo.hidden = false;
      } else {
        echo.hidden = true;
      }

      result.hidden = false;
      result.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
    });
  })();
})();
