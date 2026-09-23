import { headers } from "next/headers";

import { auth } from "@/utils/auth/server";
import {
  getBookedDates,
  getShowcaseTemplates,
  todayKey,
} from "@/utils/landing";
import { sampleEvent } from "@/lib/invitation/sample";
import Navbar from "@/components/landing/Navbar";
import HeroSection from "@/components/landing/HeroSection";
import FeaturesSection from "@/components/landing/FeaturesSection";
import TemplatesShowcase from "@/components/landing/TemplatesShowcase";
import HowItWorksSection from "@/components/landing/HowItWorksSection";
import AvailabilityCalendar from "@/components/landing/AvailabilityCalendar";
import PricingSection from "@/components/landing/PricingSection";
import Footer from "@/components/landing/Footer";

/** Destinataire des demandes de réservation envoyées depuis le calendrier. */
const CONTACT_EMAIL = process.env.CONTACT_EMAIL || "kevinarmache@gmail.com";

export default async function HomePage() {
  // Lue sur le serveur : la barre s'affiche d'emblée dans le bon état, au lieu
  // de basculer de « Se connecter » à « Tableau de bord » après l'hydratation.
  const [session, showcase, bookedDates] = await Promise.all([
    auth.api.getSession({ headers: await headers() }),
    getShowcaseTemplates(),
    getBookedDates(),
  ]);

  return (
    <>
      <Navbar
        isAuthenticated={Boolean(session?.user)}
        hasShowcase={showcase.length > 0}
      />
      <main>
        <HeroSection />
        <FeaturesSection />
        <TemplatesShowcase templates={showcase} sample={sampleEvent()} />
        <HowItWorksSection />
        <AvailabilityCalendar
          bookedDates={bookedDates}
          today={todayKey()}
          contactEmail={CONTACT_EMAIL}
        />
        <PricingSection />
      </main>
      <Footer />
    </>
  );
}
