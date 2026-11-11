import { useMemo, useState } from "react";
import {
  CaretRight,
  DownloadSimple,
  SpinnerGap,
  Trash,
  WarningCircle,
} from "@phosphor-icons/react";
import type { Tag } from "../../lib/engine";
import { tagDeleteKey } from "../../lib/tag-delete";
import {
  displayGroup,
  filterTags,
  groupTags,
  tagsToCsv,
  tagsToJson,
} from "../../lib/tag-viewer";
import { downloadBlob } from "../../lib/zip";
import type { MsgFn } from "./ToolIsland";

interface TagInspectorProps {
  tags: Tag[];
  hasGps: boolean;
  hasIcc: boolean;
  verifying: boolean;
  fileName: string;
  msg: MsgFn;
  /** Selective removal (photos only): per-tag checkboxes. */
  selectable?: boolean;
  selected?: Set<string>;
  onToggleSelect?: (tag: Tag) => void;
  selectedTags?: Tag[];
  removing?: boolean;
  onRemoveSelected?: () => void;
}

function baseName(fileName: string): string {
  return fileName.replace(/\.[^.]+$/, "");
}

function TagTable({
  tags,
  msg,
  selectable,
  selected,
  onToggleSelect,
}: {
  tags: Tag[];
  msg: MsgFn;
  selectable?: boolean;
  selected?: Set<string>;
  onToggleSelect?: (tag: Tag) => void;
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-hairline bg-card">
      <div className="max-h-56 overflow-auto">
        <table className="w-full text-[13px]">
          <thead className="sticky top-0 z-10">
            <tr className="bg-canvas text-left shadow-[0_1px_0_var(--color-hairline)]">
              {selectable && (
                <th scope="col" className="w-10 px-2 py-2">
                  <span className="sr-only">{msg("tool.removeSelected")}</span>
                </th>
              )}
              <th
                scope="col"
                className="w-2/5 px-3 py-2 text-[11px] font-medium text-ink-2"
              >
                {msg("inspector.tag")}
              </th>
              <th
                scope="col"
                className="px-3 py-2 text-[11px] font-medium text-ink-2"
              >
                {msg("inspector.value")}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-hairline">
            {tags.slice(0, 100).map((tag, i) => {
              const removable = tagDeleteKey(tag) !== null;
              // Same stable key as the selection state in ToolIsland:
              // the canonical delete key survives the preview →
              // authoritative rename, so a checked box stays checked.
              const key = tagDeleteKey(tag) ?? `${tag.group}|${tag.name}`;
              return (
                <tr
                  key={i}
                  className={i % 2 === 1 ? "bg-canvas/60" : "bg-card"}
                >
                  {selectable && (
                    <td className="w-10 px-2 py-2 align-top">
                      <input
                        type="checkbox"
                        checked={selected?.has(key) ?? false}
                        disabled={!removable}
                        title={
                          removable ? undefined : msg("viewer.notRemovable")
                        }
                        onChange={() => onToggleSelect?.(tag)}
                        aria-label={`${tag.name} — ${msg("tool.removeSelected")}`}
                        className="mt-0.5 h-4 w-4 accent-blue-500 disabled:opacity-30"
                      />
                    </td>
                  )}
                  <td className="px-3 py-2 align-top">
                    <span className="block font-medium leading-snug text-ink">
                      {tag.name}
                    </span>
                    <span className="mt-0.5 block text-[11px] leading-tight text-ink-2">
                      {displayGroup(tag)}
                    </span>
                  </td>
                  <td className="max-w-0 px-3 py-2 align-top">
                    <span
                      className="block truncate text-[13px] leading-snug text-ink-2"
                      title={tag.value}
                    >
                      {tag.value}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {tags.length > 100 && (
        <p className="border-t border-hairline px-3 py-2 text-xs text-ink-2">
          {msg("viewer.showingFirst", { count: tags.length })}
        </p>
      )}
    </div>
  );
}

export default function TagInspector({
  tags,
  hasGps,
  hasIcc,
  verifying,
  fileName,
  msg,
  selectable,
  selected,
  onToggleSelect,
  selectedTags,
  removing,
  onRemoveSelected,
}: TagInspectorProps) {
  const [query, setQuery] = useState("");
  const [group, setGroup] = useState("all");

  const groups = useMemo(() => groupTags(tags), [tags]);
  const filtered = useMemo(() => {
    const byQuery = filterTags(tags, query);
    // Filter by display group, not the raw ExifTool group: GPS tags live
    // in EXIF/Composite but render under the virtual "GPS" group.
    return group === "all"
      ? byQuery
      : byQuery.filter((t) => displayGroup(t) === group);
  }, [tags, query, group]);
  const filtering = query.trim() !== "" || group !== "all";

  const exportFile = (kind: "json" | "csv") => {
    const base = baseName(fileName);
    if (kind === "json") {
      downloadBlob(
        new Blob([tagsToJson(tags)], { type: "application/json" }),
        `${base}.tags.json`,
      );
    } else {
      downloadBlob(
        new Blob([tagsToCsv(tags)], { type: "text/csv" }),
        `${base}.tags.csv`,
      );
    }
  };

  return (
    <div className="mt-4 rounded-2xl border border-hairline bg-canvas/60 p-3 sm:p-4">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 px-1">
        <p className="text-[13px] font-semibold text-ink">
          {msg("tool.tagsFound", { count: tags.length })}
        </p>
        {verifying && (
          <span className="inline-flex items-center gap-1.5 text-xs text-ink-2">
            <SpinnerGap size={12} className="animate-spin" aria-hidden="true" />
            {msg("tool.processing")}
          </span>
        )}
        {hasGps && (
          <p className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2.5 py-1 text-xs font-medium text-amber-700 dark:text-amber-300">
            <WarningCircle size={14} aria-hidden="true" />
            {msg("tool.gpsWarning")}
          </p>
        )}
        <span className="ms-auto inline-flex gap-1.5">
          <button
            type="button"
            onClick={() => exportFile("json")}
            disabled={tags.length === 0}
            className="inline-flex items-center gap-1 rounded-full bg-black/5 px-2.5 py-1 text-xs font-medium text-neutral-700 transition-colors hover:bg-black/10 disabled:opacity-40 dark:bg-white/10 dark:text-neutral-200 dark:hover:bg-white/15"
          >
            <DownloadSimple size={12} aria-hidden="true" />
            {msg("viewer.exportJson")}
          </button>
          <button
            type="button"
            onClick={() => exportFile("csv")}
            disabled={tags.length === 0}
            className="inline-flex items-center gap-1 rounded-full bg-black/5 px-2.5 py-1 text-xs font-medium text-neutral-700 transition-colors hover:bg-black/10 disabled:opacity-40 dark:bg-white/10 dark:text-neutral-200 dark:hover:bg-white/15"
          >
            <DownloadSimple size={12} aria-hidden="true" />
            {msg("viewer.exportCsv")}
          </button>
          {selectable && (selectedTags?.length ?? 0) > 0 && (
            <button
              type="button"
              onClick={onRemoveSelected}
              disabled={removing}
              className="inline-flex items-center gap-1 rounded-full bg-red-500/15 px-2.5 py-1 text-xs font-medium text-red-700 transition-colors hover:bg-red-500/25 disabled:opacity-40 dark:text-red-300"
            >
              <Trash size={12} aria-hidden="true" />
              {removing
                ? msg("tool.removing")
                : `${msg("tool.removeSelected")} (${selectedTags?.length})`}
            </button>
          )}
        </span>
      </div>
      {hasIcc && (
        <p className="mt-2 px-1 text-xs leading-relaxed text-ink-2">
          {msg("tool.iccNote")}
        </p>
      )}

      {tags.length > 0 && (
        <>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={msg("viewer.search")}
            aria-label={msg("viewer.search")}
            className="mt-3 w-full rounded-lg border border-black/10 bg-card px-3 py-2 text-sm text-neutral-900 outline-none placeholder:text-neutral-400 focus:border-blue-500 dark:border-white/10 dark:bg-white/5 dark:text-white"
          />

          <div className="mt-2 flex flex-wrap gap-1.5" role="group">
            <button
              type="button"
              onClick={() => setGroup("all")}
              aria-pressed={group === "all"}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                group === "all"
                  ? "bg-neutral-900 text-white dark:bg-white dark:text-neutral-900"
                  : "bg-black/5 text-neutral-600 hover:bg-black/10 dark:bg-white/10 dark:text-neutral-300 dark:hover:bg-white/15"
              }`}
            >
              {msg("viewer.groupAll")}
            </button>
            {groups.map((g) => (
              <button
                key={g.group}
                type="button"
                onClick={() => setGroup(g.group)}
                aria-pressed={group === g.group}
                className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                  group === g.group
                    ? "bg-neutral-900 text-white dark:bg-white dark:text-neutral-900"
                    : "bg-black/5 text-neutral-600 hover:bg-black/10 dark:bg-white/10 dark:text-neutral-300 dark:hover:bg-white/15"
                }`}
              >
                {g.group} · {g.tags.length}
              </button>
            ))}
          </div>

          {filtering && (
            <p className="mt-2 px-1 text-xs text-neutral-500 dark:text-neutral-400">
              {msg("viewer.matching", { count: filtered.length })}
            </p>
          )}

          {filtered.length === 0 ? (
            <p className="py-4 text-center text-sm text-neutral-500 dark:text-neutral-400">
              {msg("viewer.noMatch")}
            </p>
          ) : filtering ? (
            <div className="mt-3">
              <TagTable
                tags={filtered}
                msg={msg}
                selectable={selectable}
                selected={selected}
                onToggleSelect={onToggleSelect}
              />
            </div>
          ) : (
            <div className="mt-3 space-y-2">
              {groups.map((g) => (
                <details key={g.group} open className="group">
                  <summary className="flex cursor-pointer list-none items-center gap-1.5 rounded-lg px-1 py-1 text-[13px] font-semibold text-ink [&::-webkit-details-marker]:hidden">
                    <CaretRight
                      size={14}
                      aria-hidden="true"
                      className="transition-transform group-open:rotate-90"
                    />
                    {g.group}
                    <span className="font-normal text-ink-2">
                      · {g.tags.length}
                    </span>
                  </summary>
                  <TagTable
                    tags={g.tags}
                    msg={msg}
                    selectable={selectable}
                    selected={selected}
                    onToggleSelect={onToggleSelect}
                  />
                </details>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
