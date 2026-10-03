# Invyra

Plateforme de création et d'envoi d'invitations d'événement. L'organisateur
choisit un modèle de la galerie, le personnalise sans code (textes, photos,
couleurs, écran d'ouverture, musique), l'envoie par email ou WhatsApp avec un
lien nominatif par invité, et suit les ouvertures et les réponses. L'invité qui
confirme reçoit un billet à QR code, scanné à l'entrée le jour J ; il retrouve
l'itinéraire sur une carte et laisse ses photos, ses vidéos et un mot dans le
livre d'or. Les modèles eux-mêmes sont écrits en HTML, CSS et JavaScript par
les administrateurs.

[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-61dafb?logo=react)](https://react.dev/)
[![Prisma](https://img.shields.io/badge/Prisma-7-2D3748?logo=prisma)](https://www.prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-38B2AC?logo=tailwind-css)](https://tailwindcss.com/)
[![Better Auth](https://img.shields.io/badge/Better_Auth-1.7-black)](https://better-auth.com/)

---

## Fonctionnalités

**Organisateur** (`/dashboard`)

- Événement avec date, heure, code vestimentaire, numéro de contact et un
  itinéraire en plusieurs étapes placées sur une carte.
- Galerie de modèles classés par catégorie, personnalisation sans code.
- Invités ajoutés un par un ou importés en CSV
  (`nom,email,téléphone,places`), avec un nombre de places par invité.
- Envoi par email, individuel ou groupé, ou par lien WhatsApp ; suivi des
  ouvertures et des réponses ; export PDF de la liste des invités.
- Collaborateurs en édition ou en lecture seule, statistiques.
- Modération des souvenirs et préparation de l'accueil du jour J.

**Invité** (`/invite/[token]`, sans compte)

- Invitation animée, avec écran d'ouverture et musique.
- Réponse (présent, absent, peut-être), nombre de personnes, régime
  alimentaire, mot pour les hôtes.
- Billet d'entrée : page avec QR code, PDF au format A6, et e-mail envoyé à
  la confirmation.
- Itinéraire : carte des étapes et liens vers Google Maps, Waze ou Plans.
- Souvenirs : livre d'or, photos et vidéos partagées avec les autres invités.

**Jour J** (`/check-in/[token]`)

- Lien secret confié à l'équipe d'accueil, qui n'a pas besoin de compte.
- Lecture du QR code à la caméra, saisie du code à la main ou recherche par
  nom.
- Compteurs d'arrivées, correction du nombre de personnes, annulation d'une
  arrivée.

**Administration** (`/admin`)

- Utilisateurs (rôle, formule, suspension) et ensemble des événements.
- Les admins créent et modifient aussi les modèles en code, depuis
  *Modèles* dans l'espace connecté.

**Site public**

- Accueil, collection des modèles (`/templates`) et page de chaque modèle
  publié (`/templates/[id]`), toutes ouvertes sans compte.

---

## Démarrer

```bash
pnpm install              # génère aussi le client Prisma (postinstall)
cp .env.example .env      # puis remplissez les valeurs
npx prisma db push        # crée le schéma sur une base vide
pnpm dev                  # http://localhost:3000
```

Sur une base existante, n'utilisez pas `db push` : appliquez les migrations
de `prisma/migrations-sql/` (voir [Base de données](#base-de-données)).

### Variables d'environnement

| Variable | Rôle |
|---|---|
| `DATABASE_URL` | Chaîne de connexion PostgreSQL (NeonDB) |
| `BETTER_AUTH_SECRET` | Clé de signature des sessions, 32 caractères ou plus (`openssl rand -base64 32`) |
| `NEXT_PUBLIC_APP_URL` | URL publique, utilisée pour les liens d'invitation, le sitemap et l'Open Graph |
| `SMTP_HOST` `SMTP_PORT` `SMTP_USER` `SMTP_PASS` | Envoi des emails (Nodemailer) ; port 465 en SSL, 587 en STARTTLS |
| `BLOB_READ_WRITE_TOKEN` | Store Vercel Blob **public** pour les photos, la musique et les souvenirs. Sans lui, seul le collage d'un lien d'image fonctionne |
| `CONTACT_EMAIL` | Facultatif. Destinataire des demandes de contact |
| `CRON_SECRET` | Facultatif. Protège la tâche planifiée `/api/cron/keepalive` |

Sur Vercel, si `NEXT_PUBLIC_APP_URL` est absente, l'URL publique retombe sur
`VERCEL_PROJECT_PRODUCTION_URL` côté serveur (`lib/site.js`).

---

## Architecture

### Rendu

Les pages sont des **Server Components** : elles appellent directement la
couche `app/actions/*` et arrivent peuplées. Les composants clients sont
réduits à ce qui a besoin d'état (formulaires, dialogues, onglets) et
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
  cookie. L'autorisation réelle (rôle, suspension, propriété d'un événement)
  est faite côté serveur par `requireAuth` / `requireAdmin` / `canAccessEvent`.
- Chaque nouveau compte reçoit un e-mail de bienvenue, envoyé par un
  `databaseHooks.user.create.after` dans `after()` : l'inscription n'attend
  pas le serveur SMTP et un envoi raté ne la bloque jamais.

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

### SEO

- Chaque page déclare ses métadonnées (`generateMetadata`), avec une URL
  canonique pour les pages publiques.
- `app/opengraph-image.jsx` produit l'image de partage générale ; une page qui
  définit son propre `openGraph` doit la reprendre explicitement (voir
  `app/templates/page.jsx`).
- `app/sitemap.js` liste l'accueil, la collection, les modèles publiés,
  l'inscription et la connexion.
- `app/robots.js` exclut `/dashboard`, `/admin`, `/api/` et `/check-in/`.
- Les pages d'invitation (`/invite/…`) portent `noindex` mais restent
  ouvertes aux robots : certains réseaux lisent `robots.txt` pour construire
  l'aperçu d'un lien partagé.
- La collection `/templates` est paginée et filtrable par catégorie
  (`?category=…&page=…`) ; une collection vide passe en `noindex`.

### Rendu des invitations

`components/invitation/InvitationPreview.jsx` exécute du code écrit par
l'utilisateur dans une **iframe en bac à sable**.

⚠️ `allow-same-origin` est délibérément absent de l'attribut `sandbox`. Combiné
à `allow-scripts`, il annulerait l'isolation : le modèle obtiendrait l'origine
de la page hôte et pourrait en lire les cookies. Ne l'ajoutez pas.

Conséquence : l'`origin` des messages venant de l'iframe vaut `"null"` et ne
peut pas authentifier l'émetteur. Le parent compare `event.source` à la
`contentWindow` de son iframe (voir `InvitationExperience`).

### Espace invité

Tout passe par le jeton de l'invitation (`Guest.invitationToken`), sans
compte :

| Route | Contenu |
|---|---|
| `/invite/[token]` | L'invitation, et par-dessus le panneau de réponse (`RsvpDetailsSheet`) et la barre de l'invité (`GuestBar`) |
| `/invite/[token]/ticket` | Billet d'entrée : QR code, code lisible, informations pratiques |
| `/invite/[token]/ticket/pdf` | Le même billet en PDF A6 |
| `/invite/[token]/directions` | Itinéraire sur une carte |
| `/invite/[token]/memories` | Livre d'or, photos et vidéos |

- Seule la première page compte comme une ouverture de l'invitation.
- Les pages secondaires reprennent le fond et la photo du modèle
  (`templateLook`, `lib/templates/look.js`).
- `GuestBar` n'apparaît qu'une fois l'écran d'ouverture passé : l'iframe
  envoie `{ type: "INVITATION_OPENED" }` au parent. Ses boutons dépendent de
  l'état de l'invité (billet si confirmé, itinéraire si l'événement a un
  lieu, souvenirs si l'hôte les a ouverts).
- Le panneau de réponse vit hors de l'iframe : il fonctionne avec tous les
  modèles, sans qu'ils aient à le prévoir.

### Billets et accueil le jour J

Le billet est porté par `Guest.ticketCode`, **distinct** du jeton
d'invitation : le billet se montre à l'entrée, le jeton permet de modifier sa
réponse. Le QR code ne contient que ce code, sans adresse ni nom.

- Code de 12 caractères sur un alphabet sans caractères ambigus (ni 0, O, 1,
  I, L), affiché par groupes de quatre (`7K3M-Q9PX-2HTA`) pour pouvoir le
  taper à la main (`lib/tickets.js`).
- Créé à la première confirmation ; l'e-mail du billet part alors dans
  `after()`, avec le QR code en pièce jointe en ligne (`cid:`) pour ne pas
  être bloqué comme une image distante.
- QR codes générés côté serveur (`lib/qr.js`) : modules sombres sur fond
  blanc quel que soit le thème, correction d'erreur « M ».
- `Guest.seats` : places réservées par l'hôte (de 1 à 20).
  `Guest.attendingCount` : personnes annoncées par l'invité. Les compteurs
  d'accueil prennent la réponse de l'invité, sinon ses places.

L'accueil (`app/actions/checkin.js`, `components/checkin/CheckInStation.jsx`) :

- L'hôte ou un éditeur crée le lien `/check-in/<jeton>` (`Event.checkInToken`)
  depuis l'onglet *Jour J* de l'événement. Le régénérer coupe l'ancien
  aussitôt, même sur une page déjà ouverte : chaque action relit l'événement
  à partir du jeton.
- Le scan renvoie `ok`, `already` (déjà entré), `not_confirmed` (billet
  valide sans confirmation, l'agent décide) ou `unknown`. L'écran de résultat
  occupe tout l'écran, avec un son et une vibration.
- L'arrivée est enregistrée avec la condition `checkedInAt: null` vérifiée
  par la base : deux agents qui scannent le même billet en même temps ne la
  comptent qu'une fois.
- `qr-scanner` n'est chargé qu'à l'ouverture de la caméra.

### Itinéraire et cartes

Les étapes d'un événement (cérémonie, réception…) sont stockées dans
`Event.itinerary` (JSONB), dix au plus. Forme, validation et liens de
navigation dans `lib/itinerary.js` :

```js
{ id, title, time, place, address, lat, lng }   // lat/lng null si saisie à la main
```

- `Event.location` reste rempli avec le lieu de la première étape
  (`deriveLocation`) : les e-mails, les PDF, les modèles et les listes le
  lisent toujours. Un événement créé avant l'itinéraire n'a que ce texte, que
  `stopsOf` transforme en étape.
- Carte **Leaflet** sur tuiles OpenStreetMap (attribution obligatoire et
  visible), chargée seulement dans le navigateur (`ItineraryMap`,
  `ssr: false`). Le style de la carte est dans `app/globals.css`, sous
  `.itinerary-map`.
- Recherche de lieux et adresse d'un point touché avec **Photon** (komoot),
  gratuit et sans clé (`lib/geocoding.js`). Appelé depuis le navigateur de
  l'hôte, avec attente après la frappe, annulation et petit cache. Changer de
  service ne touche que ce fichier.
- Le tracé entre les étapes est à vol d'oiseau : le trajet réel est laissé à
  Google Maps, Waze ou Plans, avec un lien par étape.

### Souvenirs

Livre d'or (`guestbook_messages`) et photos et vidéos des invités
(`event_photos`, `kind` = `"photo"` ou `"video"`), dans
`app/actions/memories.js`.

- Seuls les invités écrivent, chacun ne supprime que ce qu'il a publié, et
  tous les invités voient tout sauf ce que l'hôte a masqué.
- Le propriétaire et les éditeurs masquent, suppriment, et ouvrent ou ferment
  le livre d'or et le partage (`Event.guestbookEnabled`,
  `Event.photosEnabled`) ; un collaborateur en lecture seule voit sans
  modifier.
- Limites par invité dans `lib/site.js` : 30 médias dont 5 vidéos au plus,
  20 messages.
- Supprimer un message ou un média le retire aussi de Vercel Blob (fichier et
  aperçu). Supprimer un événement ou un invité supprime ses lignes en
  cascade, mais ses fichiers restent dans le store.

### Fichiers (Vercel Blob)

Les fichiers partent **directement du navigateur** vers Vercel Blob :
`app/api/upload/route.js` ne fait que délivrer un jeton d'upload signé après
avoir vérifié l'émetteur (le corps des fonctions Vercel est limité à 4,5 Mo).

| Dossier | Émetteur | Types | Poids max |
|---|---|---|---|
| `invitations/audio/` | Utilisateur connecté | Audio | 15 Mo |
| `invitations/` | Utilisateur connecté | Images | 5 Mo |
| `memories/<eventId>/` | Invité (jeton dans `clientPayload`), partage ouvert, limite non atteinte | Images | 5 Mo |
| `memories/<eventId>/videos/` | Idem | MP4, MOV, WebM | 50 Mo |
| `memories/<eventId>/posters/` | Idem | JPEG (aperçu d'une vidéo) | 1 Mo |

- Les photos sont préparées dans le navigateur avant l'envoi
  (`lib/media/prepare-image.js`) : grand côté ramené à 2000 px, ré-encodage
  en JPEG (lu partout, Outlook compris), orientation EXIF appliquée. Un GIF
  n'est jamais retouché.
- Les vidéos partent telles quelles ; le navigateur en tire une image
  d'aperçu quand il le peut (`lib/media/prepare-video.js`). Une vidéo HEVC
  d'iPhone dans Chrome ou Firefox s'envoie sans aperçu.
- Les règles (types, poids, emplacements) sont dans `lib/media/memories.js`,
  partagé entre le client et le serveur.

### E-mails

Tous les e-mails passent par `lib/email/transport.js` (`sendMail`).

⚠️ Ce module n'est volontairement **pas** `"use server"` : ses exports
deviendraient des points d'entrée appelables depuis le navigateur, et
n'importe qui pourrait envoyer des e-mails au nom d'Invyra. Ne l'importez
que depuis du code serveur.

| Fichier | E-mail |
|---|---|
| `invitation-email.js` | Invitation, avec les étapes de l'itinéraire et le lien vers la carte |
| `ticket-email.js` | Billet d'entrée, envoyé à la confirmation |
| `welcome-email.js` | Bienvenue, à la création d'un compte |
| `layout.js` | Socle commun : mise en page en tableaux, styles en ligne, bouton compatible Outlook |

Les clients mail ne comprennent ni les variables CSS ni oklch : les jetons du
design system sont convertis en hexadécimal dans `BRAND_HEX` (`layout.js`),
réutilisé par les PDF et l'image Open Graph. Tout ce qui vient d'un
utilisateur est échappé par l'appelant.

### PDF

Générés côté serveur avec `@react-pdf/renderer` (`lib/pdf/`) :

- `GuestListDocument.jsx` : liste des invités, depuis
  `/dashboard/events/[id]/guests/pdf` ;
- `TicketDocument.jsx` : billet d'un invité au format A6, depuis
  `/invite/[token]/ticket/pdf`.

### Tâche planifiée

`/api/cron/keepalive`, déclarée dans `vercel.json`, tourne chaque jour à
minuit et fait une lecture légère pour garder la base éveillée. Si
`CRON_SECRET` est défini, l'appel doit porter `Authorization: Bearer <secret>`
(Vercel l'ajoute de lui-même).

### Système de design

Les jetons sont définis dans `app/globals.css`. Trois règles :

1. Le fond est un noir chaud ; tout le neutre partage la même teinte.
2. L'or est un accent rare : filets, état actif, un chiffre clé, le CTA
   principal. Au-delà d'environ 5 % d'un écran, il cesse d'en être un.
3. Les titres sont en serif éditoriale (Fraunces), l'interface en sans (Geist).

L'interface est **sombre uniquement**, assumé : une variante claire crédible
demanderait sa propre direction artistique.

Utilitaires partagés : `.surface`, `.surface-interactive`, `.rule-gold`,
`.eyebrow`, `.text-gold`, `.text-gold-shimmer`, `.grain`, `.spotlight`,
`.tilt`, `.border-glow`, `.marquee`, `.skeleton`.

Les primitives d'écran (`PageHeader`, `StatCard`, `Panel`, `EmptyState`,
`StatusBadge`, `ProgressRing`, `MiniRsvpBar`) sont dans
`components/shell/primitives.jsx`.

Le logo, le favicon et les visuels des réseaux sociaux (bannières LinkedIn,
X, YouTube, couverture Facebook, photos de profil) sont dans `public/` et
`public/brand/`.

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
  Un enfant marqué `data-reveal-child` attend que son bloc soit visible (le
  paraphe de la signature du pied de page, `components/landing/Signature.jsx`).
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
                          (checkin.js, memories.js, invitation.js…)
  dashboard/  admin/      Espace connecté et administration
  templates/              Collection publique des modèles, page d'un modèle
  invite/[token]/         Invitation, billet (+ PDF), itinéraire, souvenirs
  check-in/[token]/       Accueil des invités le jour J
  api/                    better-auth, envoi de fichiers, tâche planifiée
  sitemap.js  robots.js  opengraph-image.jsx  manifest.js
components/
  ui/                     Primitives shadcn/ui (seulement celles utilisées)
  common/                 Partagés partout : sélecteur de langue, pagination,
                          marque, MotionRoot, AnimatedNumber, Countdown, 404
  dashboard/              Accueil de l'espace : bandeau, premiers pas, activité
  shell/                  Coquille de l'espace connecté : DashboardShell,
                          Sidebar, menus (navigation.js), primitives d'écran
  landing/  auth/  admin/  analytics/  settings/
  events/                 Liste, création, édition, import CSV des invités,
                          saisie de l'itinéraire
    detail/               Fiche d'un événement : aperçu, invités, accueil,
                          souvenirs, collaborateurs, modèle de l'invitation
  templates/              Galerie, filtres par catégorie, formulaire de modèle
  editor/                 Éditeur de modèle : éditeur visuel, éditeur de
                          code, réglages de l'ouverture, aperçu
  invitation/             Invitation affichée : aperçu (iframe), vignette,
                          page de l'invité, panneau de réponse, GuestBar
  checkin/                Écran de l'équipe d'accueil (scan, recherche)
  itinerary/              Carte Leaflet, recherche de lieux, vue invité
  memories/               Livre d'or, mur de photos et vidéos, visionneuse
lib/
  invitation/             Construction de l'invitation que voit l'invité
    document.js           Document HTML complet (point d'entrée du rendu)
    opening.js            Écran d'ouverture standard et ses réglages
    dates.js              Jour de l'événement en toutes lettres, heures
    fonts.js  html.js
  templates/              Modèles enregistrés en base
    config.js             Format des modèles
    validation.js         Validation avant écriture, configuration éditable
    visual-edit.js        Édition sans code (textes, images, liens, couleurs)
    look.js               Fond, photo et accent d'un modèle (pages invité,
                          aperçu des liens, e-mails)
    categories.js  code-starter.js
  email/                  Transport SMTP, socle commun, invitation, billet,
                          bienvenue
  pdf/                    Liste des invités, billet
  media/                  Règles d'upload, préparation des photos et vidéos
  landing/                Données publiques et événement d'exemple de l'accueil
  tickets.js              Codes de billet, places
  qr.js                   QR codes (serveur uniquement)
  itinerary.js            Étapes, validation, liens de navigation
  geocoding.js            Recherche de lieux (Photon, navigateur uniquement)
  site.js                 Adresse publique, contacts (email, WhatsApp), limites
  auth/  i18n/  prisma.js  utils.js (cn)
hooks/
locales/                  Dictionnaires fr / en (mêmes clés)
prisma/
  schema.prisma
  generated/              Client Prisma généré (ne pas modifier)
  migrations-sql/         Migrations SQL rejouables
  scripts/                Scripts Node ponctuels (migrations, restauration
                          des modèles)
public/
  brand/                  Logos et visuels des réseaux sociaux
```

### Base de données

`prisma/schema.prisma` décrit le schéma ; le client est généré dans
`prisma/generated/` à l'installation.

Les évolutions de la base de production sont des fichiers SQL **rejouables**
(`IF NOT EXISTS`, reprises ciblées) dans `prisma/migrations-sql/`, à
appliquer dans l'ordre. Chaque fichier passe dans une transaction : tout est
écrit, ou rien.

```bash
node --env-file=.env prisma/scripts/apply-sql.mjs prisma/migrations-sql/007-event-itinerary.sql
```

| Fichier | Contenu |
|---|---|
| `001-better-auth.sql` | Passage de l'authentification JWT à better-auth |
| `002-template-category.sql` | Catégorie des modèles |
| `003-event-contact-phone.sql` | Numéro de contact de l'événement |
| `004-guest-ticket-checkin.sql` | Places, code de billet, arrivée, lien d'accueil |
| `005-guestbook-photos.sql` | Livre d'or et photos des invités |
| `006-event-photo-videos.sql` | Vidéos des invités |
| `007-event-itinerary.sql` | Itinéraire de l'événement |

Pour une nouvelle évolution : modifiez `schema.prisma`, écrivez le fichier
SQL suivant en le rendant rejouable, appliquez-le, puis relancez
`npx prisma generate`.

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
- **Partage** : un modèle publié (terminé) ou mis en avant a une page
  publique, `/templates/[id]`, ouverte sans compte et listée dans le
  sitemap. Il apparaît aussi dans la collection `/templates`. Le bouton de
  partage (accueil, page Modèles) en donne le lien ; les brouillons et les
  copies d'événement n'en ont jamais (`getPublicTemplate`,
  `getCollectionTemplates`, `lib/landing/data.js`).

Ce qu'un modèle peut utiliser (voir `lib/invitation/document.js`) :

- **Jetons**, remplacés par les valeurs de l'événement : `{{GUEST_NAME}}`,
  `{{EVENT_TITLE}}`, `{{EVENT_DATE}}`, `{{TIME}}`, `{{EVENT_LOCATION}}` (ou
  `{{LOCATION}}`, le lieu de la première étape de l'itinéraire),
  `{{DRESS_CODE}}`, `{{EVENT_DESCRIPTION}}`, `{{CUSTOM_MESSAGE}}`,
  `{{CONTACT_PHONE}}`, `{{COUNTDOWN_DATE}}` (pour un compte à rebours) et
  `{{MONOGRAM}}`.
- **Numéro de contact** : s'il est renseigné sur l'événement, il est ajouté
  au pied de chaque invitation, au-dessus de la signature, avec un lien
  `tel:`. Un modèle qui place lui-même `{{CONTACT_PHONE}}` ne le reçoit pas
  une seconde fois.
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
  montre comment. Le nombre de personnes, le régime et le mot pour les hôtes
  sont demandés ensuite par la plateforme, hors du modèle.
- **Photos importées** : un filet de sécurité de spécificité nulle
  (`:where(img, video)`) les empêche de déborder et les recadre au lieu de
  les déformer. La moindre règle du modèle l'emporte.
- **Signature** : la plateforme ajoute « Développé par Invyra » (lien vers le
  site) dans le dernier `<footer>` du modèle, dont elle prend la police et la
  couleur, avec `--c-accent` et `--c-accent2` pour ses touches de couleur.
  Sans `<footer>`, elle est ajoutée en fin de page. Les vignettes n'en ont
  pas. Un modèle n'a donc pas à écrire sa propre mention.

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
  Côté invité et accueil, le jeton reçu est revérifié à chaque appel.
- Après une mutation depuis un composant client, appelez `router.refresh()`
  plutôt que de maintenir une copie locale de l'état serveur.
- Les confirmations destructrices passent par `AlertDialog`, jamais par
  `confirm()`.
- Un module partagé entre client et serveur (`lib/tickets.js`,
  `lib/itinerary.js`, `lib/media/memories.js`…) reste pur : pas d'accès à la
  base ni au navigateur. Ce qui est réservé au serveur importe
  `server-only` (`lib/qr.js`).
- Les envois lents (e-mails après une réponse ou une inscription) passent par
  `after()` : la réponse à l'utilisateur ne les attend pas.

---

## Commandes

```bash
pnpm dev      # serveur de développement
pnpm build    # build de production
pnpm start    # démarrage du build
pnpm lint     # ESLint
```
