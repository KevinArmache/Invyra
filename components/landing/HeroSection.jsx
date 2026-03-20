"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { useTranslation } from "@/utils/i18n/Context";
import { Canvas } from "@react-three/fiber";
import { useTheme } from "next-themes";
import Icosahedron from "@/components/3d/Icosahedron";
import YoRHaSatelliteRings from "@/components/3d/YoRHaSatelliteRings";

function ScrollIndicator({ className }) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1, delay: 1.2 }}
    >
      <div className="flex h-10 w-6 items-start justify-center rounded-full border-2 border-muted-foreground/40 bg-background/40 p-2 backdrop-blur-sm">
        <motion.div
          className="h-1.5 w-1.5 rounded-full bg-primary"
          animate={{ y: [0, 12, 0] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>
    </motion.div>
  );
}

export default function HeroSection() {
  const [mounted, setMounted] = useState(false);
  const { t } = useTranslation();
  const { theme } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,var(--tw-gradient-stops))] from-primary/10 via-background to-background" />

      {/* 3D Background */}
      {mounted && (
        <div className="absolute inset-0 z-0 pointer-events-none opacity-60">
          <Canvas camera={{ position: [0, 0, 10], fov: 45 }}>
            <ambientLight intensity={0.5} />
            <pointLight position={[10, 10, 10]} intensity={1} />
            {theme === "light" ? (
              <YoRHaSatelliteRings color="#000000" />
            ) : (
              <Icosahedron color="#d4af37" />
            )}
          </Canvas>
        </div>
      )}

      {/* Content */}
      <div className="relative z-10 text-center px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto pt-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary mb-8">
            <Sparkles size={16} />
            <span className="text-sm font-medium">
              {t("landing.hero.tagline")}
            </span>
          </div>
        </motion.div>

        <motion.h1
          className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-foreground mb-6 text-balance"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          {t("landing.hero.title_1")}{" "}
          <span className="text-gradient">
            {t("landing.hero.title_highlight")}
          </span>
        </motion.h1>

        <motion.p
          className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 text-pretty"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
        >
          {t("landing.hero.subtitle")}
        </motion.p>

        <motion.div
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
        >
          <Button size="lg" asChild className="group">
            <Link href="/register">
              {t("landing.hero.cta_primary")}
              <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </Button>
          <Button size="lg" variant="outline" asChild>
            <Link href="#how-it-works">{t("landing.hero.cta_secondary")}</Link>
          </Button>
        </motion.div>

        {/* Stats */}
        <motion.div
          className="mt-20 grid grid-cols-3 gap-8 max-w-2xl mx-auto"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.8 }}
        >
          <div className="text-center">
            <div className="text-3xl sm:text-4xl font-bold text-primary">
              {t("landing.hero.stats.events_value")}
            </div>
            <div className="text-sm text-muted-foreground mt-1">
              {t("landing.hero.stats.events")}
            </div>
          </div>
          <div className="text-center">
            <div className="text-3xl sm:text-4xl font-bold text-primary">
              {t("landing.hero.stats.rsvp_value")}
            </div>
            <div className="text-sm text-muted-foreground mt-1">
              {t("landing.hero.stats.rsvp")}
            </div>
          </div>
          <div className="text-center">
            <div className="text-3xl sm:text-4xl font-bold text-primary">
              {t("landing.hero.stats.themes_value")}
            </div>
            <div className="text-sm text-muted-foreground mt-1">
              {t("landing.hero.stats.themes")}
            </div>
          </div>
        </motion.div>
      </div>

      {/* Scroll indicator (mobile/tablet) */}
      <ScrollIndicator className="absolute bottom-8 left-1/2 z-20 -translate-x-1/2 lg:hidden" />

      {/* Scroll indicators (desktop only) */}
      <ScrollIndicator className="absolute bottom-8 left-6 z-20 hidden lg:block" />
      <ScrollIndicator className="absolute bottom-8 right-6 z-20 hidden lg:block" />
    </section>
  );
}
