# Invyra

Plateforme de création et d'envoi d'invitations d'événement. L'organisateur
compose son faire-part en HTML, CSS et JavaScript, l'envoie par email ou
WhatsApp avec un lien nominatif par invité, et suit les réponses en temps réel.

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

Gérée par [better-auth](https://better-auth.com) (`utils/auth/server.js`).

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
node --env-file=.env prisma/migrate-passwords.mjs --dry   # aperçu
node --env-file=.env prisma/migrate-passwords.mjs         # application
```

Une fois tous les comptes migrés, `legacyPassword` peut être retiré du schéma.

### Internationalisation

Français et anglais, dictionnaires dans `locales/`.

La langue vient du cookie `invyra_locale`, résolu **sur le serveur**
(`utils/i18n/server.js`) : le HTML part déjà traduit et `<html lang>` est
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
`.eyebrow`, `.text-gold`, `.grain`, `.reveal`.

Les primitives d'écran (`PageHeader`, `StatCard`, `Panel`, `EmptyState`,
`StatusBadge`) sont dans `components/dashboard/ui.jsx`.

---

## Organisation

```
app/
  actions/          Server actions — toute la logique métier et les accès DB
  dashboard/        Espace connecté (Server Components)
  admin/            Administration, même coquille que le dashboard
  invite/[token]/   Page publique d'invitation
  api/auth/[...all] Routes better-auth
components/
  landing/          Page d'accueil
  dashboard/        Écrans connectés + primitives partagées (ui.jsx)
  invitation/       Éditeur de code, aperçu, import CSV
  ui/               shadcn/ui
utils/
  auth/             Configuration better-auth (serveur et client)
  i18n/             Résolution de langue serveur + contexte client
prisma/
  schema.prisma
  migrate-passwords.mjs
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
