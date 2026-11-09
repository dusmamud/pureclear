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
  onCancel,
}: Props) {
  const [initial] = useState(() => tagsToFormValues(tags));
  const [values, setValues] = useState<EditorValues>(initial);

  const visibleFields = isPdf
    ? EDIT_FIELDS.filter((f) => PDF_FIELD_IDS.includes(f.id))
    : EDIT_FIELDS;
  const visibleGroups = FIELD_GROUPS.filter((g) =>
    visibleFields.some((f) => f.group === g.id),
  );

  const { errors, gpsError } = validateValues(values);
  const changedCount = visibleFields.filter(
    (f) => (values[f.id] ?? "").trim() !== (initial[f.id] ?? "").trim(),
  ).length;
  const hasErrors =
    Object.keys(errors).length > 0 || (gpsError !== null && !isPdf);
  const canSave = changedCount > 0 && !hasErrors && !saving;

  const set = (id: FieldDef["id"], value: string) =>
    setValues((v) => ({ ...v, [id]: value }));

  const save = () => {
    if (!canSave) return;
    if (isPdf) {
      onSave({
        kind: "pdf",
        fields: buildPdfEditFields(values, initial),
        changedCount,
      });
    } else {
      const { tags: writeTags } = buildWriteTags(values, initial);
      onSave({ kind: "exif", tags: writeTags, changedCount });
    }
  };

  return (
    <div className="mt-4 rounded-2xl border border-hairline bg-canvas/60 p-3 sm:p-4">
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
          className="shrink-0 rounded-full p-1.5 text-ink-2 transition-all hover:bg-black/[0.04] hover:text-ink active:scale-95 dark:hover:bg-white/[0.06]"
        >
          <X size={16} aria-hidden="true" />
        </button>
      </div>

      {visibleGroups.map((group) => (
        <fieldset key={group.id} className="mt-4">
          <legend className="px-1 text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-2">
            {msg(group.labelKey)}
          </legend>
          <div className="mt-2 grid gap-3 sm:grid-cols-2">
            {visibleFields
              .filter((f) => f.group === group.id)
              .map((field) => {
                const err = errors[field.id];
                const inputCls = `w-full rounded-xl border bg-card px-3 py-2 text-sm text-ink outline-none transition-all placeholder:text-ink-2/60 focus:border-accent focus:ring-2 focus:ring-accent/20 ${
                  err ? "border-red-500/60" : "border-hairline"
                }`;
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
                        className={inputCls}
                      />
                    )}
                    {err && (
                      <span className="mt-1 block text-xs text-red-600 dark:text-red-400">
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

      <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={onCancel}
          className="inline-flex items-center justify-center gap-2 rounded-pill border border-hairline bg-card px-5 py-2.5 text-sm font-medium text-ink transition-all duration-300 hover:opacity-70 active:scale-[0.97]"
        >
          {msg("editor.cancel")}
        </button>
        <button
          type="button"
          onClick={save}
          disabled={!canSave}
          className="inline-flex items-center justify-center gap-2 rounded-pill bg-accent px-5 py-2.5 text-sm font-medium text-white transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] hover:bg-accent-hover active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Check size={16} aria-hidden="true" />
          {saving ? msg("editor.saving") : msg("editor.save")}
        </button>
      </div>
    </div>
  );
}
