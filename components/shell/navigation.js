import {
  ArrowLeft,
  BarChart3,
  Calendar,
  LayoutDashboard,
  LayoutTemplate,
  Settings,
  Shield,
  Users,
} from "lucide-react";

/**
 * Menus de l'espace connecté. Ils sont lus par DashboardShell, côté client :
 * leurs icônes sont des composants, donc des fonctions, qu'un layout serveur
 * ne peut pas lui passer en propriété. Un layout choisit son menu par son nom
 * (`section`).
 */

export const NAVIGATION = [
  {
    href: "/dashboard",
    icon: LayoutDashboard,
    key: "portal.sidebar.dashboard",
    exact: true,
  },
  { href: "/dashboard/events", icon: Calendar, key: "portal.sidebar.events" },
  {
    href: "/dashboard/templates",
    icon: LayoutTemplate,
    key: "portal.sidebar.templates",
  },
  {
    href: "/dashboard/analytics",
    icon: BarChart3,
    key: "portal.sidebar.analytics",
  },
  {
    href: "/dashboard/settings",
    icon: Settings,
    key: "portal.sidebar.settings",
  },
];

export const ADMIN_LINK = {
  href: "/admin",
  icon: Shield,
  key: "portal.sidebar.admin",
};

export const ADMIN_NAVIGATION = [
  {
    href: "/admin",
    icon: LayoutDashboard,
    key: "portal.admin.overview",
    exact: true,
  },
  { href: "/admin/users", icon: Users, key: "portal.admin.users" },
];

/** Retour à l'espace principal, en pied du panneau d'administration. */
export const DASHBOARD_LINK = {
  href: "/dashboard",
  icon: ArrowLeft,
  key: "portal.sidebar.dashboard",
};
