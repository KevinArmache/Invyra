import nextCoreWebVitals from "eslint-config-next/core-web-vitals";

/**
 * Le projet déclarait un script `lint` sans configuration ni ESLint installé :
 * la commande échouait depuis toujours.
 *
 * `eslint-config-next` 16 exporte directement un tableau de configuration
 * plate, il n'y a donc pas besoin de passer par `FlatCompat`. Le jeu de règles
 * reste celui de Next, sans ajout maison, pour que les avertissements soient
 * ceux que sa documentation décrit.
 */
const config = [
  {
    ignores: [
      ".next/**",
      "node_modules/**",
      // Code généré par Prisma : on ne le corrige pas, il est réécrit à
      // chaque `prisma generate`.
      "prisma/generated/**",
      // shadcn/ui : composants copiés depuis l'amont, gardés tels quels pour
      // pouvoir les resynchroniser.
      "components/ui/**",
      // Livré par shadcn au même titre que components/ui.
      "hooks/use-mobile.ts",
    ],
  },
  ...nextCoreWebVitals,
];

export default config;
