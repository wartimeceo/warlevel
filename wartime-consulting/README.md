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

## Mise en ligne (Netlify) & à finir

### Déployer sur Netlify (recommandé)

1. Compte gratuit sur [netlify.com](https://netlify.com).
2. **Add new site → Import from GitHub** → ce dépôt, branche
   `claude/wartime-consulting-site-q92zsm`.
3. Réglages de build :
   - **Base directory** : `wartime-consulting`
   - **Build command** : *(vide)*
   - **Publish directory** : `wartime-consulting`
   - (le fichier `netlify.toml` fait déjà ce réglage)
4. **Deploy.** Le site est en ligne sur une URL `*.netlify.app`.
5. **Domaine** : Netlify → *Domain settings* → *Add custom domain* →
   `wartimeconsulting.fr`, puis suivre les instructions DNS chez le
   registrar (OVH, Gandi…). HTTPS automatique.

> Alternative ultra-simple : glisser le dossier `wartime-consulting` sur la
> zone *Deploy* de Netlify (pas de Git, mais mises à jour manuelles).

### Les formulaires

Les deux formulaires (`#contact-form`, `#doctrine-form`) sont branchés sur
**Netlify Forms** (`data-netlify="true"`). Rien à configurer : une fois le
site sur Netlify, chaque envoi arrive dans *Netlify → Forms*. Pour recevoir
les demandes par email : *Forms → Notifications → Add notification →
Email* → `wartimemail@gmail.com`.
En local / aperçu (pas d'hébergeur), le formulaire de contact bascule sur la
messagerie du visiteur, pré-remplie vers cette adresse.

### Reste à faire

- **Déposer la doctrine.** Ajoutez `WarTime_Doctrine.pdf` dans ce dossier.
  C'est le **seul** fichier téléchargeable. Ne jamais mettre en ligne :
  protocole interne, modèles, documents d'offre et tarifs, propositions.
- **Compléter les mentions légales.** Blocs `TODO` dans
  `mentions-legales.html` (SIRET, hébergeur, paiement, rétractation).

## Notes

- Polices via Google Fonts (Archivo, Newsreader, IBM Plex Mono).
- Responsive : testé à 375 px, 768 px, 1440 px.
- Aucun cookie, aucun traceur, aucune bannière RGPD.
- Animations réduites automatiquement si `prefers-reduced-motion` est actif.
