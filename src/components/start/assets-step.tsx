"use client";

import { useEffect, useRef, useState, type DragEvent } from "react";
import type { UploadedFile } from "@/lib/order-schema";
import { ACCEPTED_EXTENSIONS, MAX_UPLOAD_BYTES, MAX_UPLOAD_FILES } from "@/lib/uploads";
import { Close, FileIcon, Upload } from "@/components/ui/icons";
import { useI18n } from "@/i18n/client";
import { fmt, formatNumber } from "@/i18n/format";
import type { Locale } from "@/i18n/config";
import { StepHeader, TextArea } from "./fields";
import { useStepLabel, type StepProps } from "./steps";

type UploadErrorCode = "limit" | "tooLarge" | "type" | "failed" | "network" | "rateLimited";
type Pending = { key: string; name: string; progress: number; error?: UploadErrorCode };

const ACCEPT = ACCEPTED_EXTENSIONS.map((e) => `.${e}`).join(",");

function formatBytes(locale: Locale, bytes: number) {
  if (bytes < 1024 * 1024) return `${formatNumber(locale, Math.max(1, Math.round(bytes / 1024)))} KB`;
  return `${formatNumber(locale, Math.round((bytes / 1024 / 1024) * 10) / 10)} MB`;
}

class UploadError extends Error {
  constructor(public code: UploadErrorCode) {
    super(code);
  }
}

function uploadFile(file: File, onProgress: (p: number) => void): Promise<UploadedFile> {
  // Static preview builds have no server: keep the file in the browser only.
  if (process.env.NEXT_PUBLIC_STATIC_PREVIEW === "1") {
    onProgress(1);
    return Promise.resolve({ id: crypto.randomUUID(), name: file.name, size: file.size, type: file.type });
  }
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const form = new FormData();
    form.append("file", file);
    xhr.open("POST", "/api/uploads");
    xhr.timeout = 120_000;
    xhr.upload.onprogress = (e) => e.lengthComputable && onProgress(e.loaded / e.total);
    xhr.onload = () => {
      let body: { code?: string } & Partial<UploadedFile> = {};
      try {
        body = JSON.parse(xhr.responseText);
      } catch {
        /* non-JSON error page */
      }
      if (xhr.status >= 200 && xhr.status < 300 && body.id) return resolve(body as UploadedFile);
      if (xhr.status === 413) return reject(new UploadError("tooLarge"));
      if (xhr.status === 415) return reject(new UploadError("type"));
      if (xhr.status === 429) return reject(new UploadError("rateLimited"));
      reject(new UploadError("failed"));
    };
    xhr.onerror = () => reject(new UploadError("network"));
    xhr.ontimeout = () => reject(new UploadError("network"));
    xhr.send(form);
  });
}

export function AssetsStep({
  draft,
  update,
  errors,
  onBusyChange,
}: StepProps & { onBusyChange: (busy: boolean) => void }) {
  const { locale, m } = useI18n();
  const c = m.configurator.assets;
  const stepLabel = useStepLabel("assets");
  const input = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState<Pending[]>([]);
  const [dragging, setDragging] = useState(false);
  const busy = pending.some((p) => !p.error);
  useEffect(() => onBusyChange(busy), [busy, onBusyChange]);

  const errorText = (code: UploadErrorCode) => fmt(c.errors[code], { max: MAX_UPLOAD_FILES });

  const handleFiles = (list: FileList | null) => {
    if (!list) return;
    const room = MAX_UPLOAD_FILES - draft.files.length - pending.filter((p) => !p.error).length;
    Array.from(list).forEach((file, i) => {
      const key = `${file.name}-${file.size}-${Date.now()}-${i}`;
      const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
      const reject = (error: UploadErrorCode) => setPending((p) => [...p, { key, name: file.name, progress: 0, error }]);
      if (i >= room) return reject("limit");
      if (file.size > MAX_UPLOAD_BYTES) return reject("tooLarge");
      if (!(ACCEPTED_EXTENSIONS as readonly string[]).includes(ext)) return reject("type");
      setPending((p) => [...p, { key, name: file.name, progress: 0 }]);
      uploadFile(file, (progress) => setPending((p) => p.map((x) => (x.key === key ? { ...x, progress } : x))))
        .then((uploaded) => {
          update((d) => ({ files: [...d.files, uploaded] }));
          setPending((p) => p.filter((x) => x.key !== key));
        })
        .catch((err: unknown) => {
          const code = err instanceof UploadError ? err.code : "failed";
          setPending((p) => p.map((x) => (x.key === key ? { ...x, error: code } : x)));
        });
    });
  };

  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    setDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  return (
    <>
      <StepHeader step={stepLabel} title={c.title} description={c.description} />

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={`relative flex flex-col items-center justify-center rounded-[var(--radius-lg)] border border-dashed px-6 py-14 text-center transition-colors duration-300 ${
          dragging ? "border-ink bg-surface" : errors.files ? "border-danger bg-surface/60" : "border-line-strong bg-surface/60"
        }`}
      >
        <span aria-hidden className="grid h-12 w-12 place-items-center rounded-full bg-canvas ring-1 ring-line">
          <Upload size={18} />
        </span>
        <p className="mt-5 font-medium">{c.dropHere}</p>
        <button
          id="files"
          type="button"
          className="btn btn-secondary btn-sm mt-3"
          onClick={() => input.current?.click()}
          aria-describedby={`files-rules${errors.files ? " files-error" : ""}`}
        >
          {c.browse}
        </button>
        <p id="files-rules" className="mt-4 text-[13px] text-muted">
          {fmt(c.rules, { max: MAX_UPLOAD_FILES })}
        </p>
        <input
          ref={input}
          type="file"
          multiple
          accept={ACCEPT}
          className="sr-only"
          tabIndex={-1}
          aria-label={c.inputLabel}
          onChange={(e) => {
            handleFiles(e.target.files);
            e.target.value = "";
          }}
        />
      </div>
      {errors.files && (
        <p id="files-error" className="field-error">
          <span aria-hidden>⚠ </span>
          {errors.files}
        </p>
      )}

      <div aria-live="polite">
        {(draft.files.length > 0 || pending.length > 0) && (
          <ul aria-label={c.listLabel} className="mt-6 divide-y divide-line overflow-hidden rounded-[var(--radius-md)] border border-line bg-surface">
            {draft.files.map((f) => (
              <li key={f.id} className="flex items-center gap-4 px-5 py-4">
                <FileIcon size={18} className="shrink-0 text-muted" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[14.5px]" dir="auto">
                    {f.name}
                  </span>
                  <span className="text-[12.5px] text-muted">{fmt(c.uploaded, { size: formatBytes(locale, f.size) })}</span>
                </span>
                <button
                  type="button"
                  onClick={() => update({ files: draft.files.filter((x) => x.id !== f.id) })}
                  className="grid h-10 w-10 place-items-center rounded-full text-muted hover:bg-canvas hover:text-ink"
                  aria-label={fmt(c.remove, { name: f.name })}
                >
                  <Close size={13} />
                </button>
              </li>
            ))}
            {pending.map((p) => (
              <li key={p.key} className="flex items-center gap-4 px-5 py-4">
                <FileIcon size={18} className={`shrink-0 ${p.error ? "text-danger" : "text-muted"}`} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[14.5px]" dir="auto">
                    {p.name}
                  </span>
                  {p.error ? (
                    <span className="text-[12.5px] text-danger">{errorText(p.error)}</span>
                  ) : (
                    <span
                      role="progressbar"
                      aria-label={fmt(c.uploadingFile, { name: p.name })}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-valuenow={Math.round(p.progress * 100)}
                      className="mt-2 block h-1 overflow-hidden rounded-full bg-line"
                    >
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
                    className="grid h-10 w-10 place-items-center rounded-full text-muted hover:bg-canvas hover:text-ink"
                    aria-label={fmt(c.dismiss, { name: p.name })}
                  >
                    <Close size={13} />
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="mt-10">
        <TextArea
          id="assetNotes"
          label={c.notesLabel}
          optional
          rows={3}
          placeholder={c.notesPlaceholder}
          value={draft.assetNotes}
          onChange={(e) => update({ assetNotes: e.target.value })}
          maxLength={1000}
          error={errors.assetNotes}
        />
      </div>
    </>
  );
}
