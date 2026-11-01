"use client";

import { useEffect, useRef, useState, type DragEvent } from "react";
import { MAX_CONTENT_FILES, MAX_INSPIRATION_FILES, type UploadedFile } from "@/lib/order-schema";
import { ACCEPTED_EXTENSIONS, INSPIRATION_EXTENSIONS, MAX_UPLOAD_BYTES } from "@/lib/uploads";
import { Close, FileIcon, Upload } from "@/components/ui/icons";
import { useI18n } from "@/i18n/client";
import { fmt, formatNumber } from "@/i18n/format";
import type { Locale } from "@/i18n/config";
import { StepHeader, TextArea } from "./fields";
import { useStepLabel, type StepProps } from "./steps";

type Kind = "content" | "inspiration";
type UploadErrorCode = "limit" | "tooLarge" | "type" | "failed" | "network" | "rateLimited";
type Pending = { key: string; name: string; kind: Kind; progress: number; error?: UploadErrorCode };

function formatBytes(locale: Locale, bytes: number) {
  if (bytes < 1024 * 1024) return `${formatNumber(locale, Math.max(1, Math.round(bytes / 1024)))} KB`;
  return `${formatNumber(locale, Math.round((bytes / 1024 / 1024) * 10) / 10)} MB`;
}

class UploadError extends Error {
  constructor(public code: UploadErrorCode) {
    super(code);
  }
}

function uploadFile(file: File, kind: Kind, onProgress: (p: number) => void): Promise<UploadedFile> {
  // Static preview builds have no server: keep the file in the browser only.
  if (process.env.NEXT_PUBLIC_STATIC_PREVIEW === "1") {
    onProgress(1);
    return Promise.resolve({ id: crypto.randomUUID(), name: file.name, size: file.size, type: file.type, kind });
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
      if (xhr.status >= 200 && xhr.status < 300 && body.id) return resolve({ ...(body as UploadedFile), kind });
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

const kindOf = (f: UploadedFile): Kind => (f.kind === "inspiration" ? "inspiration" : "content");

export function AssetsStep({
  draft,
  update,
  errors,
  onBusyChange,
}: StepProps & { onBusyChange: (busy: boolean) => void }) {
  const { m } = useI18n();
  const c = m.configurator.assets;
  const stepLabel = useStepLabel("assets");
  const [pending, setPending] = useState<Pending[]>([]);
  // Local previews of images picked in this session (never uploaded anywhere else).
  const [previews, setPreviews] = useState<Record<string, string>>({});
  const busy = pending.some((p) => !p.error);
  useEffect(() => onBusyChange(busy), [busy, onBusyChange]);
  useEffect(() => () => Object.values(previews).forEach((u) => URL.revokeObjectURL(u)), [previews]);

  const handleFiles = (list: FileList | null, kind: Kind) => {
    if (!list) return;
    const max = kind === "content" ? MAX_CONTENT_FILES : MAX_INSPIRATION_FILES;
    const allowed = (kind === "content" ? ACCEPTED_EXTENSIONS : INSPIRATION_EXTENSIONS) as readonly string[];
    const room = max - draft.files.filter((f) => kindOf(f) === kind).length - pending.filter((p) => p.kind === kind && !p.error).length;
    Array.from(list).forEach((file, i) => {
      const key = `${kind}-${file.name}-${file.size}-${Date.now()}-${i}`;
      const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
      const reject = (error: UploadErrorCode) => setPending((p) => [...p, { key, name: file.name, kind, progress: 0, error }]);
      if (i >= room) return reject("limit");
      if (file.size > MAX_UPLOAD_BYTES) return reject("tooLarge");
      if (!allowed.includes(ext)) return reject("type");
      setPending((p) => [...p, { key, name: file.name, kind, progress: 0 }]);
      uploadFile(file, kind, (progress) => setPending((p) => p.map((x) => (x.key === key ? { ...x, progress } : x))))
        .then((uploaded) => {
          if (/^image\/(png|jpe?g|webp|gif)$/.test(file.type)) setPreviews((pv) => ({ ...pv, [uploaded.id]: URL.createObjectURL(file) }));
          update((d) => ({ files: [...d.files, uploaded] }));
          setPending((p) => p.filter((x) => x.key !== key));
        })
        .catch((err: unknown) => {
          const code = err instanceof UploadError ? err.code : "failed";
          setPending((p) => p.map((x) => (x.key === key ? { ...x, error: code } : x)));
        });
    });
  };

  const remove = (f: UploadedFile) => update({ files: draft.files.filter((x) => x.id !== f.id) });

  return (
    <>
      <StepHeader step={stepLabel} title={c.title} description={c.description} />

      <section aria-labelledby="content-files-title">
        <h2 id="content-files-title" className="text-[1.25rem] font-medium tracking-[-0.02em]">
          {c.contentTitle}
        </h2>
        <p className="mb-4 mt-1 text-[14.5px] text-muted">{c.contentHelp}</p>
        <UploadZone
          id="files"
          kind="content"
          accept={ACCEPTED_EXTENSIONS}
          browseLabel={c.browse}
          inputLabel={c.inputLabel}
          rules={fmt(c.rules, { max: MAX_CONTENT_FILES })}
          error={errors.files}
          onFiles={(l) => handleFiles(l, "content")}
        />
        <FileList
          label={c.listLabel}
          files={draft.files.filter((f) => kindOf(f) === "content")}
          pending={pending.filter((p) => p.kind === "content")}
          previews={previews}
          onRemove={remove}
          onDismiss={(key) => setPending((l) => l.filter((x) => x.key !== key))}
          max={MAX_CONTENT_FILES}
        />
      </section>

      <section aria-labelledby="inspiration-files-title" className="mt-12">
        <h2 id="inspiration-files-title" className="text-[1.25rem] font-medium tracking-[-0.02em]">
          {c.inspirationTitle} <span className="text-[14px] font-normal text-muted">{m.common.optional}</span>
        </h2>
        <p className="mb-4 mt-1 max-w-2xl text-[14.5px] text-muted">{c.inspirationHelp}</p>
        <UploadZone
          id="inspiration-files"
          kind="inspiration"
          accept={INSPIRATION_EXTENSIONS}
          browseLabel={c.browseInspiration}
          inputLabel={c.inspirationInputLabel}
          rules={fmt(c.inspirationRules, { max: MAX_INSPIRATION_FILES })}
          onFiles={(l) => handleFiles(l, "inspiration")}
        />
        <FileList
          label={c.inspirationListLabel}
          files={draft.files.filter((f) => kindOf(f) === "inspiration")}
          pending={pending.filter((p) => p.kind === "inspiration")}
          previews={previews}
          onRemove={remove}
          onDismiss={(key) => setPending((l) => l.filter((x) => x.key !== key))}
          max={MAX_INSPIRATION_FILES}
        />
      </section>

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

function UploadZone({
  id,
  kind,
  accept,
  browseLabel,
  inputLabel,
  rules,
  error,
  onFiles,
}: {
  id: string;
  kind: Kind;
  accept: readonly string[];
  browseLabel: string;
  inputLabel: string;
  rules: string;
  error?: string;
  onFiles: (list: FileList | null) => void;
}) {
  const { m } = useI18n();
  const input = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    setDragging(false);
    onFiles(e.dataTransfer.files);
  };
  return (
    <>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={`relative flex flex-col items-center justify-center rounded-[var(--radius-lg)] border border-dashed px-6 ${kind === "content" ? "py-12" : "py-9"} text-center transition-colors duration-300 ${
          dragging ? "border-ink bg-surface" : error ? "border-danger bg-surface/60" : "border-line-strong bg-surface/60"
        }`}
      >
        <span aria-hidden className="grid h-11 w-11 place-items-center rounded-full bg-canvas ring-1 ring-line">
          <Upload size={17} />
        </span>
        <p className="mt-4 font-medium">{m.configurator.assets.dropHere}</p>
        <button
          id={id}
          type="button"
          className="btn btn-secondary btn-sm mt-3"
          onClick={() => input.current?.click()}
          aria-describedby={`${id}-rules${error ? ` ${id}-error` : ""}`}
        >
          {browseLabel}
        </button>
        <p id={`${id}-rules`} className="mt-4 text-[13px] text-muted">
          {rules}
        </p>
        <input
          ref={input}
          type="file"
          multiple
          accept={accept.map((e) => `.${e}`).join(",")}
          className="sr-only"
          tabIndex={-1}
          aria-label={inputLabel}
          onChange={(e) => {
            onFiles(e.target.files);
            e.target.value = "";
          }}
        />
      </div>
      {error && (
        <p id={`${id}-error`} className="field-error">
          <span aria-hidden>⚠ </span>
          {error}
        </p>
      )}
    </>
  );
}

function FileList({
  label,
  files,
  pending,
  previews,
  onRemove,
  onDismiss,
  max,
}: {
  label: string;
  files: UploadedFile[];
  pending: Pending[];
  previews: Record<string, string>;
  onRemove: (f: UploadedFile) => void;
  onDismiss: (key: string) => void;
  max: number;
}) {
  const { locale, m } = useI18n();
  const c = m.configurator.assets;
  if (!files.length && !pending.length) return <div aria-live="polite" />;
  return (
    <div aria-live="polite">
      <ul aria-label={label} className="mt-5 divide-y divide-line overflow-hidden rounded-[var(--radius-md)] border border-line bg-surface">
        {files.map((f) => (
          <li key={f.id} className="flex items-center gap-4 px-5 py-3.5">
            {previews[f.id] ? (
              // eslint-disable-next-line @next/next/no-img-element -- local blob preview, not an optimizable asset
              <img src={previews[f.id]} alt="" className="h-11 w-11 shrink-0 rounded-md object-cover ring-1 ring-line" />
            ) : (
              <FileIcon size={18} className="shrink-0 text-muted" />
            )}
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[14.5px]" dir="auto">
                {f.name}
              </span>
              <span className="text-[12.5px] text-muted">{fmt(c.uploaded, { size: formatBytes(locale, f.size) })}</span>
            </span>
            <button
              type="button"
              onClick={() => onRemove(f)}
              className="grid h-10 w-10 place-items-center rounded-full text-muted hover:bg-canvas hover:text-ink"
              aria-label={fmt(c.remove, { name: f.name })}
            >
              <Close size={13} />
            </button>
          </li>
        ))}
        {pending.map((p) => (
          <li key={p.key} className="flex items-center gap-4 px-5 py-3.5">
            <FileIcon size={18} className={`shrink-0 ${p.error ? "text-danger" : "text-muted"}`} />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[14.5px]" dir="auto">
                {p.name}
              </span>
              {p.error ? (
                <span className="text-[12.5px] text-danger">{fmt(c.errors[p.error], { max })}</span>
              ) : (
                <span
                  role="progressbar"
                  aria-label={fmt(c.uploadingFile, { name: p.name })}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={Math.round(p.progress * 100)}
                  className="mt-2 block h-1 overflow-hidden rounded-full bg-line"
                >
                  <span className="block h-full rounded-full bg-ink transition-[width] duration-200" style={{ width: `${Math.round(p.progress * 100)}%` }} />
                </span>
              )}
            </span>
            {p.error && (
              <button
                type="button"
                onClick={() => onDismiss(p.key)}
                className="grid h-10 w-10 place-items-center rounded-full text-muted hover:bg-canvas hover:text-ink"
                aria-label={fmt(c.dismiss, { name: p.name })}
              >
                <Close size={13} />
              </button>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
