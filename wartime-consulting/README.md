# WarTime Consulting — site vitrine

Site statique. HTML, CSS et JavaScript natifs. Aucun framework, aucun build.
Ouvrez `index.html` en double-cliquant dessus.

## Fichiers

```
wartime-consulting/
├── index.html            Page principale (tout est là)
├── doctrine.html         Page de téléchargement de la doctrine
├── mentions-legales.html Mentions légales + CGV
├── style.css             Système de design + toutes les sections
└── script.js             Séquence du hero, révélation au scroll, formulaires
```

## À finir avant la mise en ligne

1. **Brancher les formulaires.** Deux formulaires (`#doctrine-form` et
   `#contact-form`) affichent pour l'instant un message de succès en local.
   Cherchez les commentaires `<!-- TODO: brancher l'endpoint -->` et pointez
   l'attribut `action` vers Formspree ou activez Netlify Forms.

2. **Déposer la doctrine.** Ajoutez le fichier `WarTime_Doctrine.pdf` à côté
   des pages. C'est le **seul** fichier téléchargeable. Ne jamais mettre en
   ligne : protocole interne, modèle de Lecture, document d'offre et tarifs,
   proposition de mission.

3. **Compléter les mentions légales.** Cherchez les blocs `TODO` dans
   `mentions-legales.html` (SIRET, hébergeur, paiement, rétractation).

## Notes

- Polices via Google Fonts (Archivo, Newsreader, IBM Plex Mono).
- Responsive : testé à 375 px, 768 px, 1440 px.
- Aucun cookie, aucun traceur, aucune bannière RGPD.
- Animations réduites automatiquement si `prefers-reduced-motion` est actif.
