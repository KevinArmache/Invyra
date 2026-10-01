/**
 * Accès au code de l'application depuis les scripts Node de ce dossier.
 *
 * Les modules du projet importent leurs voisins par l'alias `@/…` du bundler :
 * des crochets de résolution Node (module.registerHooks, Node 22.15+) le
 * traduisent. Le package n'est pas en "type": "module" : les .js du projet
 * (hors dépendances) sont chargés comme modules ES.
 *
 * La base est lue et écrite en SQL avec `pg` : le client Prisma généré est du
 * TypeScript, que Node n'importe pas tel quel.
 */
import { existsSync, statSync } from "node:fs";
import { registerHooks } from "node:module";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

/** Racine du projet. */
export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const ROOT_URL = pathToFileURL(ROOT).href;

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier.startsWith("@/")) {
      const base = path.join(ROOT, specifier.slice(2));
      for (const file of [base, `${base}.js`, path.join(base, "index.js")]) {
        if (existsSync(file) && statSync(file).isFile()) {
          return { url: pathToFileURL(file).href, format: "module", shortCircuit: true };
        }
      }
    }
    return nextResolve(specifier, context);
  },
  load(url, context, nextLoad) {
    if (url.startsWith(ROOT_URL) && url.endsWith(".js") && !url.includes("/node_modules/")) {
      return nextLoad(url, { ...context, format: "module" });
    }
    return nextLoad(url, context);
  },
});

/** Importe un module du projet par son chemin depuis la racine (« lib/… »). */
export function importApp(relativePath) {
  return import(`${ROOT_URL}/${relativePath}`);
}

/** Arrête le script si la base n'est pas configurée. */
export function requireDatabaseUrl() {
  if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL est absent de l'environnement.");
    process.exit(1);
  }
}
