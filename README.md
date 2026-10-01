# Invyra

Plateforme de création et d'envoi d'invitations d'événement. L'organisateur
choisit un modèle de la galerie, le personnalise sans code (textes, photos,
couleurs, écran d'ouverture, musique), l'envoie par email ou WhatsApp avec un
lien nominatif par invité, et suit les ouvertures et les réponses. Les modèles
eux-mêmes sont écrits en HTML, CSS et JavaScript par les administrateurs.

[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-61dafb?logo=react)](https://react.dev/)
[![Prisma](https://img.shields.io/badge/Prisma-7-2D3748?logo=prisma)](https://www.prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-38B2AC?logo=tailwind-css)](https://tailwindcss.com/)

---

## Démarrer

```bash
pnpm install
cp .env.example .env      # puis remplissez les valeurs
npx prisma db push        # crée le schéma
pnpm dev                  # http://localhost:3000
```

### Variables d'environnement

| Variable | Rôle |
|---|---|
| `DATABASE_URL` | Chaîne de connexion PostgreSQL |
| `BETTER_AUTH_SECRET` | Clé de signature des sessions (32 caractères ou plus) |
| `NEXT_PUBLIC_APP_URL` | URL publique, utilisée pour les liens d'invitation |
| `SMTP_HOST` `SMTP_PORT` `SMTP_USER` `SMTP_PASS` | Envoi des emails (Nodemailer) |

---

## Architecture

### Rendu

Les pages sont des **Server Components** : elles appellent directement la
couche `app/actions/*` et arrivent peuplées. Les composants clients sont
réduits à ce qui a besoin d'état — formulaires, dialogues, onglets — et
reçoivent leurs données en propriétés.

Concrètement, une page ne va pas chercher ses données dans un `useEffect`. Si
vous ajoutez un écran, chargez ses données dans le composant serveur et passez
le résultat à un enfant client.

### Authentification

Gérée par [better-auth](https://better-auth.com) (`lib/auth/server.js`).

- Sessions en base, table `sessions` ; cookie en cache 5 minutes pour éviter
  un aller-retour SQL à chaque server action.
- Les mots de passe sont hachés en **bcrypt** et non en scrypt : le hasher par
  défaut de better-auth est surchargé pour que les comptes créés avant la
  bascule restent valides.
- `app/actions/auth.js` expose `getSession()` sous la forme historique
  `{ userId, email, name, role, plan }`, ce qui permet au reste des actions de
  ne rien savoir de better-auth.
- `proxy.js` (le middleware de Next 16) ne vérifie que la **présence** du
  cookie. L'autorisation réelle — rôle, suspension, propriété d'un événement —
  est faite côté serveur par `requireAuth` / `requireAdmin` / `canAccessEvent`.

#### Migration depuis l'authentification JWT

Les comptes existants ont leur hash bcrypt dans `users.password`, exposé en
`legacyPassword`. better-auth l'attend dans `accounts.password`.

La bascule se fait automatiquement à la première connexion de chaque
utilisateur. Pour tout migrer d'un coup :

```bash
node --env-file=.env prisma/scripts/migrate-passwords.mjs --dry   # aperçu
node --env-file=.env prisma/scripts/migrate-passwords.mjs         # application
```

Une fois tous les comptes migrés, `legacyPassword` peut être retiré du schéma.

### Internationalisation

Français et anglais, dictionnaires dans `locales/`.

La langue vient du cookie `invyra_locale`, résolu **sur le serveur**
(`lib/i18n/server.js`) : le HTML part déjà traduit et `<html lang>` est
correct. Les composants clients lisent le même dictionnaire via le contexte,
qui ne charge rien lui-même.

- Composant serveur : `const { t, locale } = await getTranslations()`
- Composant client : `const { t, locale } = useTranslation()`

Les deux fichiers de langue doivent avoir exactement les mêmes clés.

### Rendu des invitations

`components/invitation/InvitationPreview.jsx` exécute du code écrit par
l'utilisateur dans une **iframe en bac à sable**.

⚠️ `allow-same-origin` est délibérément absent de l'attribut `sandbox`. Combiné
à `allow-scripts`, il annulerait l'isolation : le modèle obtiendrait l'origine
de la page hôte et pourrait en lire les cookies. Ne l'ajoutez pas.

Conséquence : l'`origin` des messages venant de l'iframe vaut `"null"` et ne
peut pas authentifier l'émetteur. Le parent compare `event.source` à la
`contentWindow` de son iframe (voir `InvitationExperience`).

### Système de design

Les jetons sont définis dans `app/globals.css`. Trois règles :

1. Le fond est un noir chaud ; tout le neutre partage la même teinte.
2. L'or est un accent rare — filets, état actif, un chiffre clé, le CTA
   principal. Au-delà d'environ 5 % d'un écran, il cesse d'en être un.
3. Les titres sont en serif éditoriale (Fraunces), l'interface en sans (Geist).

L'interface est **sombre uniquement**, assumé : une variante claire crédible
demanderait sa propre direction artistique.

Utilitaires partagés : `.surface`, `.surface-interactive`, `.rule-gold`,
`.eyebrow`, `.text-gold`, `.text-gold-shimmer`, `.grain`, `.spotlight`,
`.tilt`, `.border-glow`, `.marquee`.

Les primitives d'écran (`PageHeader`, `StatCard`, `Panel`, `EmptyState`,
`StatusBadge`, `ProgressRing`, `MiniRsvpBar`) sont dans
`components/shell/primitives.jsx`.

#### Mouvement

Tout le mouvement est en CSS (`app/globals.css`) ; un seul composant client,
`components/common/MotionRoot.jsx`, monté dans le layout racine, lui donne ce
qu'il ne peut pas savoir seul.

- **À l'arrivée** : `animate-rise`, `animate-fade-in`, `animate-scale-in`,
  `animate-pop`, `animate-draw-x`, `animate-grow-x`, décalés par
  `--rise-delay`. Ils partent au premier rendu, sans attendre le JavaScript :
  c'est ce qu'on utilise en haut de page.
- **Au défilement** : `data-reveal` (variantes `fade`, `scale`, `blur`, `left`,
  `right`, cascade par `--i`). Masqué seulement si les scripts s'exécutent,
  avec un filet de sécurité qui révèle tout après 2,5 s. Se pose sur une
  enveloppe, jamais sur un élément qui a ses propres transitions Tailwind.
- **Boucles** : `data-loop` met en pause tout ce que le bloc contient quand il
  sort de l'écran.
- **Nombres** : `AnimatedNumber` compte de 0 à la valeur en CSS
  (`@property --n`), utilisable dans un composant serveur.
- `prefers-reduced-motion` coupe tout ; les scènes en boucle (héros,
  illustrations) ont un état statique explicite.

Piège connu : dans un dégradé appliqué au texte (`background-clip: text`), ne
mettez que des `var()`. Une couleur oklch écrite en dur vaut au CSS compilé un
repli `@supports (color: lab())` qui redéclare le raccourci `background` et
annule le découpage au texte.

---

## Organisation

Le code suit le parcours de l'application : un dossier par domaine, avec les
mêmes noms que les routes (`events`, `templates`, `analytics`, `settings`…).

```
app/                      Routes uniquement (pages, layouts, API) et actions
  actions/                Server actions : logique métier et accès DB
  dashboard/  admin/      Espace connecté et administration
  invite/[token]/         Page publique d'invitation
  api/                    better-auth, envoi de fichiers, tâche planifiée
components/
  ui/                     Primitives shadcn/ui (seulement celles utilisées)
  common/                 Partagés partout : sélecteur de langue, pagination,
                          marque, MotionRoot, AnimatedNumber, Countdown, 404
  dashboard/              Accueil de l'espace : bandeau, premiers pas, activité
  shell/                  Coquille de l'espace connecté : DashboardShell,
                          Sidebar, menus (navigation.js), primitives d'écran
  landing/  auth/  admin/  analytics/  settings/
  events/                 Liste, création, édition, import CSV des invités
    detail/               Fiche d'un événement : aperçu, invités,
                          collaborateurs, modèle de l'invitation
  templates/              Galerie, filtres par catégorie, formulaire de modèle
  editor/                 Éditeur de modèle : éditeur visuel, éditeur de
                          code, réglages de l'ouverture, aperçu
  invitation/             Invitation affichée : aperçu (iframe), vignette,
                          page de l'invité
lib/
  invitation/             Construction de l'invitation que voit l'invité
    document.js           Document HTML complet (point d'entrée du rendu)
    opening.js            Écran d'ouverture standard et ses réglages
    fonts.js  html.js
  templates/              Modèles enregistrés en base
    config.js             Format des modèles
    validation.js         Validation avant écriture, configuration éditable
    visual-edit.js        Édition sans code (textes, images, liens, couleurs)
    look.js               Fond et photo d'un modèle (aperçu des liens, e-mails)
    categories.js  code-starter.js
  landing/                Données publiques et événement d'exemple de l'accueil
  site.js                 Adresse publique, contacts (email, WhatsApp), limites
  auth/  i18n/  email/  prisma.js  utils.js (cn)
hooks/
locales/                  Dictionnaires fr / en (mêmes clés)
prisma/
  schema.prisma
  migrations-sql/         Migrations SQL rejouables
  scripts/                Scripts Node ponctuels (migrations, restauration
                          des modèles)
```

### Modèles d'invitation

Les modèles vivent **uniquement en base** (table `templates`) : l'application
les lit avec `getTemplates()` et aucun fichier du projet n'est propre à un
modèle. Supprimer un modèle supprime sa ligne, rien d'autre.

Tous ont le même format, du HTML, du CSS et du JavaScript :

```js
{ type: "code", html, css, js, opening, openingCode, fonts, music }
```

- **Création** : réservée aux admins, depuis *Modèles › Nouveau* (l'éditeur
  de code démarre avec le code de départ, `lib/templates/code-starter.js`) ou
  en dupliquant un modèle existant.
- **Modification** : les admins ont l'éditeur de code ; les autres
  utilisateurs ont l'éditeur visuel, qui ne change que les textes, les
  images, les liens et les couleurs (contrôlé côté serveur par
  `isVisualEdit`).
- **Événements** : choisir un modèle pour un événement en copie la config
  dans une ligne rattachée à l'événement. Personnaliser l'invitation modifie
  cette copie, jamais le modèle d'origine.

Ce qu'un modèle peut utiliser (voir `lib/invitation/document.js`) :

- **Jetons**, remplacés par les valeurs de l'événement : `{{GUEST_NAME}}`,
  `{{EVENT_TITLE}}`, `{{EVENT_DATE}}`, `{{TIME}}`, `{{EVENT_LOCATION}}`,
  `{{DRESS_CODE}}`, `{{EVENT_DESCRIPTION}}`, `{{CUSTOM_MESSAGE}}`,
  `{{COUNTDOWN_DATE}}` (pour un compte à rebours) et `{{MONOGRAM}}`.
- **`data-if="DRESS_CODE"`** : l'élément n'est affiché que si l'événement
  renseigne cette valeur. Plusieurs noms : il suffit que l'un soit renseigné.
  `data-if="!TIME"` inverse la condition.
- **`<script data-static>`** dans le HTML : script qui tourne aussi dans les
  vignettes (compte à rebours, mise en page). Les autres scripts n'y tournent
  pas.
- **`data-thumbnail-skip`** : élément absent des vignettes, pour ne pas y
  charger les photos du bas de page.
- **Ouverture** : l'ouverture standard, réglée par `opening`, ou une ouverture
  écrite en code (`openingCode`, avec un élément `[data-opening]`). Avec
  `data-opening-manual`, c'est le modèle qui appelle `window.openInvitation()`.
  Un script peut attendre l'ouverture avec `window.whenOpened(fn)`.
- **Réponse RSVP** : envoyée à la page par `postMessage` ; le code de départ
  montre comment.

Les sauvegardes de la table `templates` sont écrites dans `prisma/backups/`
(ignoré par git, elles contiennent des données de production). Pour revenir à
une sauvegarde :

```bash
node --env-file=.env prisma/scripts/restore-templates.mjs prisma/backups/<fichier>.json --dry   # aperçu
node --env-file=.env prisma/scripts/restore-templates.mjs prisma/backups/<fichier>.json
```

### Conventions

- Les accès à la base passent par `app/actions/*`, jamais depuis un composant.
- Chaque action vérifie ses droits elle-même : ne vous fiez pas à l'appelant.
- Après une mutation depuis un composant client, appelez `router.refresh()`
  plutôt que de maintenir une copie locale de l'état serveur.
- Les confirmations destructrices passent par `AlertDialog`, jamais par
  `confirm()`.

---

## Commandes

```bash
pnpm dev      # serveur de développement
pnpm build    # build de production
pnpm start    # démarrage du build
pnpm lint     # ESLint
```
