import { useCallback, useEffect, useRef, useState } from "react";
import {
  CloudArrowUp,
  Trash,
  DownloadSimple,
  FileArchive,
  ArrowCounterClockwise,
  WarningCircle,
  CheckCircle,
  SpinnerGap,
} from "@phosphor-icons/react";
import { readTags, stripFile, disposeEngine, type Tag } from "../../lib/engine";
import { prereadTags } from "../../lib/exifr-preread";
import { stripPdfMetadata } from "../../lib/pdf";
import { zipFiles, downloadBlob } from "../../lib/zip";
import {
  imageThumbnail,
  heicThumbnail,
  pdfThumbnail,
  videoThumbnail,
} from "../../lib/thumbnails";
import {
  getExtension,
  isSupported,
  MAX_FILE_SIZE_WARN,
  type Locale,
} from "../../lib/i18n";

export type MsgFn = (
  key: string,
  inputs?: Record<string, string | number>,
) => string;

export interface FileState {
  id: string;
  file: File;
  ext: string;
  status: "reading" | "ready" | "stripping" | "done" | "error";
  tags: Tag[];
  hasGps: boolean;
  cleaned?: ArrayBuffer;
  cleanedName: string;
  removedCount: number;
  remaining: Tag[];
  errorKey?: string;
  thumbUrl?: string;
  sizeWarn: boolean;
}

interface Props {
  locale: Locale;
  messages: Record<string, string>;
}

/** Format bytes: show KB under 1 MB (avoids "0.0 MB"), MB above. */
function formatSize(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

let idCounter = 0;
const nid = () => `f${++idCounter}`;

/** Build the translate function inside the island (props must stay serializable). */
function makeMsg(messages: Record<string, string>): MsgFn {
  return (key, inputs = {}) => {
    let s = messages[key] ?? key;
    for (const [k, v] of Object.entries(inputs)) {
      s = s.replaceAll(`{${k}}`, String(v));
    }
    return s;
  };
}

function hasGpsTag(tags: Tag[]): boolean {
  return tags.some(
    (t) =>
      t.group.toUpperCase() === "GPS" || t.name.toUpperCase().includes("GPS"),
  );
}

export default function ToolIsland({ locale, messages }: Props) {
  const msg = makeMsg(messages);
  const [files, setFiles] = useState<FileState[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onHide = () => disposeEngine();
    document.addEventListener("visibilitychange", onHide);
    return () => document.removeEventListener("visibilitychange", onHide);
  }, []);

  const patch = useCallback((id: string, p: Partial<FileState>) => {
    setFiles((fs) => fs.map((f) => (f.id === id ? { ...f, ...p } : f)));
  }, []);

  const readOne = useCallback(
    async (state: FileState) => {
      try {
        const buf = (await state.file.arrayBuffer()).slice(0) as ArrayBuffer;
        let tags: Tag[];
        if (state.ext === "pdf") {
          // PDF: read Info dict via pdf-lib for the inspector.
          const { PDFDocument } = await import("pdf-lib");
          const doc = await PDFDocument.load(buf, { ignoreEncryption: true });
          const info = (doc as any).getTitle ? await readPdfInfo(doc) : [];
          tags = info;
        } else {
          // Instant pre-read via exifr (no WASM cold-start) so the inspector
          // shows tags immediately; the authoritative ExifTool read replaces
          // these below. Best-effort — a failed pre-read never blocks.
          try {
            const preview = await prereadTags(buf);
            if (preview.length > 0) {
              patch(state.id, { tags: preview, hasGps: hasGpsTag(preview) });
            }
          } catch {
            /* pre-read is best-effort */
          }
          tags = await readTags(buf, state.file.name);
        }
        patch(state.id, {
          status: "ready",
          tags,
          hasGps: hasGpsTag(tags),
        });
      } catch {
        patch(state.id, { status: "error", errorKey: "tool.error" });
      }
    },
    [patch],
  );

  const addFiles = useCallback(
    (list: FileList | File[]) => {
      const fresh: FileState[] = [];
      for (const file of Array.from(list)) {
        const ext = getExtension(file.name);
        const st: FileState = {
          id: nid(),
          file,
          ext,
          status: isSupported(file.name) ? "reading" : "error",
          tags: [],
          hasGps: false,
          cleanedName: file.name.replace(/(\.[^.]+)?$/, ".clean$1"),
          removedCount: 0,
          remaining: [],
          errorKey: isSupported(file.name) ? undefined : "tool.unsupported",
          sizeWarn: file.size > MAX_FILE_SIZE_WARN,
        };
        fresh.push(st);
      }
      setFiles((fs) => [...fs, ...fresh]);
      for (const st of fresh) {
        if (st.status === "reading") {
          void readOne(st);
          void makeThumb(st);
        }
      }
    },
    [readOne],
  );

  const makeThumb = async (st: FileState) => {
    try {
      let url: string | undefined;
      if (["jpg", "jpeg", "png", "webp", "gif", "avif"].includes(st.ext)) {
        url = await imageThumbnail(st.file);
      } else if (["heic", "heif"].includes(st.ext)) {
        url = await heicThumbnail(st.file);
      } else if (st.ext === "pdf") {
        url = await pdfThumbnail(st.file);
      } else if (["mp4", "mov"].includes(st.ext)) {
        url = await videoThumbnail(st.file);
      }
      if (url) patch(st.id, { thumbUrl: url });
    } catch {
      /* thumbnails are best-effort */
    }
  };

  const stripOne = useCallback(
    async (st: FileState) => {
      patch(st.id, { status: "stripping" });
      try {
        const buf = (await st.file.arrayBuffer()).slice(0) as ArrayBuffer;
        if (st.ext === "pdf") {
          const cleaned = await stripPdfMetadata(buf);
          const cleanedBuffer = cleaned.buffer.slice(
            cleaned.byteOffset,
            cleaned.byteOffset + cleaned.byteLength,
          ) as ArrayBuffer;
          patch(st.id, {
            status: "done",
            cleaned: cleanedBuffer,
            removedCount: st.tags.length,
            remaining: [],
          });
        } else {
          const { data, removedCount, remaining } = await stripFile(
            buf,
            st.file.name,
          );
          patch(st.id, {
            status: "done",
            cleaned: data,
            removedCount,
            remaining,
          });
        }
      } catch (e) {
        const key =
          e instanceof Error && e.message === "encrypted"
            ? "tool.encryptedPdf"
            : "tool.error";
        patch(st.id, { status: "error", errorKey: key });
      }
    },
    [patch],
  );

  const downloadOne = (st: FileState) => {
    if (!st.cleaned) return;
    const type =
      st.ext === "pdf" ? "application/pdf" : "application/octet-stream";
    downloadBlob(new Blob([st.cleaned], { type }), st.cleanedName);
  };

  const downloadAll = () => {
    const done = files.filter((f) => f.status === "done" && f.cleaned);
    if (!done.length) return;
    const zipped = zipFiles(
      done.map((f) => ({
        name: f.cleanedName,
        data: new Uint8Array(f.cleaned as ArrayBuffer),
      })),
    );
    downloadBlob(
      new Blob([zipped], { type: "application/zip" }),
      "pureclear-clean.zip",
    );
  };

  const reset = () => {
    for (const f of files) if (f.thumbUrl) URL.revokeObjectURL(f.thumbUrl);
    setFiles([]);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files.length) addFiles(e.dataTransfer.files);
  };

  const doneCount = files.filter((f) => f.status === "done").length;

  return (
    <div className="contents">
      {/* Dropzone — standalone card (Apple style: generous, calm, inviting) */}
      <div className="overflow-hidden rounded-card border border-hairline bg-card shadow-card">
        <div
          role="button"
          tabIndex={0}
          aria-label={msg("tool.dropTitle")}
          onClick={() => inputRef.current?.click()}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") inputRef.current?.click();
          }}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
          className={`flex cursor-pointer flex-col items-center justify-center gap-4 px-6 py-14 text-center transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] sm:py-16 ${
            dragOver
              ? "scale-[1.01] bg-accent/[0.08]"
              : "hover:bg-black/[0.02] dark:hover:bg-white/[0.03]"
          }`}
        >
        <span
          className={`flex h-16 w-16 items-center justify-center rounded-[20px] bg-accent/10 text-accent transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${
            dragOver ? "scale-110" : ""
          }`}
        >
          <CloudArrowUp size={30} weight="duotone" aria-hidden="true" />
        </span>
        <div>
          <p className="text-[21px] font-semibold tracking-[-0.01em]">
            {msg("tool.dropTitle")}
          </p>
          <p className="mx-auto mt-2 max-w-sm text-[15px] leading-relaxed text-ink-2">
            {msg("tool.dropSubtitle")}
          </p>
        </div>
        <input
          ref={inputRef}
          type="file"
          multiple
          className="sr-only"
          onChange={(e) => {
            if (e.target.files?.length) addFiles(e.target.files);
            e.target.value = "";
          }}
        />
      </div>
      </div>

      {files.length > 0 && (
        <section
          aria-label={msg("tool.yourFiles", { count: files.length })}
          className="mt-4 animate-[rise-in_0.5s_cubic-bezier(0.16,1,0.3,1)] overflow-hidden rounded-card border border-hairline bg-card shadow-card sm:mt-5"
        >
          <div aria-live="polite" className="sr-only">
            {files.map((f) => `${f.file.name}: ${f.status}`).join(". ")}
          </div>
          <div className="flex items-center justify-between gap-3 border-b border-hairline px-4 py-3 sm:px-6">
            <h2 className="text-[15px] font-semibold tracking-[-0.01em]">
              {msg("tool.yourFiles", { count: files.length })}
            </h2>
            <button
              type="button"
              onClick={reset}
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium text-accent transition-all duration-300 hover:opacity-70 active:scale-[0.97]"
            >
              <ArrowCounterClockwise size={16} aria-hidden="true" />
              {msg("tool.reset")}
            </button>
          </div>
          <ul className="divide-y divide-hairline">
            {files.map((f) => (
              <FileRow
                key={f.id}
                state={f}
                msg={msg}
                onStrip={() => stripOne(f)}
                onDownload={() => downloadOne(f)}
              />
            ))}
          </ul>
          {doneCount > 1 && (
            <div className="border-t border-hairline bg-canvas/60 px-4 py-4 sm:px-6">
              <button
                type="button"
                onClick={downloadAll}
                className="inline-flex w-full items-center justify-center gap-2 rounded-pill bg-accent px-5 py-2.5 text-sm font-medium text-white transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] hover:bg-accent-hover active:scale-[0.97] sm:w-auto sm:justify-start"
              >
                <FileArchive size={18} aria-hidden="true" />
                {msg("tool.downloadAll")}
              </button>
            </div>
          )}
        </section>
      )}
    </div>
  );
}

function FileRow({
  state: f,
  msg,
  onStrip,
  onDownload,
}: {
  state: FileState;
  msg: MsgFn;
  onStrip: () => void;
  onDownload: () => void;
}) {
  return (
    <li className="flex flex-col gap-4 px-4 py-5 sm:flex-row sm:items-center sm:px-6">
      {f.thumbUrl ? (
        <img
          src={f.thumbUrl}
          alt=""
          className="h-16 w-16 shrink-0 rounded-2xl border border-hairline object-cover"
        />
      ) : (
        <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border border-hairline bg-canvas text-sm font-semibold tracking-wide text-ink-2">
          {f.ext.slice(0, 4).toUpperCase()}
        </span>
      )}

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{f.file.name}</p>
        <p className="mt-0.5 text-xs text-ink-2">
          {formatSize(f.file.size)}
          {f.sizeWarn && (
            <span className="ms-2 inline-flex items-center gap-1 text-amber-600 dark:text-amber-400">
              <WarningCircle size={14} aria-hidden="true" />
              {msg("tool.fileTooBig", { size: "100 MB" })}
            </span>
          )}
        </p>

        {f.status === "reading" && (
          <p className="mt-1.5 flex items-center gap-2 text-xs text-ink-2">
            <SpinnerGap size={14} className="animate-spin" aria-hidden="true" />
            {msg("tool.processing")}
          </p>
        )}

        {f.status === "ready" && (
          <div className="mt-1.5 text-xs">
            <p className="text-ink-2">
              {msg("tool.tagsFound", { count: f.tags.length })}
            </p>
            {f.hasGps && (
              <p className="mt-1 inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2.5 py-1 font-medium text-amber-700 dark:text-amber-300">
                <WarningCircle size={14} aria-hidden="true" />
                {msg("tool.gpsWarning")}
              </p>
            )}
            {f.tags.length > 0 && (
              <details className="mt-2">
                <summary className="cursor-pointer text-accent">
                  {msg("inspector.before")}
                </summary>
                <dl className="mt-2 max-h-40 overflow-auto rounded-xl border border-hairline bg-canvas p-3 font-mono text-[11px] tabular-nums">
                  {f.tags.slice(0, 50).map((tag, i) => (
                    <div key={i} className="flex gap-2 py-0.5">
                      <dt className="shrink-0 text-ink-2">
                        [{tag.group}] {tag.name}
                      </dt>
                      <dd className="truncate">{tag.value}</dd>
                    </div>
                  ))}
                </dl>
              </details>
            )}
          </div>
        )}

        {f.status === "stripping" && (
          <p className="mt-1.5 flex items-center gap-2 text-xs text-ink-2">
            <SpinnerGap size={14} className="animate-spin" aria-hidden="true" />
            {msg("tool.removing")}
          </p>
        )}

        {f.status === "done" && (
          <p className="mt-1.5 inline-flex items-center gap-1.5 text-xs font-medium text-green-700 dark:text-green-400">
            <CheckCircle size={16} weight="fill" aria-hidden="true" />
            {msg("tool.tagsRemoved", { count: f.removedCount })} ·{" "}
            {msg("tool.tagsRemaining", { count: f.remaining.length })}
          </p>
        )}

        {f.status === "error" && (
          <p className="mt-1.5 flex items-center gap-1.5 text-xs text-red-600 dark:text-red-400">
            <WarningCircle size={14} aria-hidden="true" />
            {msg(f.errorKey ?? "tool.error")}
          </p>
        )}
      </div>

      <div className="flex shrink-0 gap-2">
        {(f.status === "ready" || f.status === "error") &&
          f.status === "ready" && (
            <button
              type="button"
              onClick={onStrip}
              className="inline-flex w-full items-center justify-center gap-2 rounded-pill bg-accent px-5 py-2.5 text-sm font-medium text-white transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] hover:bg-accent-hover active:scale-[0.97] sm:w-auto"
            >
              <Trash size={16} aria-hidden="true" />
              {msg("tool.remove")}
            </button>
          )}
        {f.status === "done" && (
          <button
            type="button"
            onClick={onDownload}
            className="inline-flex w-full items-center justify-center gap-2 rounded-pill bg-accent px-5 py-2.5 text-sm font-medium text-white transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] hover:bg-accent-hover active:scale-[0.97] sm:w-auto"
          >
            <DownloadSimple size={16} aria-hidden="true" />
            {msg("tool.download")}
          </button>
        )}
      </div>
    </li>
  );
}

/** Read PDF Info-dict entries for the inspector display. */
async function readPdfInfo(doc: unknown): Promise<Tag[]> {
  const tags: Tag[] = [];
  try {
    const d = doc as {
      getTitle(): string | undefined;
      getAuthor(): string | undefined;
      getSubject(): string | undefined;
      getKeywords(): string[] | undefined;
      getCreator(): string | undefined;
      getProducer(): string | undefined;
      getCreationDate(): Date | undefined;
      getModificationDate(): Date | undefined;
    };
    const push = (name: string, value: unknown) => {
      if (value === undefined || value === null || value === "") return;
      tags.push({
        group: "PDF",
        name,
        value: Array.isArray(value) ? value.join(", ") : String(value),
      });
    };
    push("Title", d.getTitle?.());
    push("Author", d.getAuthor?.());
    push("Subject", d.getSubject?.());
    push("Keywords", d.getKeywords?.());
    push("Creator", d.getCreator?.());
    push("Producer", d.getProducer?.());
    push("CreateDate", d.getCreationDate?.());
    push("ModifyDate", d.getModificationDate?.());
  } catch {
    /* best-effort */
  }
  return tags;
}
