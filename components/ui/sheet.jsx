"use client";

import * as DialogPrimitive from "@radix-ui/react-dialog";
import { cn } from "@/lib/utils";

/**
 * Panneau latéral construit sur le Dialog de Radix, comme dialog.jsx (focus
 * piégé, Échap et clic à l'extérieur pour fermer). Sur téléphone il monte
 * depuis le bas de l'écran ; à partir de sm, il glisse depuis la droite sur
 * toute la hauteur.
 */
function Sheet({ ...props }) {
  return <DialogPrimitive.Root data-slot="sheet" {...props} />;
}

function SheetTrigger({ ...props }) {
  return <DialogPrimitive.Trigger data-slot="sheet-trigger" {...props} />;
}

function SheetClose({ ...props }) {
  return <DialogPrimitive.Close data-slot="sheet-close" {...props} />;
}

function SheetContent({ className, children, ...props }) {
  return (
    <DialogPrimitive.Portal data-slot="sheet-portal">
      <DialogPrimitive.Overlay
        data-slot="sheet-overlay"
        className="data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-50 bg-black/60 backdrop-blur-sm duration-300"
      />
      <DialogPrimitive.Content
        data-slot="sheet-content"
        className={cn(
          "data-[state=open]:animate-in data-[state=closed]:animate-out fixed z-50 flex flex-col border-border bg-ink-900 shadow-elevation-3 duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] focus:outline-none",
          "inset-x-0 bottom-0 max-h-[88dvh] rounded-t-2xl border-t data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom",
          "sm:inset-y-0 sm:right-0 sm:left-auto sm:max-h-none sm:w-[26rem] sm:rounded-none sm:border-t-0 sm:border-l sm:data-[state=closed]:slide-out-to-bottom-0 sm:data-[state=closed]:slide-out-to-right sm:data-[state=open]:slide-in-from-bottom-0 sm:data-[state=open]:slide-in-from-right",
          className,
        )}
        {...props}
      >
        {children}
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
}

function SheetTitle({ className, ...props }) {
  return (
    <DialogPrimitive.Title
      data-slot="sheet-title"
      className={cn("font-display text-ink-50", className)}
      {...props}
    />
  );
}

function SheetDescription({ className, ...props }) {
  return (
    <DialogPrimitive.Description
      data-slot="sheet-description"
      className={cn("text-sm text-ink-400", className)}
      {...props}
    />
  );
}

export {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetTitle,
  SheetTrigger,
};
