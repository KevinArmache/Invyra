import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/** Fusionne des classes Tailwind (conditions via clsx, conflits via tailwind-merge). */
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}
