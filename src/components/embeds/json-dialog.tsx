"use client";

import { Download, FileJson, Upload, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { CopyButton } from "@/components/ui/copy-button";
import { Textarea } from "@/components/ui/field";
import type { MessagePayload } from "@/lib/bot-api/types";
import { exportPayload, parseImport } from "@/lib/embeds/payload";

export function JsonDialog({
  payload,
  onImport,
}: {
  payload: MessagePayload;
  onImport: (payload: MessagePayload) => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    const reset = () => setError(null);
    dialog?.addEventListener("close", reset);
    return () => dialog?.removeEventListener("close", reset);
  }, []);

  const open = () => {
    setText(exportPayload(payload));
    setError(null);
    dialogRef.current?.showModal();
  };

  const importText = () => {
    const result = parseImport(text);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    onImport(result.payload);
    dialogRef.current?.close();
    toast.success("JSON importiert.");
  };

  const download = () => {
    const url = URL.createObjectURL(new Blob([text], { type: "application/json" }));
    const link = Object.assign(document.createElement("a"), { href: url, download: "nachricht.json" });
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <Button type="button" variant="secondary" onClick={open}>
        <FileJson />
        JSON
      </Button>
      <dialog
        ref={dialogRef}
        className="m-auto w-[min(720px,calc(100vw-2rem))] rounded-2xl border border-border-strong bg-surface p-0 text-text shadow-2xl backdrop:bg-black/60"
      >
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <div>
            <h2 className="font-bold">JSON importieren / exportieren</h2>
            <p className="mt-0.5 text-sm text-muted">
              Discord-Format, kompatibel mit Discohook. Zum Importieren einfach einfügen.
            </p>
          </div>
          <button
            type="button"
            onClick={() => dialogRef.current?.close()}
            className="rounded-lg p-1.5 text-faint hover:bg-surface-2 hover:text-text"
            aria-label="Schließen"
          >
            <X className="size-5" />
          </button>
        </div>
        <div className="p-6">
          <Textarea
            value={text}
            onChange={(event) => {
              setText(event.target.value);
              setError(null);
            }}
            spellCheck={false}
            className="h-80 font-mono text-[13px]"
            aria-label="JSON"
          />
          {error && <p className="mt-2 text-sm font-medium text-danger">{error}</p>}
        </div>
        <div className="flex flex-wrap justify-between gap-2 border-t border-border bg-surface-2/50 px-6 py-4">
          <div className="flex gap-2">
            <CopyButton value={text} label="Kopieren" variant="secondary" size="md" />
            <Button type="button" variant="ghost" onClick={download}>
              <Download />
              Herunterladen
            </Button>
          </div>
          <Button type="button" onClick={importText}>
            <Upload />
            Importieren
          </Button>
        </div>
      </dialog>
    </>
  );
}
