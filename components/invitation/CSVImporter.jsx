"use client";

import { useRef, useState } from "react";
import { AlertTriangle, Check, Upload, Users } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

const EXAMPLE = `Marie Dupont,marie@exemple.com,+33600000001
Jean Martin,jean@exemple.com
Sophie Bernard,sophie@exemple.com,+33600000003`;

const HEADER_WORDS = ["nom", "name", "email", "e-mail", "mail"];

/**
 * Découpe une ligne CSV en respectant les guillemets.
 *
 * Un simple `split(",")` coupait au milieu de `"Dupont, Marie"` et renvoyait
 * des champs décalés : un cas courant dès qu'un tableur exporte des noms
 * contenant une virgule. Les guillemets doublés (`""`) valent un guillemet.
 */
function splitRow(line) {
  const fields = [];
  let current = "";
  let inQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];

    if (inQuotes) {
      if (char === '"') {
        if (line[index + 1] === '"') {
          current += '"';
          index += 1;
        } else {
          inQuotes = false;
        }
      } else {
        current += char;
      }
      continue;
    }

    if (char === '"') {
      inQuotes = true;
    } else if (char === "," || char === ";" || char === "\t") {
      fields.push(current);
      current = "";
    } else {
      current += char;
    }
  }

  fields.push(current);
  return fields.map((field) => field.trim());
}

/** Une première ligne qui ne contient que des intitulés est un en-tête. */
function looksLikeHeader(fields) {
  const [first, second] = fields;
  if (!second || second.includes("@")) return false;
  return HEADER_WORDS.some((word) => first.toLowerCase().includes(word));
}

function parseCsv(text) {
  const rows = text
    .trim()
    .split(/\r?\n/)
    .filter((line) => line.trim().length > 0);

  const guests = [];
  const errors = [];

  rows.forEach((line, index) => {
    const fields = splitRow(line);

    if (index === 0 && looksLikeHeader(fields)) return;

    const [name, email, phone] = fields;

    if (!name || !email) {
      errors.push(`Ligne ${index + 1} : nom ou email manquant`);
      return;
    }
    if (!email.includes("@") || email.startsWith("@") || email.endsWith("@")) {
      errors.push(`Ligne ${index + 1} : email invalide (${email})`);
      return;
    }

    guests.push({ name, email, phone: phone || null });
  });

  return { guests, errors };
}

export default function CSVImporter({ onImport, loading = false }) {
  const [text, setText] = useState("");
  const [preview, setPreview] = useState(null);
  const fileInputRef = useRef(null);

  function updateText(value) {
    setText(value);
    setPreview(null);
  }

  async function handleFile(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    updateText(await file.text());
    // Permet de re-sélectionner le même fichier après correction.
    event.target.value = "";
  }

  const lineCount = text.trim() ? text.trim().split(/\r?\n/).length : 0;

  return (
    <div className="space-y-3">
      <p className="text-xs leading-relaxed text-ink-400">
        Une ligne par invité :{" "}
        <code className="rounded bg-secondary px-1 py-0.5 text-ink-300">
          Nom,Email,Téléphone
        </code>
        . Le téléphone est facultatif et une ligne d&apos;en-tête est ignorée.
      </p>

      <div className="flex flex-wrap gap-2">
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,text/csv,text/plain"
          onChange={handleFile}
          className="sr-only"
          id="csv-file"
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload className="mr-1.5 h-3.5 w-3.5" />
          Choisir un fichier
        </Button>

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setPreview(parseCsv(text))}
          disabled={!text.trim()}
        >
          <Users className="mr-1.5 h-3.5 w-3.5" />
          Vérifier ({lineCount})
        </Button>
      </div>

      <Textarea
        value={text}
        onChange={(event) => updateText(event.target.value)}
        placeholder={EXAMPLE}
        rows={6}
        aria-label="Contenu CSV"
        className="font-mono text-xs"
      />

      {preview && (
        <div className="overflow-hidden rounded-md border border-border">
          {preview.errors.length > 0 && (
            <ul className="space-y-1 border-b border-destructive/20 bg-destructive/10 p-3">
              {preview.errors.map((error) => (
                <li
                  key={error}
                  className="flex items-start gap-1.5 text-xs text-destructive"
                >
                  <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0" />
                  {error}
                </li>
              ))}
            </ul>
          )}

          {preview.guests.length > 0 && (
            <ul className="max-h-40 space-y-1 overflow-y-auto p-3">
              {preview.guests.map((guest) => (
                <li
                  key={guest.email}
                  className="flex items-center gap-2 text-xs"
                >
                  <Check className="h-3 w-3 shrink-0 text-positive" />
                  <span className="truncate text-ink-100">{guest.name}</span>
                  <span className="ml-auto truncate text-ink-400">
                    {guest.email}
                  </span>
                </li>
              ))}
            </ul>
          )}

          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border/60 bg-ink-800/40 px-3 py-2">
            <p className="text-xs text-ink-400">
              <span data-numeric className="text-positive">
                {preview.guests.length}
              </span>{" "}
              valides ·{" "}
              <span data-numeric className="text-destructive">
                {preview.errors.length}
              </span>{" "}
              en erreur
            </p>
            <Button
              type="button"
              size="sm"
              onClick={() => onImport(preview.guests)}
              disabled={preview.guests.length === 0 || loading}
            >
              <Upload className="mr-1.5 h-3 w-3" />
              {loading ? "Import…" : `Importer ${preview.guests.length}`}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
