import {
  BarChart3,
  Calendar,
  LayoutDashboard,
  LayoutTemplate,
  Settings,
  Shield,
} from "lucide-react";

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
