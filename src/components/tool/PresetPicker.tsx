import { useMemo, useRef, useState } from "react";
import { DownloadSimple, UploadSimple, X } from "@phosphor-icons/react";
import {
  CAMERA_PRESETS,
  PRESET_CATEGORIES,
  type CameraPreset,
  type PresetCategory,
} from "../../data/camera-presets";
import {
  customPresetToCamera,
  deleteCustomPreset,
  exportPresetPack,
  importPresetPack,
  loadCustomPresets,
  type CustomPreset,
} from "../../lib/custom-presets";
import { downloadBlob } from "../../lib/zip";
import { countMsg, type MsgFn } from "./ToolIsland";

interface PresetPickerProps {
  msg: MsgFn;
  onApply: (preset: CameraPreset) => void;
  /** Batch: same preset to every ready/done photo. */
  onApplyAll?: (preset: CameraPreset) => void;
  showApplyAll?: boolean;
  onCancel: () => void;
  applying: boolean;
}

function headline(preset: CameraPreset): string {
  const iso = preset.tags["EXIF:ISO"];
  const f = preset.tags["EXIF:FNumber"];
  const mm = preset.tags["EXIF:FocalLengthIn35mmFormat"];
  const parts: string[] = [];
  if (iso !== undefined) parts.push(`ISO ${iso}`);
  if (f !== undefined) parts.push(`f/${f}`);
  if (mm !== undefined) parts.push(`${mm}mm`);
  if (parts.length > 0) return parts.join(" · ");
  // Partial custom preset (e.g. only Make was changed): show its tags
  // instead of "ISO undefined · f/undefined · undefinedmm".
  return Object.entries(preset.tags)
    .slice(0, 2)
    .map(([k, v]) => `${k.split(":").pop()}: ${v}`)
    .join(" · ");
}

export default function PresetPicker({
  msg,
  onApply,
  onApplyAll,
  showApplyAll,
  onCancel,
  applying,
}: PresetPickerProps) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<PresetCategory | "all">("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [custom, setCustom] = useState<CustomPreset[]>(() =>
    loadCustomPresets(),
  );
  const [importNote, setImportNote] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return CAMERA_PRESETS.filter((p) => {
      if (category !== "all" && p.category !== category) return false;
      if (!q) return true;
      return (
        `${p.brand} ${p.model}`.toLowerCase().includes(q) ||
        p.model.toLowerCase().includes(q)
      );
    });
  }, [query, category]);

  /** Custom presets live in their own section (search-filtered only). */
  const filteredCustom = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return custom;
    return custom.filter((p) => p.name.toLowerCase().includes(q));
  }, [query, custom]);

  const selected = selectedId
    ? selectedId.startsWith("custom-")
      ? (() => {
          const cp = custom.find((p) => `custom-${p.id}` === selectedId);
          return cp ? customPresetToCamera(cp) : undefined;
        })()
      : CAMERA_PRESETS.find((p) => p.id === selectedId)
    : undefined;

  const exportPack = () => {
    downloadBlob(
      new Blob([exportPresetPack(custom)], { type: "application/json" }),
      "pureclear-presets.json",
    );
  };

  const importPack = async (file: File) => {
    try {
      const data: unknown = JSON.parse(await file.text());
      const { imported, errors } = importPresetPack(data);
      setCustom(loadCustomPresets());
      if (imported > 0 && errors.length > 0) {
        setImportNote(
          msg("swap.importedSkipped", {
            imported,
            skipped: errors.length,
          }),
        );
      } else if (imported > 0) {
        setImportNote(msg("swap.imported", { count: imported }));
      } else {
        setImportNote(msg("swap.importInvalid"));
      }
    } catch {
      setImportNote(msg("swap.importInvalid"));
    }
  };

  return (
    <div className="mt-3 rounded-xl border border-black/10 bg-white p-3 dark:border-white/10 dark:bg-white/5">
      <p className="text-sm font-medium text-neutral-900 dark:text-white">
        {msg("swap.title")}
      </p>
      <p className="mt-1 text-xs leading-relaxed text-neutral-500 dark:text-neutral-400">
        {msg("swap.mockNote")}
      </p>

      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={msg("swap.search")}
        aria-label={msg("swap.search")}
        className="mt-3 w-full rounded-lg border border-black/10 bg-neutral-50 px-3 py-2 text-sm text-neutral-900 outline-none placeholder:text-neutral-400 focus:border-blue-500 dark:border-white/10 dark:bg-white/5 dark:text-white"
      />

      <div
        className="mt-2 flex flex-wrap gap-1.5"
        role="group"
        aria-label={msg("swap.title")}
      >
        {PRESET_CATEGORIES.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => setCategory(c.id)}
            aria-pressed={category === c.id}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              category === c.id
                ? "bg-neutral-900 text-white dark:bg-white dark:text-neutral-900"
                : "bg-black/5 text-neutral-600 hover:bg-black/10 dark:bg-white/10 dark:text-neutral-300 dark:hover:bg-white/15"
            }`}
          >
            {msg(c.labelKey)}
          </button>
        ))}
      </div>

      {/* Your presets (localStorage only) — saved from the editor. */}
      <div className="mt-3">
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs font-semibold text-neutral-700 dark:text-neutral-200">
            {msg("swap.customTitle")}
            {custom.length > 0 && ` · ${custom.length}`}
          </p>
          <span className="inline-flex gap-1.5">
            <button
              type="button"
              onClick={exportPack}
              disabled={custom.length === 0}
              className="inline-flex items-center gap-1 rounded-full bg-black/5 px-2.5 py-1 text-xs font-medium text-neutral-700 transition-colors hover:bg-black/10 disabled:opacity-40 dark:bg-white/10 dark:text-neutral-200 dark:hover:bg-white/15"
            >
              <DownloadSimple size={12} aria-hidden="true" />
              {msg("swap.exportPack")}
            </button>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-1 rounded-full bg-black/5 px-2.5 py-1 text-xs font-medium text-neutral-700 transition-colors hover:bg-black/10 disabled:opacity-40 dark:bg-white/10 dark:text-neutral-200 dark:hover:bg-white/15"
            >
              <UploadSimple size={12} aria-hidden="true" />
              {msg("swap.importPack")}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="application/json,.json"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void importPack(file);
                e.target.value = "";
              }}
            />
          </span>
        </div>
        {importNote && (
          <p className="mt-1.5 text-xs text-neutral-500 dark:text-neutral-400">
            {importNote}
          </p>
        )}
        {custom.length === 0 ? (
          <p className="mt-1.5 text-xs leading-relaxed text-neutral-500 dark:text-neutral-400">
            {msg("swap.noCustom")}
          </p>
        ) : (
          <ul
            className="mt-1"
            role="listbox"
            aria-label={msg("swap.customTitle")}
          >
            {filteredCustom.map((cp) => {
              const p = customPresetToCamera(cp);
              const active = selectedId === p.id;
              return (
                <li key={cp.id} className="mt-1">
                  <div
                    className={`flex w-full items-center justify-between gap-3 rounded-lg border px-3 py-2 ${
                      active
                        ? "border-blue-500 bg-blue-50 dark:border-blue-400 dark:bg-blue-500/10"
                        : "border-black/10 dark:border-white/10"
                    }`}
                  >
                    <button
                      type="button"
                      role="option"
                      aria-selected={active}
                      onClick={() => setSelectedId(p.id)}
                      className="min-w-0 flex-1 text-left"
                    >
                      <span className="block truncate text-sm font-medium text-neutral-900 dark:text-white">
                        {cp.name}
                      </span>
                      <span className="block text-xs text-neutral-500 dark:text-neutral-400">
                        {headline(p)}
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        deleteCustomPreset(cp.id);
                        setCustom(loadCustomPresets());
                        if (selectedId === p.id) setSelectedId(null);
                      }}
                      aria-label={`${msg("swap.deletePreset")}: ${cp.name}`}
                      title={msg("swap.deletePreset")}
                      className="shrink-0 rounded-full p-1.5 text-neutral-500 transition-colors hover:bg-black/5 hover:text-neutral-900 dark:hover:bg-white/10 dark:hover:text-white"
                    >
                      <X size={14} aria-hidden="true" />
                    </button>
                  </div>
                </li>
              );
            })}
            {filteredCustom.length === 0 && (
              <li className="py-2 text-center text-xs text-neutral-500 dark:text-neutral-400">
                {msg("swap.noResults")}
              </li>
            )}
          </ul>
        )}
      </div>

      <p className="mt-3 text-xs text-neutral-500 dark:text-neutral-400">
        {countMsg(msg, "swap.count", "swap.countOne", filtered.length)}
      </p>
      <ul
        className="mt-1 max-h-64 overflow-y-auto pr-1"
        role="listbox"
        aria-label={msg("swap.title")}
      >
        {filtered.map((p) => {
          const active = selectedId === p.id;
          return (
            <li key={p.id}>
              <button
                type="button"
                role="option"
                aria-selected={active}
                onClick={() => setSelectedId(p.id)}
                className={`mt-1 flex w-full items-center justify-between gap-3 rounded-lg border px-3 py-2 text-left transition-colors ${
                  active
                    ? "border-blue-500 bg-blue-50 dark:border-blue-400 dark:bg-blue-500/10"
                    : "border-black/10 hover:border-black/25 dark:border-white/10 dark:hover:border-white/25"
                }`}
              >
                <span>
                  <span className="block text-sm font-medium text-neutral-900 dark:text-white">
                    {p.brand} {p.model}
                  </span>
                  <span className="block text-xs text-neutral-500 dark:text-neutral-400">
                    {headline(p)}
                  </span>
                </span>
                {active && (
                  <span
                    aria-hidden="true"
                    className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-500 text-xs text-white"
                  >
                    ✓
                  </span>
                )}
              </button>
            </li>
          );
        })}
        {filtered.length === 0 && (
          <li className="py-4 text-center text-sm text-neutral-500 dark:text-neutral-400">
            {msg("swap.noResults")}
          </li>
        )}
      </ul>

      <div className="mt-3 flex gap-2">
        <button
          type="button"
          onClick={() => selected && onApply(selected)}
          disabled={!selected || applying}
          className="flex-1 rounded-full bg-blue-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {applying ? msg("swap.applying") : msg("swap.apply")}
        </button>
        {showApplyAll && onApplyAll && (
          <button
            type="button"
            onClick={() => selected && onApplyAll(selected)}
            disabled={!selected || applying}
            className="flex-1 rounded-full bg-black/5 px-4 py-2 text-sm font-medium text-neutral-700 transition-colors hover:bg-black/10 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-white/10 dark:text-neutral-200 dark:hover:bg-white/15"
          >
            {msg("swap.applyAll")}
          </button>
        )}
        <button
          type="button"
          onClick={onCancel}
          disabled={applying}
          className="rounded-full bg-black/5 px-4 py-2 text-sm font-medium text-neutral-700 transition-colors hover:bg-black/10 disabled:opacity-40 dark:bg-white/10 dark:text-neutral-200 dark:hover:bg-white/15"
        >
          {msg("swap.cancel")}
        </button>
      </div>
    </div>
  );
}
