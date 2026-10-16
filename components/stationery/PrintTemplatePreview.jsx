"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ExternalLink, FileDown, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import PaperFace from "@/components/stationery/PaperFace";
import { downloadFile } from "@/lib/download";
import { mainPiece, normalizePrintConfig } from "@/lib/print/config";
import { formatDimensions } from "@/lib/print/formats";
import { getFinish } from "@/lib/print/options";
import { samplePrintEvent } from "@/lib/print/sample";
import { useTranslation } from "@/lib/i18n/Context";

/**
 * Aperçu d'un modèle papier dans la galerie des admins : toutes ses faces,
 * puis les fichiers de l'imprimeur (route /dashboard/templates/[id]/print) :
 * bon à tirer, fichier HD en carte seule ou en planche, calques de finition.
 *
 * @param {object | null} props.template  modèle ouvert, ou null (fermé)
 */
export default function PrintTemplatePreview({ template, onOpenChange, canShare = false }) {
  const { t } = useTranslation();
  const s = (key) => t(`stationery.${key}`);
  const [downloading, setDownloading] = useState(null);
  const config = useMemo(() => normalizePrintConfig(template?.config), [template]);
  const event = useMemo(() => samplePrintEvent(template?.category), [template]);
  const { format } = mainPiece(config);

  const files = [
    { key: "proof", query: "mode=proof" },
    { key: "print_single", query: "mode=print&layout=single" },
    { key: "print_a4", query: "mode=print&layout=a4" },
    { key: "print_a3", query: "mode=print&layout=a3" },
    { key: "print_sra3", query: "mode=print&layout=sra3" },
  ];
  const layers = [...new Set((config?.finishes ?? []).map((id) => getFinish(id)?.layer).filter(Boolean))];
  for (const layer of layers) {
    files.push({ key: `layer_${layer}`, query: `mode=print&layout=single&layer=${layer}` });
  }

  async function download(file) {
    setDownloading(file.key);
    try {
      await downloadFile(`/dashboard/templates/${template.id}/print?${file.query}`, `${file.key}.pdf`);
    } catch {
      toast.error(t("invite.pdf_error"));
    } finally {
      setDownloading(null);
    }
  }

  return (
    <Dialog open={Boolean(template)} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92dvh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>{template?.name}</DialogTitle>
          {format && (
            <DialogDescription>
              {s(`formats.${format.id}`)} · <span data-numeric>{formatDimensions(format.trim)}</span>
            </DialogDescription>
          )}
        </DialogHeader>

        {format && (
          <ul className={`grid gap-4 ${format.faces.length > 2 ? "grid-cols-2" : "grid-cols-2"}`}>
            {format.faces.map((face) => (
              <li key={face}>
                <div className="overflow-hidden rounded-[3px] shadow-[0_10px_30px_-12px_rgb(0_0_0/0.8)] ring-1 ring-white/10">
                  <PaperFace config={config} face={face} event={event} animated={false} lazy={false} />
                </div>
                <p className="mt-2 text-center text-xs text-ink-400">{s(`faces.${face}`)}</p>
              </li>
            ))}
          </ul>
        )}

        <div className="border-t border-border/60 pt-4">
          <p className="eyebrow">{s("files_title")}</p>
          <p className="mt-1 text-xs text-ink-400">{s("files_desc")}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {files.map((file) => (
              <Button
                key={file.key}
                size="sm"
                variant={file.key === "print_single" ? "default" : "outline"}
                onClick={() => download(file)}
                disabled={downloading !== null}
              >
                {downloading === file.key ? <Loader2 className="animate-spin" /> : <FileDown />}
                {s(`files.${file.key}`)}
              </Button>
            ))}
          </div>
        </div>

        {canShare && template && (
          <Button asChild variant="ghost" size="sm" className="justify-self-start text-ink-400 hover:text-gold">
            <Link href={`/stationery/${template.id}`} target="_blank">
              <ExternalLink />
              {t("public_template.open_page")}
            </Link>
          </Button>
        )}
      </DialogContent>
    </Dialog>
  );
}
