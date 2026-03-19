# Invyra - Custom HTML/JS Event Invitations

[![Next.js](https://img.shields.io/badge/Next.js-15-black?logo=next.js)](https://nextjs.org/)
[![Prisma](https://img.shields.io/badge/Prisma-ORM-2D3748?logo=prisma)](https://www.prisma.io/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?logo=tailwind-css)](https://tailwindcss.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?logo=mongodb)](https://www.mongodb.com/)

[🌍 Français](#français) | [🇬🇧 English](#english)

---

<br/>

<a name="english"></a>
# 🇬🇧 English Documentation

**Invyra** is a modern, premium SaaS platform for creating, managing, and sending event invitations. Built with Next.js and Prisma, it allows users to effortlessly manage their guest lists, customize invitation templates using standard HTML/CSS/JS, and track RSVPs in real-time.

## ✨ Core Features

* **Custom Invitations:** Create completely bespoke invitation designs using clean HTML, CSS, and simple JavaScript for a tailored experience.
* **Comprehensive Event Management:** Create events with detailed info (date, location, time, dress code, custom message).
* **Guest List & RSVP Tracking:** 
  * Add guests manually or import them via `.csv`.
  * Send invitations directly via **Email** (Nodemailer template "Le Gar") or **WhatsApp**.
  * Real-time tracking of RSVPs (Attending, Pending, Declined).
  * Fast search functionality by name or email.
* **Fully Bilingual:** Native support for English and French seamlessly across the landing page and dashboard.
* **Security & Account Management:**
  * JWT-based authentication with bcrypt-hashed passwords.
  * Role-based access control (Admin vs. User).
  * Safely delete user accounts with a cascading delete of events/guests, while intelligently preserving community templates.
* **Collaborators:** Invite co-hosts with "editor" or "viewer" roles to help manage your event.

## 🛠 Tech Stack

* **Framework:** Next.js 15 (App Router, Server Actions)
* **Database / ORM:** MongoDB Atlas & Prisma
* **Styling:** Tailwind CSS + Shadcn UI components
* **Animation:** Smooth UI transitions and interactions using Framer Motion (Dashboard)
* **Email Provider:** Nodemailer (SMTP configuration for Gmail/Custom)
* **Icons:** Lucide React

## 🚀 Getting Started

### 1. Clone & Install
```bash
git clone https://github.com/KevinArmache/Invyra.git
cd Invyra
pnpm install
```

### 2. Environment Variables (.env)
Create a `.env` file at the root of the project:
```env
DATABASE_URL="mongodb+srv://<USER>:<PASSWORD>@cluster.mongodb.net/invyra"
JWT_SECRET="your-ultra-secure-jwt-secret-key"

SMTP_HOST="smtp.gmail.com"
SMTP_PORT="465"
SMTP_USER="your.email@gmail.com"
SMTP_PASS="your-app-password"

NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### 3. Database Initialization
```bash
npx prisma generate
npx prisma db push
```

### 4. Run Locally
```bash
pnpm dev
# Open http://localhost:3000 in your browser
```

---

<br/>

<a name="français"></a>
# 🌍 Documentation Française

**Invyra** est une plateforme SaaS moderne et premium dédiée à la création, la gestion et l'envoi d'invitations événementielles. Construite sur Next.js et Prisma, l'application permet de gérer facilement vos listes d'invités, de personnaliser des modèles d'invitations via du HTML/CSS/JS pur, et de suivre vos confirmations (RSVP) en temps réel.

## ✨ Fonctionnalités Principales

* **Invitations Personnalisées :** Créez des designs d'invitations totalement sur-mesure en utilisant des standards du web (HTML, CSS et JavaScript simples) pour une flexibilité totale.
* **Gestion Avancée d'Événements :** Créez des événements détaillés (date, lieu, heure, dress code, message sur mesure).
* **Liste d'Invités et Suivi RSVP :**
  * Ajout manuel ou importation massive via fichiers `.csv`.
  * Envoi d'invitations directes par **Email** (magnifique template HTML "Le Gar") ou par **WhatsApp**.
  * Suivi des réponses en temps réel (Confirmé, En attente, Décliné).
  * Barre de recherche rapide par nom ou email.
* **100% Bilingue :** Support natif de l'Anglais et du Français sur la Landing Page et le Dashboard.
* **Sécurité & Gestion de Compte :**
  * Authentification basée sur des JWT sécurisés (mots de passe hachés avec bcrypt).
  * Gestion par Rôles (Admin vs Utilisateur).
  * Suppression sécurisée de compte : l'utilisateur peut supprimer ses données personnelles (suppression en cascade des événements et invités), mais l'application préserve les modèles (`Templates`) communautaires en les réassignant aux administrateurs.
* **Collaborateurs :** Invitez des co-organisateurs avec des droits de "visiualisation" ou "d'édition".

## 🛠 Stack Technique

* **Framework :** Next.js 15 (App Router, Server Actions)
* **Base de données / ORM :** MongoDB Atlas & Prisma
* **CSS & UI :** Tailwind CSS + Composants Shadcn UI
* **Animations :** Transitions fluides de l'interface via Framer Motion
* **Service Email :** Nodemailer (Configuration SMTP prête pour Gmail SSL etc.)
* **Icônes :** Lucide React

## 🚀 Démarrage Rapide

### 1. Cloner & Installer
```bash
git clone https://github.com/KevinArmache/Invyra.git
cd Invyra
pnpm install
```

### 2. Variables d'Environnement (.env)
Créez un fichier `.env` à la racine :
```env
DATABASE_URL="mongodb+srv://<USER>:<PASSWORD>@cluster.mongodb.net/invyra"
JWT_SECRET="votre-cle-secrete-hyper-longue"

SMTP_HOST="smtp.gmail.com"
SMTP_PORT="465"
SMTP_USER="votre.email@gmail.com"
SMTP_PASS="votre-mot-de-passe-d-application"

NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### 3. Initialisation Base de Données
```bash
npx prisma generate
npx prisma db push
```

### 4. Lancement Serveur de Développement
```bash
pnpm dev
# Ouvrez http://localhost:3000 dans votre navigateur web
```

## 📜 Déploiement Vercel

Le projet est configuré pour être parfaitement déployé sur **Vercel**. 
Assurez-vous d'ajouter vos variables d'environnement dans les *Settings* du projet Vercel et de vérifier que l'IP de Vercel (`0.0.0.0/0`) est autorisée dans la section *Network Access* (Liste Blanche) de votre cluster **MongoDB Atlas**.
Le fichier `package.json` contient déjà le script `"postinstall": "prisma generate"` nécessaire au déploiement sans erreurs.
