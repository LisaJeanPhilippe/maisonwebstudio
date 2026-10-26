"use client";

import { useEffect, useRef, useState, type DragEvent } from "react";
import type { UploadedFile } from "@/lib/order-schema";
import { Close, FileIcon, Upload } from "@/components/ui/icons";
import { StepHeader, TextArea } from "./fields";
import type { StepProps } from "./steps";

const MAX_FILES = 15;
const MAX_BYTES = 15 * 1024 * 1024;
const ACCEPT =
  ".png,.jpg,.jpeg,.webp,.gif,.svg,.heic,.avif,.pdf,.doc,.docx,.txt,.rtf,.md,.ai,.eps,.psd,.fig,.sketch,.zip,.mp4,.mov";

type Pending = { key: string; name: string; progress: number; error?: string };

function formatBytes(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function uploadFile(file: File, onProgress: (p: number) => void): Promise<UploadedFile> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const form = new FormData();
    form.append("file", file);
    xhr.open("POST", "/api/uploads");
    xhr.upload.onprogress = (e) => e.lengthComputable && onProgress(e.loaded / e.total);
    xhr.onload = () => {
      try {
        const body = JSON.parse(xhr.responseText);
        if (xhr.status >= 200 && xhr.status < 300) resolve(body as UploadedFile);
        else reject(new Error(body.error || "Upload failed."));
      } catch {
        reject(new Error("Upload failed."));
      }
    };
    xhr.onerror = () => reject(new Error("Network error — please try again."));
    xhr.send(form);
  });
}

export function AssetsStep({
  draft,
  update,
  errors,
  onBusyChange,
}: StepProps & { onBusyChange: (busy: boolean) => void }) {
  const input = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState<Pending[]>([]);
  const [dragging, setDragging] = useState(false);
  const busy = pending.some((p) => !p.error);
  useEffect(() => onBusyChange(busy), [busy, onBusyChange]);

  const handleFiles = (list: FileList | null) => {
    if (!list) return;
    const room = MAX_FILES - draft.files.length - pending.filter((p) => !p.error).length;
    Array.from(list).forEach((file, i) => {
      const key = `${file.name}-${file.size}-${Date.now()}-${i}`;
      if (i >= room) {
        setPending((p) => [...p, { key, name: file.name, progress: 0, error: `Limit of ${MAX_FILES} files reached.` }]);
        return;
      }
      if (file.size > MAX_BYTES) {
        setPending((p) => [...p, { key, name: file.name, progress: 0, error: "Larger than 15 MB." }]);
        return;
      }
      setPending((p) => [...p, { key, name: file.name, progress: 0 }]);
      uploadFile(file, (progress) =>
        setPending((p) => p.map((x) => (x.key === key ? { ...x, progress } : x))),
      )
        .then((uploaded) => {
          update((d) => ({ files: [...d.files, uploaded] }));
          setPending((p) => p.filter((x) => x.key !== key));
        })
        .catch((err: Error) =>
          setPending((p) => p.map((x) => (x.key === key ? { ...x, error: err.message } : x))),
        );
    });
  };

  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    setDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  return (
    <>
      <StepHeader
        step="Step 5 of 6"
        title="Share your brand assets."
        description="Logo, photos, existing copy, menus or brochures — anything that helps us capture your business. You can also send files later."
      />

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={`relative flex flex-col items-center justify-center rounded-[var(--radius-lg)] border border-dashed px-6 py-14 text-center transition-colors duration-300 ${
          dragging ? "border-ink bg-surface" : "border-line-strong bg-surface/60"
        }`}
      >
        <span className="grid h-12 w-12 place-items-center rounded-full bg-canvas ring-1 ring-line">
          <Upload size={18} />
        </span>
        <p className="mt-5 font-medium">Drag files here, or</p>
        <button type="button" className="btn btn-secondary btn-sm mt-3" onClick={() => input.current?.click()}>
          Browse files
        </button>
        <p className="mt-4 text-[13px] text-muted">
          Images, PDFs, documents, design files or ZIPs · up to 15 MB each · max {MAX_FILES} files
        </p>
        <input
          ref={input}
          type="file"
          multiple
          accept={ACCEPT}
          className="sr-only"
          aria-label="Upload files"
          onChange={(e) => {
            handleFiles(e.target.files);
            e.target.value = "";
          }}
        />
      </div>

      {(draft.files.length > 0 || pending.length > 0) && (
        <ul className="mt-6 divide-y divide-line overflow-hidden rounded-[var(--radius-md)] border border-line bg-surface" aria-live="polite">
          {draft.files.map((f) => (
            <li key={f.id} className="flex items-center gap-4 px-5 py-4">
              <FileIcon size={18} className="shrink-0 text-muted" />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[14.5px]">{f.name}</span>
                <span className="text-[12.5px] text-muted">{formatBytes(f.size)} · Uploaded</span>
              </span>
              <button
                type="button"
                onClick={() => update({ files: draft.files.filter((x) => x.id !== f.id) })}
                className="grid h-8 w-8 place-items-center rounded-full text-muted hover:bg-canvas hover:text-ink"
                aria-label={`Remove ${f.name}`}
              >
                <Close size={13} />
              </button>
            </li>
          ))}
          {pending.map((p) => (
            <li key={p.key} className="flex items-center gap-4 px-5 py-4">
              <FileIcon size={18} className={`shrink-0 ${p.error ? "text-danger" : "text-muted"}`} />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[14.5px]">{p.name}</span>
                {p.error ? (
                  <span className="text-[12.5px] text-danger">{p.error}</span>
                ) : (
                  <span className="mt-2 block h-1 overflow-hidden rounded-full bg-line">
                    <span
                      className="block h-full rounded-full bg-ink transition-[width] duration-200"
                      style={{ width: `${Math.round(p.progress * 100)}%` }}
                    />
                  </span>
                )}
              </span>
              {p.error && (
                <button
                  type="button"
                  onClick={() => setPending((list) => list.filter((x) => x.key !== p.key))}
                  className="grid h-8 w-8 place-items-center rounded-full text-muted hover:bg-canvas hover:text-ink"
                  aria-label={`Dismiss ${p.name}`}
                >
                  <Close size={13} />
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
      {errors.files && <p className="field-error">{errors.files}</p>}

      <div className="mt-10">
        <TextArea
          id="assetNotes"
          label="Notes about your assets"
          optional
          rows={3}
          placeholder="e.g. Photos are in a Google Drive folder — link here"
          value={draft.assetNotes}
          onChange={(e) => update({ assetNotes: e.target.value })}
          maxLength={1000}
          error={errors.assetNotes}
        />
      </div>
    </>
  );
}
