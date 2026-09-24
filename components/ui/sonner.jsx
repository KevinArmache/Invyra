"use client";

import { Toaster as Sonner } from "sonner";

/**
 * Notifications. L'interface est sombre uniquement (voir globals.css) : les
 * notifications le sont aussi, quel que soit le réglage du système.
 */
const Toaster = ({ ...props }) => {
  return (
    <Sonner
      theme="dark"
      className="toaster group"
      style={{
        "--normal-bg": "var(--popover)",
        "--normal-text": "var(--popover-foreground)",
        "--normal-border": "var(--border)",
      }}
      {...props}
    />
  );
};

export { Toaster };
