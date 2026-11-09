import { useCallback, useEffect, useRef, useState } from "react";
import {
  CloudArrowUp,
  Trash,
  PencilSimple,
  ArrowsLeftRight,
  DownloadSimple,
  FileArchive,
  ArrowCounterClockwise,
  WarningCircle,
  CheckCircle,
  SpinnerGap,
} from "@phosphor-icons/react";
import {
  readTags,
  stripFile,
  editFile,
  swapFile,
  disposeEngine,
  warmupEngine,
  type Tag,
} from "../../lib/engine";
import { prereadTags } from "../../lib/exifr-preread";
import { stripPdfMetadata, editPdfMetadata } from "../../lib/pdf";
import MetadataEditor, { type EditPayload } from "./MetadataEditor";
import PresetPicker from "./PresetPicker";
import type { CameraPreset } from "../../data/camera-presets";
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
  localePath,
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
  /** True while the authoritative ExifTool read is still running behind
   *  an instant exifr preview — tags are visible, count may still grow. */
  verifying: boolean;
  /** True once tags come from the authoritative ExifTool read. */
  authoritative: boolean;
  /** True when the file carries an ICC color profile (kept on purpose). */
  hasIcc: boolean;
  hasGps: boolean;
  cleaned?: ArrayBuffer;
  cleanedName: string;
  /** "strip" = metadata removed, "edit" = metadata edited, "swap" = metadata replaced by a preset. */
  action?: "strip" | "edit" | "swap";
  editedCount: number;
  editedName: string;
  swappedCount: number;
  swappedName: string;
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
  /** Tool mode: "clean" removes metadata, "edit" lets the user change it, "swap" replaces it with a device preset. */
  const [mode, setMode] = useState<"clean" | "edit" | "swap">("clean");
  /** Id of the file whose editor panel is open (edit mode only). */
  const [editingId, setEditingId] = useState<string | null>(null);
  const [savingEdit, setSavingEdit] = useState(false);
  /** Id of the file whose preset picker is open (swap mode only). */
  const [swappingId, setSwappingId] = useState<string | null>(null);
  const [applyingSwap, setApplyingSwap] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onHide = () => disposeEngine();
    document.addEventListener("visibilitychange", onHide);
    // Warm the WASM engine on the first drag-over anywhere on the page —
    // the user is about to drop a file, so the cold-start cost is paid
    // before the read begins instead of during it.
    const onDrag = () => warmupEngine();
    window.addEventListener("dragover", onDrag, { once: true });
    return () => {
      document.removeEventListener("visibilitychange", onHide);
      window.removeEventListener("dragover", onDrag);
    };
  }, []);

  const patch = useCallback((id: string, p: Partial<FileState>) => {
    setFiles((fs) => fs.map((f) => (f.id === id ? { ...f, ...p } : f)));
  }, []);

  const readOne = useCallback(
    async (state: FileState) => {
      let previewShown = false;
      try {
        const buf = (await state.file.arrayBuffer()).slice(0) as ArrayBuffer;
        let tags: Tag[];
        if (state.ext === "pdf") {
          // PDF: read Info dict via pdf-lib for the inspector.
          const { PDFDocument } = await import("pdf-lib");
          const doc = await PDFDocument.load(buf, { ignoreEncryption: true });
          const info = (doc as any).getTitle ? await readPdfInfo(doc) : [];
          tags = info;
          patch(state.id, {
            status: "ready",
            tags,
            hasGps: hasGpsTag(tags),
            authoritative: true,
            hasIcc: false,
          });
          return;
        }
        // Instant pre-read via exifr (no WASM cold-start): as soon as it
        // lands, the file flips to "ready" and the inspector renders —
        // the user sees tags in milliseconds instead of waiting for the
        // 24 MB WASM engine. The authoritative ExifTool read keeps
        // running and silently replaces the preview when it lands.
        try {
          const preview = await prereadTags(buf);
          if (preview.length > 0) {
            previewShown = true;
            patch(state.id, {
              status: "ready",
              tags: preview,
              hasGps: hasGpsTag(preview),
              verifying: true,
            });
          }
        } catch {
          /* pre-read is best-effort */
        }
        const result = await readTags(buf, state.file.name);
        tags = result.tags;
        const hasIcc = result.hasIcc;
        // Guarded: never resurrect a file the user already stripped.
        setFiles((fs) =>
          fs.map((f) =>
            f.id === state.id &&
            (f.status === "reading" || f.status === "ready")
              ? {
                  ...f,
                  status: "ready" as const,
                  tags,
                  hasGps: hasGpsTag(tags),
                  verifying: false,
                  authoritative: true,
                  hasIcc,
                }
              : f,
          ),
        );
      } catch {
        if (previewShown) {
          // Preview is on screen; the strip path re-reads inside the
          // worker anyway, so a failed background read is not fatal.
          patch(state.id, { verifying: false });
        } else {
          patch(state.id, { status: "error", errorKey: "tool.error" });
        }
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
          verifying: false,
          authoritative: false,
          hasIcc: false,
          hasGps: false,
          cleanedName: file.name.replace(/(\.[^.]+)?$/, ".clean$1"),
          editedCount: 0,
          editedName: file.name.replace(/(\.[^.]+)?$/, ".edited$1"),
          swappedCount: 0,
          swappedName: file.name.replace(/(\.[^.]+)?$/, ".swapped$1"),
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
        // Operate on the latest bytes: after an edit, the edited output
        // is the file now — stripping the original would lose the edit.
        const buf =
          st.cleaned ?? ((await st.file.arrayBuffer()).slice(0) as ArrayBuffer);
        if (st.ext === "pdf") {
          const cleaned = await stripPdfMetadata(buf);
          const cleanedBuffer = cleaned.buffer.slice(
            cleaned.byteOffset,
            cleaned.byteOffset + cleaned.byteLength,
          ) as ArrayBuffer;
          patch(st.id, {
            status: "done",
            action: "strip",
            cleaned: cleanedBuffer,
            removedCount: st.tags.length,
            remaining: [],
            tags: [],
          });
        } else {
          // When the authoritative read already counted this file's tags,
          // the worker skips its own before-read — one full ExifTool pass
          // saved on every strip.
          const { data, removedCount, remaining } = await stripFile(
            buf,
            st.file.name,
            st.authoritative ? st.tags.length : undefined,
          );
          patch(st.id, {
            status: "done",
            action: "strip",
            cleaned: data,
            removedCount,
            remaining,
            tags: remaining,
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

  /** Write edited metadata (edit mode) and verify by re-reading. */
  const editOne = useCallback(
    async (st: FileState, payload: EditPayload) => {
      setSavingEdit(true);
      try {
        // Same latest-bytes rule as strip: a second edit builds on the
        // first edit's output, it does not silently revert it.
        const buf =
          st.cleaned ?? ((await st.file.arrayBuffer()).slice(0) as ArrayBuffer);
        if (st.ext === "pdf" && payload.kind === "pdf") {
          const edited = await editPdfMetadata(buf, payload.fields);
          const editedBuffer = edited.buffer.slice(
            edited.byteOffset,
            edited.byteOffset + edited.byteLength,
          ) as ArrayBuffer;
          // Re-read the Info dict so the inspector shows the new values.
          const { PDFDocument } = await import("pdf-lib");
          const doc = await PDFDocument.load(editedBuffer, {
            ignoreEncryption: true,
          });
          const info = await readPdfInfo(doc);
          patch(st.id, {
            status: "done",
            action: "edit",
            cleaned: editedBuffer,
            editedCount: payload.changedCount,
            remaining: info,
            tags: info,
            hasGps: hasGpsTag(info),
          });
        } else if (payload.kind === "exif") {
          const { data, remaining, hasIcc } = await editFile(
            buf,
            st.file.name,
            payload.tags,
          );
          patch(st.id, {
            status: "done",
            action: "edit",
            cleaned: data,
            editedCount: payload.changedCount,
            remaining,
            tags: remaining,
            hasIcc,
            hasGps: hasGpsTag(remaining),
          });
        }
        setEditingId(null);
      } catch (e) {
        const key =
          e instanceof Error && e.message === "encrypted"
            ? "tool.encryptedPdf"
            : "tool.error";
        patch(st.id, { status: "error", errorKey: key });
        setEditingId(null);
      } finally {
        setSavingEdit(false);
      }
    },
    [patch],
  );

  /** Replace all metadata with a device preset (swap mode), verify by re-reading. */
  const swapOne = useCallback(
    async (st: FileState, preset: CameraPreset) => {
      setApplyingSwap(true);
      try {
        // Same latest-bytes rule as strip/edit: a swap after an edit
        // builds on the edited output, it does not silently revert it.
        const buf =
          st.cleaned ?? ((await st.file.arrayBuffer()).slice(0) as ArrayBuffer);
        const { data, writtenCount, remaining, hasIcc } = await swapFile(
          buf,
          st.file.name,
          preset.tags,
        );
        patch(st.id, {
          status: "done",
          action: "swap",
          cleaned: data,
          swappedCount: writtenCount,
          remaining,
          tags: remaining,
          hasIcc,
          hasGps: hasGpsTag(remaining),
          verifying: false,
        });
        setSwappingId(null);
      } catch (e) {
        const key =
          e instanceof Error && e.message === "encrypted"
            ? "tool.encryptedPdf"
            : "tool.error";
        patch(st.id, { status: "error", errorKey: key });
        setSwappingId(null);
      } finally {
        setApplyingSwap(false);
      }
    },
    [patch],
  );

  /** Download file name for the action that produced the current output. */
  const outputName = (st: FileState) =>
    st.action === "edit"
      ? st.editedName
      : st.action === "swap"
        ? st.swappedName
        : st.cleanedName;

  const downloadOne = (st: FileState) => {
    if (!st.cleaned) return;
    const type =
      st.ext === "pdf" ? "application/pdf" : "application/octet-stream";
    downloadBlob(new Blob([st.cleaned], { type }), outputName(st));
  };

  const downloadAll = () => {
    const done = files.filter((f) => f.status === "done" && f.cleaned);
    if (!done.length) return;
    const zipped = zipFiles(
      done.map((f) => ({
        name: outputName(f),
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
    setEditingId(null);
    setSwappingId(null);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files.length) addFiles(e.dataTransfer.files);
  };

  const doneCount = files.filter((f) => f.status === "done").length;

  return (
    <div className="contents">
      {/* Mode tabs: Clean removes metadata, Edit lets the user change it, Swap replaces it with a device preset. */}
      <div className="mb-4 flex justify-center">
        <div
          role="tablist"
          aria-label={msg("tool.modeLabel")}
          className="inline-flex rounded-pill border border-hairline bg-card p-1 shadow-card"
        >
          <button
            type="button"
            role="tab"
            aria-selected={mode === "clean"}
            onClick={() => {
              setMode("clean");
              setEditingId(null);
              setSwappingId(null);
            }}
            className={`inline-flex items-center gap-2 rounded-pill px-4 py-2 text-sm font-medium transition-all duration-300 active:scale-[0.97] ${
              mode === "clean"
                ? "bg-accent text-white"
                : "text-ink-2 hover:text-ink"
            }`}
          >
            <Trash size={16} aria-hidden="true" />
            {msg("tool.modeClean")}
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mode === "edit"}
            onClick={() => {
              setMode("edit");
              setEditingId(null);
              setSwappingId(null);
            }}
            className={`inline-flex items-center gap-2 rounded-pill px-4 py-2 text-sm font-medium transition-all duration-300 active:scale-[0.97] ${
              mode === "edit"
                ? "bg-accent text-white"
                : "text-ink-2 hover:text-ink"
            }`}
          >
            <PencilSimple size={16} aria-hidden="true" />
            {msg("tool.modeEdit")}
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mode === "swap"}
            onClick={() => {
              setMode("swap");
              setEditingId(null);
              setSwappingId(null);
            }}
            className={`inline-flex items-center gap-2 rounded-pill px-4 py-2 text-sm font-medium transition-all duration-300 active:scale-[0.97] ${
              mode === "swap"
                ? "bg-accent text-white"
                : "text-ink-2 hover:text-ink"
            }`}
          >
            <ArrowsLeftRight size={16} aria-hidden="true" />
            {msg("tool.modeSwap")}
          </button>
        </div>
      </div>

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
          onPointerEnter={() => warmupEngine()}
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
                locale={locale}
                mode={mode}
                editing={editingId === f.id}
                savingEdit={savingEdit}
                swapping={swappingId === f.id}
                applyingSwap={applyingSwap}
                onStrip={() => stripOne(f)}
                onEdit={() => setEditingId(f.id)}
                onSaveEdit={(payload) => editOne(f, payload)}
                onCancelEdit={() => setEditingId(null)}
                onSwap={() => setSwappingId(f.id)}
                onApplySwap={(preset) => swapOne(f, preset)}
                onCancelSwap={() => setSwappingId(null)}
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
  locale,
  mode,
  editing,
  savingEdit,
  swapping,
  applyingSwap,
  onStrip,
  onEdit,
  onSaveEdit,
  onCancelEdit,
  onSwap,
  onApplySwap,
  onCancelSwap,
  onDownload,
}: {
  state: FileState;
  msg: MsgFn;
  locale: Locale;
  mode: "clean" | "edit" | "swap";
  editing: boolean;
  savingEdit: boolean;
  swapping: boolean;
  applyingSwap: boolean;
  onStrip: () => void;
  onEdit: () => void;
  onSaveEdit: (payload: EditPayload) => void;
  onCancelEdit: () => void;
  onSwap: () => void;
  onApplySwap: (preset: CameraPreset) => void;
  onCancelSwap: () => void;
  onDownload: () => void;
}) {
  // Privacy-first report link: only the sanitized reason, extension and
  // byte size travel in the URL — never the file name.
  const reportUrl =
    localePath(locale, "/report") +
    "?reason=" +
    encodeURIComponent(f.errorKey ?? "tool.error") +
    "&ext=" +
    encodeURIComponent(f.ext) +
    "&size=" +
    f.file.size;
  return (
    <li className="px-4 py-5 sm:px-6">
      {/* Header row: thumbnail + file info + actions */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
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
              <SpinnerGap
                size={14}
                className="animate-spin"
                aria-hidden="true"
              />
              {msg("tool.processing")}
            </p>
          )}

          {f.status === "stripping" && (
            <p className="mt-1.5 flex items-center gap-2 text-xs text-ink-2">
              <SpinnerGap
                size={14}
                className="animate-spin"
                aria-hidden="true"
              />
              {msg("tool.removing")}
            </p>
          )}

          {f.status === "done" && (
            <p className="mt-1.5 inline-flex items-center gap-1.5 text-xs font-medium text-green-700 dark:text-green-400">
              <CheckCircle size={16} weight="fill" aria-hidden="true" />
              {f.action === "edit"
                ? msg("tool.tagsEdited", { count: f.editedCount })
                : f.action === "swap"
                  ? msg("tool.tagsSwapped", { count: f.swappedCount })
                  : msg("tool.tagsRemoved", { count: f.removedCount })}{" "}
              · {msg("tool.tagsRemaining", { count: f.remaining.length })}
            </p>
          )}

          {f.status === "error" && (
            <div className="mt-1.5">
              <p className="flex items-center gap-1.5 text-xs text-red-600 dark:text-red-400">
                <WarningCircle size={14} aria-hidden="true" />
                {msg(f.errorKey ?? "tool.error")}
              </p>
              <a
                href={reportUrl}
                className="mt-1 inline-block text-xs font-medium text-accent underline-offset-2 hover:underline"
              >
                {msg("tool.reportIssue")}
              </a>
            </div>
          )}
        </div>

        <div className="flex shrink-0 gap-2">
          {mode === "clean" &&
            (f.status === "ready" || f.status === "done") && (
              <button
                type="button"
                onClick={onStrip}
                className="inline-flex w-full items-center justify-center gap-2 rounded-pill bg-accent px-5 py-2.5 text-sm font-medium text-white transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] hover:bg-accent-hover active:scale-[0.97] sm:w-auto"
              >
                <Trash size={16} aria-hidden="true" />
                {msg("tool.remove")}
              </button>
            )}
          {mode === "edit" &&
            (f.status === "ready" || f.status === "done") &&
            !editing && (
              <button
                type="button"
                onClick={onEdit}
                disabled={!(f.authoritative || !f.verifying)}
                title={
                  f.authoritative || !f.verifying
                    ? undefined
                    : msg("editor.waitingRead")
                }
                className="inline-flex w-full items-center justify-center gap-2 rounded-pill bg-accent px-5 py-2.5 text-sm font-medium text-white transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] hover:bg-accent-hover active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto"
              >
                <PencilSimple size={16} aria-hidden="true" />
                {msg("tool.edit")}
              </button>
            )}
          {mode === "swap" &&
            f.ext !== "pdf" &&
            (f.status === "ready" || f.status === "done") &&
            !swapping && (
              <button
                type="button"
                onClick={onSwap}
                className="inline-flex w-full items-center justify-center gap-2 rounded-pill bg-accent px-5 py-2.5 text-sm font-medium text-white transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] hover:bg-accent-hover active:scale-[0.97] sm:w-auto"
              >
                <ArrowsLeftRight size={16} aria-hidden="true" />
                {msg("tool.swap")}
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
      </div>

      {/* Inline editor — edit mode, per file. Re-openable on done files:
          the form pre-fills from the latest (edited) tags. */}
      {mode === "edit" &&
        editing &&
        (f.status === "ready" || f.status === "done") && (
          <MetadataEditor
            tags={f.tags}
            isPdf={f.ext === "pdf"}
            msg={msg}
            saving={savingEdit}
            onSave={onSaveEdit}
            onCancel={onCancelEdit}
          />
        )}

      {/* Inline preset picker — swap mode, per file. Re-openable on done
          files: a swap builds on the latest bytes, it does not revert. */}
      {mode === "swap" &&
        swapping &&
        (f.status === "ready" || f.status === "done") && (
          <PresetPicker
            msg={msg}
            applying={applyingSwap}
            onApply={onApplySwap}
            onCancel={onCancelSwap}
          />
        )}

      {/* Tags section — own card below the file header row. Shown for
          ready AND done files: after an edit/swap the user must be able
          to inspect the new tags without downloading the file first.
          After a strip it reads "0 tags found", which confirms the clean. */}
      {(f.status === "ready" || f.status === "done") && (
        <div className="mt-4 rounded-2xl border border-hairline bg-canvas/60 p-3 sm:p-4">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 px-1">
            <p className="text-[13px] font-semibold text-ink">
              {msg("tool.tagsFound", { count: f.tags.length })}
            </p>
            {f.verifying && (
              <span className="inline-flex items-center gap-1.5 text-xs text-ink-2">
                <SpinnerGap
                  size={12}
                  className="animate-spin"
                  aria-hidden="true"
                />
                {msg("tool.processing")}
              </span>
            )}
            {f.hasGps && (
              <p className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2.5 py-1 text-xs font-medium text-amber-700 dark:text-amber-300">
                <WarningCircle size={14} aria-hidden="true" />
                {msg("tool.gpsWarning")}
              </p>
            )}
          </div>
          {f.hasIcc && (
            <p className="mt-2 px-1 text-xs leading-relaxed text-ink-2">
              {msg("tool.iccNote")}
            </p>
          )}
          {f.tags.length > 0 && (
            <div className="mt-3 overflow-hidden rounded-xl border border-hairline bg-card">
              <div className="max-h-56 overflow-auto">
                <table className="w-full text-[13px]">
                  <thead className="sticky top-0 z-10">
                    <tr className="bg-canvas text-left shadow-[0_1px_0_var(--color-hairline)]">
                      <th
                        scope="col"
                        className="w-2/5 px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-2"
                      >
                        {msg("inspector.tag")}
                      </th>
                      <th
                        scope="col"
                        className="px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-2"
                      >
                        {msg("inspector.value")}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-hairline">
                    {f.tags.slice(0, 100).map((tag, i) => (
                      <tr
                        key={i}
                        className={i % 2 === 1 ? "bg-canvas/60" : "bg-card"}
                      >
                        <td className="px-3 py-[7px] align-top">
                          <span className="block font-medium leading-snug text-ink">
                            {tag.name}
                          </span>
                          <span className="mt-0.5 block text-[11px] leading-tight text-ink-2">
                            {tag.group}
                          </span>
                        </td>
                        <td className="max-w-0 px-3 py-[7px] align-top">
                          <span
                            className="block truncate text-[13px] leading-snug text-ink-2"
                            title={tag.value}
                          >
                            {tag.value}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
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
