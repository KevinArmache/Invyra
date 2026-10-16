import { sampleEvent } from "@/lib/landing/sample-event";

/**
 * Événement fictif des aperçus papier (vitrine /stationery, éditeur), selon
 * la catégorie du modèle : une carte d'anniversaire ne porte pas les
 * prénoms d'un couple. La date est celle de sampleEvent, toujours à venir.
 *
 * Module pur, importable côté serveur comme côté client.
 */

const BY_CATEGORY = {
  wedding: {
    title: "Grâce & Junior",
    location: "Salle Les Jardins, Gombe",
    dressCode: "Blanc et or",
    customMessage: "Votre présence sera notre plus beau cadeau.",
  },
  engagement: {
    title: "Nadia & Patrick",
    location: "Villa Malaika, Ngaliema",
    dressCode: "Chic décontracté",
  },
  birthday: {
    title: "Les 30 ans de Maya",
    location: "Rooftop Le Phare, Kinshasa",
    dressCode: "Une touche de couleur",
  },
  babyshower: {
    title: "Baby shower de Ruth",
    location: "Jardin des Hibiscus, Limete",
    dressCode: "Tons pastel",
  },
  baptism: {
    title: "Le baptême d'Élie",
    location: "Paroisse Saint-Joseph, Matonge",
    dressCode: "Tenue blanche",
  },
  party: {
    title: "La grande soirée",
    location: "Le Loft, Gombe",
    dressCode: "Dress code noir",
  },
  gala: {
    title: "Gala des Lumières",
    location: "Hôtel Pullman, Kinshasa",
    dressCode: "Tenue de soirée",
    customMessage: "Une soirée au profit de l'école de musique de Lingwala.",
  },
  corporate: {
    title: "Soirée annuelle Kivu Tech",
    location: "Fleuve Congo Hôtel",
    dressCode: "Tenue d'affaires",
  },
};

/** Nom d'invité des aperçus nominatifs. */
export const SAMPLE_GUEST = "Sophie Mbala";

export function samplePrintEvent(category, now = new Date()) {
  const base = sampleEvent(now);
  const details = BY_CATEGORY[category] ?? BY_CATEGORY.wedding;
  return {
    ...base,
    time: "15h00",
    customMessage: "",
    ...details,
  };
}
