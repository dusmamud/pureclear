import { useState } from "react";
import { Check, X } from "@phosphor-icons/react";
import type { Tag } from "../../lib/engine";
import {
  EDIT_FIELDS,
  FIELD_GROUPS,
  PDF_FIELD_IDS,
  buildPdfEditFields,
  buildWriteTags,
  tagsToFormValues,
  validateValues,
  type EditorValues,
  type ExifTags,
  type FieldDef,
  type FieldId,
  type PdfEditFields,
} from "../../lib/metadata-editor";
import type { MsgFn } from "./ToolIsland";

export type EditPayload =
  | { kind: "exif"; tags: ExifTags; changedCount: number }
  | { kind: "pdf"; fields: PdfEditFields; changedCount: number };

interface Props {
  tags: Tag[];
  isPdf: boolean;
  msg: MsgFn;
  saving: boolean;
  onSave: (payload: EditPayload) => void;
  /** Batch: same payload to every matching file (photos or PDFs). */
  onSaveAll?: (payload: EditPayload) => void;
  showSaveAll?: boolean;
  /** Custom preset: save the changed EXIF tags under a name (photos only). */
  onSavePreset?: (name: string, tags: ExifTags) => void;
  onCancel: () => void;
}

/**
 * Inline metadata editor: form pre-filled from the file's current tags.
 * Clearing a field deletes that tag on save; edits never touch pixels.
 */
export default function MetadataEditor({
  tags,
  isPdf,
  msg,
  saving,
  onSave,
  onSaveAll,
  showSaveAll,
  onSavePreset,
  onCancel,
}: Props) {
  const [namingPreset, setNamingPreset] = useState(false);
  const [presetName, setPresetName] = useState("");
  const [presetSaved, setPresetSaved] = useState(false);
  const [initial] = useState(() => tagsToFormValues(tags));
  const [values, setValues] = useState<EditorValues>(initial);

  const visibleFields = isPdf
    ? EDIT_FIELDS.filter((f) => PDF_FIELD_IDS.includes(f.id))
    : EDIT_FIELDS;
  const visibleGroups = FIELD_GROUPS.filter((g) =>
    visibleFields.some((f) => f.group === g.id),
  );

  const { errors, gpsError } = validateValues(values, initial);
  const changedIds = new Set(
    visibleFields
      .filter(
        (f) => (values[f.id] ?? "").trim() !== (initial[f.id] ?? "").trim(),
      )
      .map((f) => f.id),
  );
  const changedCount = changedIds.size;
  // Only errors on fields the user actually changed block saving: an
  // unchanged value is never written, so flagging it would wrongly lock
  // the form (e.g. a file that already has a latitude without a
  // longitude). The GPS pair rule itself is already gated the same way
  // inside validateValues.
  const hasErrors =
    Object.keys(errors).some((id) => changedIds.has(id as FieldId)) ||
    (gpsError !== null && !isPdf);
  const canSave = changedCount > 0 && !hasErrors && !saving;

  const set = (id: FieldDef["id"], value: string) =>
    setValues((v) => ({ ...v, [id]: value }));

  const buildPayload = (): EditPayload => {
    if (isPdf) {
      return {
        kind: "pdf",
        fields: buildPdfEditFields(values, initial),
        changedCount,
      };
    }
    const { tags: writeTags } = buildWriteTags(values, initial);
    return { kind: "exif", tags: writeTags, changedCount };
  };

  const save = () => {
    if (!canSave) return;
    onSave(buildPayload());
  };

  const saveAll = () => {
    if (!canSave || !onSaveAll) return;
    onSaveAll(buildPayload());
  };

  /** Save the changed EXIF tags (deletions dropped) as a custom preset. */
  const confirmSavePreset = () => {
    if (!onSavePreset || !presetName.trim() || isPdf) return;
    const { tags: writeTags } = buildWriteTags(values, initial);
    const clean: ExifTags = {};
    for (const [k, v] of Object.entries(writeTags)) {
      if (v !== "") clean[k] = v;
    }
    if (Object.keys(clean).length === 0) return;
    onSavePreset(presetName.trim(), clean);
    setNamingPreset(false);
    setPresetName("");
    setPresetSaved(true);
  };

  return (
    <form
      className="mt-4 rounded-2xl border border-hairline bg-canvas/60 p-3 sm:p-4"
      onSubmit={(e) => {
        e.preventDefault();
        save();
      }}
    >
      <div className="flex items-start justify-between gap-3 px-1">
        <div>
          <p className="text-[13px] font-semibold text-ink">
            {msg("editor.title")}
          </p>
          <p className="mt-0.5 text-xs leading-relaxed text-ink-2">
            {msg("editor.note")}
          </p>
        </div>
        <button
          type="button"
          onClick={onCancel}
          aria-label={msg("editor.cancel")}
          className="shrink-0 rounded-full p-1.5 text-ink-2 transition-[color,background-color,transform] duration-200 hover:bg-black/[0.04] hover:text-ink active:scale-95 dark:hover:bg-white/[0.06]"
        >
          <X size={16} aria-hidden="true" />
        </button>
      </div>

      {visibleGroups.map((group) => (
        <fieldset key={group.id} className="mt-4">
          <legend className="px-1 text-[11px] font-medium text-ink-2">
            {msg(group.labelKey)}
          </legend>
          <div className="mt-2 grid gap-3 sm:grid-cols-2">
            {visibleFields
              .filter((f) => f.group === group.id)
              .map((field) => {
                // Show an error only on fields the user changed — an
                // untouched pre-filled value is never written.
                const err = changedIds.has(field.id)
                  ? errors[field.id]
                  : undefined;
                const inputCls = `w-full rounded-xl border bg-card px-3 py-2 text-sm text-ink outline-none transition-[border-color,box-shadow] duration-200 placeholder:text-ink-2/60 focus:border-accent focus:ring-2 focus:ring-accent/20 ${
                  err ? "border-red-500/60" : "border-hairline"
                }`;
                // Date fields keep their text input (ExifTool's
                // YYYY:MM:DD HH:MM:SS), but the format is now stated
                // visibly and linked to the input for screen readers.
                const hintId =
                  field.type === "date" ? `${field.id}-hint` : undefined;
                const errorId = err ? `${field.id}-error` : undefined;
                const describedBy =
                  [hintId, errorId].filter(Boolean).join(" ") || undefined;
                return (
                  <label key={field.id} className="block">
                    <span className="mb-1 block text-xs font-medium text-ink">
                      {msg(field.labelKey)}
                    </span>
                    {field.type === "textarea" ? (
                      <textarea
                        value={values[field.id]}
                        onChange={(e) => set(field.id, e.target.value)}
                        rows={2}
                        placeholder={field.placeholder}
                        aria-invalid={err ? true : undefined}
                        aria-describedby={describedBy}
                        className={`${inputCls} resize-none`}
                      />
                    ) : (
                      <input
                        type="text"
                        inputMode={
                          field.type === "number" ? "decimal" : undefined
                        }
                        value={values[field.id]}
                        onChange={(e) => set(field.id, e.target.value)}
                        placeholder={field.placeholder}
                        aria-invalid={err ? true : undefined}
                        aria-describedby={describedBy}
                        className={inputCls}
                      />
                    )}
                    {field.type === "date" && (
                      <span
                        id={hintId}
                        className="mt-1 block text-xs text-ink-2"
                      >
                        {msg("editor.dateHint")}
                      </span>
                    )}
                    {err && (
                      <span
                        id={errorId}
                        className="mt-1 block text-xs text-red-600 dark:text-red-400"
                      >
                        {msg(err)}
                      </span>
                    )}
                  </label>
                );
              })}
          </div>
          {group.id === "location" && gpsError && (
            <p className="mt-2 px-1 text-xs text-red-600 dark:text-red-400">
              {msg(gpsError)}
            </p>
          )}
        </fieldset>
      ))}

      <p className="mt-4 px-1 text-xs leading-relaxed text-ink-2">
        {msg("editor.clearNote")}
      </p>

      {namingPreset ? (
        <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:justify-end">
          <input
            type="text"
            value={presetName}
            onChange={(e) => setPresetName(e.target.value)}
            onKeyDown={(e) => {
              // Enter here confirms the preset name — it must not
              // submit the editor form instead.
              if (e.key === "Enter") {
                e.preventDefault();
                confirmSavePreset();
              }
            }}
            placeholder={msg("editor.presetName")}
            aria-label={msg("editor.presetName")}
            autoFocus
            className="w-full rounded-xl border border-hairline bg-card px-3 py-2.5 text-sm text-ink outline-none transition-[border-color,box-shadow] duration-200 placeholder:text-ink-2/60 focus:border-accent focus:ring-2 focus:ring-accent/20 sm:w-64"
          />
          <button
            type="button"
            onClick={confirmSavePreset}
            disabled={!presetName.trim()}
            className="inline-flex items-center justify-center gap-2 rounded-pill bg-accent px-5 py-2.5 text-sm font-medium text-white transition-[color,background-color,transform] duration-200 ease-apple hover:bg-accent-hover active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Check size={16} aria-hidden="true" />
            {msg("editor.savePresetConfirm")}
          </button>
          <button
            type="button"
            onClick={() => {
              setNamingPreset(false);
              setPresetName("");
            }}
            className="inline-flex items-center justify-center gap-2 rounded-pill border border-hairline bg-card px-5 py-2.5 text-sm font-medium text-ink transition-[color,background-color,opacity,transform] duration-200 hover:opacity-70 active:scale-[0.97]"
          >
            {msg("editor.cancel")}
          </button>
        </div>
      ) : (
        <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:justify-end">
          {presetSaved && (
            <p className="self-center text-xs font-medium text-green-700 sm:me-auto dark:text-green-400">
              {msg("editor.presetSaved")}
            </p>
          )}
          {!isPdf && onSavePreset && (
            <button
              type="button"
              onClick={() => {
                setNamingPreset(true);
                setPresetSaved(false);
              }}
              disabled={!canSave}
              className="inline-flex items-center justify-center gap-2 rounded-pill border border-hairline bg-card px-5 py-2.5 text-sm font-medium text-ink transition-[color,background-color,opacity,transform] duration-200 hover:opacity-70 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-40"
            >
              {msg("editor.savePreset")}
            </button>
          )}
          {showSaveAll && onSaveAll && (
            <button
              type="button"
              onClick={saveAll}
              disabled={!canSave}
              className="inline-flex items-center justify-center gap-2 rounded-pill border border-hairline bg-card px-5 py-2.5 text-sm font-medium text-ink transition-[color,background-color,opacity,transform] duration-200 hover:opacity-70 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-40"
            >
              {msg("editor.saveAll")}
            </button>
          )}
          <button
            type="button"
            onClick={onCancel}
            className="inline-flex items-center justify-center gap-2 rounded-pill border border-hairline bg-card px-5 py-2.5 text-sm font-medium text-ink transition-[color,background-color,opacity,transform] duration-200 hover:opacity-70 active:scale-[0.97]"
          >
            {msg("editor.cancel")}
          </button>
          <button
            type="submit"
            disabled={!canSave}
            className="inline-flex items-center justify-center gap-2 rounded-pill bg-accent px-5 py-2.5 text-sm font-medium text-white transition-[color,background-color,transform] duration-200 ease-apple hover:bg-accent-hover active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Check size={16} aria-hidden="true" />
            {saving ? msg("editor.saving") : msg("editor.save")}
          </button>
        </div>
      )}
    </form>
  );
}
