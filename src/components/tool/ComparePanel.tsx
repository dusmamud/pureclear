import { X } from "@phosphor-icons/react";
import type { Tag } from "../../lib/engine";
import { compareTags } from "../../lib/tag-viewer";
import type { MsgFn } from "./ToolIsland";

interface ComparePanelProps {
  aName: string;
  aTags: Tag[];
  bName: string;
  bTags: Tag[];
  msg: MsgFn;
  onClose: () => void;
}

export default function ComparePanel({
  aName,
  aTags,
  bName,
  bTags,
  msg,
  onClose,
}: ComparePanelProps) {
  const rows = compareTags(aTags, bTags);
  const diffCount = rows.filter((r) => r.status !== "same").length;

  return (
    <section
      aria-label={msg("compare.title")}
      className="mt-4 overflow-hidden rounded-card border border-hairline bg-card shadow-card"
    >
      <div className="flex flex-wrap items-center gap-2 border-b border-hairline px-4 py-3 sm:px-6">
        <h2 className="text-sm font-semibold text-ink">
          {msg("compare.title")}
        </h2>
        <span className="text-xs text-ink-2">
          {msg("compare.diffCount", { count: diffCount })}
        </span>
        <span className="ms-auto inline-flex flex-wrap items-center gap-1.5 text-[11px]">
          <span className="rounded-full bg-amber-500/15 px-2 py-0.5 font-medium text-amber-700 dark:text-amber-300">
            {msg("compare.different")}
          </span>
          <span className="rounded-full bg-blue-500/10 px-2 py-0.5 font-medium text-blue-700 dark:text-blue-300">
            {msg("compare.onlyOne")}
          </span>
          <span className="rounded-full bg-black/5 px-2 py-0.5 font-medium text-neutral-600 dark:bg-white/10 dark:text-neutral-300">
            {msg("compare.same")}
          </span>
        </span>
        <button
          type="button"
          onClick={onClose}
          className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium text-ink-2 transition-colors hover:bg-black/5 dark:hover:bg-white/10"
        >
          <X size={14} aria-hidden="true" />
          {msg("compare.close")}
        </button>
      </div>
      <div className="max-h-96 overflow-auto">
        <table className="w-full text-[13px]">
          <thead className="sticky top-0 z-10">
            <tr className="bg-canvas text-left shadow-[0_1px_0_var(--color-hairline)]">
              <th
                scope="col"
                className="w-1/4 px-3 py-2 text-[11px] font-medium text-ink-2 sm:px-4"
              >
                {msg("inspector.tag")}
              </th>
              <th
                scope="col"
                className="w-[37%] px-3 py-2 text-[11px] font-medium text-ink-2"
              >
                <span className="block truncate" title={aName}>
                  {aName}
                </span>
              </th>
              <th
                scope="col"
                className="w-[37%] px-3 py-2 text-[11px] font-medium text-ink-2"
              >
                <span className="block truncate" title={bName}>
                  {bName}
                </span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-hairline">
            {rows.map((row) => (
              <tr
                key={row.key}
                className={
                  row.status === "different"
                    ? "bg-amber-500/10"
                    : row.status === "onlyA" || row.status === "onlyB"
                      ? "bg-blue-500/5"
                      : "bg-card"
                }
              >
                <td className="px-3 py-2 align-top sm:px-4">
                  <span className="block font-medium leading-snug text-ink">
                    {row.name}
                  </span>
                  <span className="mt-0.5 block text-[11px] leading-tight text-ink-2">
                    {row.group}
                  </span>
                </td>
                <td className="max-w-0 px-3 py-2 align-top">
                  <span
                    className="block truncate text-[13px] leading-snug text-ink-2"
                    title={row.aValue ?? undefined}
                  >
                    {row.aValue ?? "—"}
                  </span>
                </td>
                <td className="max-w-0 px-3 py-2 align-top">
                  <span
                    className="block truncate text-[13px] leading-snug text-ink-2"
                    title={row.bValue ?? undefined}
                  >
                    {row.bValue ?? "—"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
