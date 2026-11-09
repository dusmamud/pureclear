import type { Tag } from "./engine";

/**
 * Display group for a tag. ExifTool's `-G` groups put GPS tags in two
 * places — "GPS Latitude Ref" lives in EXIF, the coordinate itself only
 * appears as a Composite tag — so a user looking for "GPS" finds no
 * GPS group. Tags whose NAME starts with GPS are shown under one
 * virtual "GPS" group instead (every real GPS tag is named that way).
 */
export function displayGroup(tag: Tag): string {
  return tag.name.toUpperCase().startsWith("GPS") ? "GPS" : tag.group;
}

/** Group order for the inspector: the groups users look for first. */
const GROUP_ORDER = [
  "EXIF",
  "GPS",
  "XMP",
  "IPTC",
  "JFIF",
  "PNG",
  "MakerNotes",
  "Composite",
  "PDF",
];

export interface TagGroup {
  group: string;
  tags: Tag[];
}

/** Group tags preserving first-seen order inside each group; groups come
 *  in GROUP_ORDER, anything else alphabetically after. */
export function groupTags(tags: Tag[]): TagGroup[] {
  const byGroup = new Map<string, Tag[]>();
  for (const t of tags) {
    const group = displayGroup(t);
    const list = byGroup.get(group);
    if (list) list.push(t);
    else byGroup.set(group, [t]);
  }
  const groups = [...byGroup.entries()].map(([group, tags]) => ({
    group,
    tags,
  }));
  const rank = (g: string) => {
    const i = GROUP_ORDER.indexOf(g);
    return i === -1 ? GROUP_ORDER.length : i;
  };
  groups.sort(
    (a, b) => rank(a.group) - rank(b.group) || a.group.localeCompare(b.group),
  );
  return groups;
}

/** Case-insensitive match on tag name, value, or group. Empty query
 *  returns the input unchanged. */
export function filterTags(tags: Tag[], query: string): Tag[] {
  const q = query.trim().toLowerCase();
  if (!q) return tags;
  return tags.filter(
    (t) =>
      t.name.toLowerCase().includes(q) ||
      t.value.toLowerCase().includes(q) ||
      t.group.toLowerCase().includes(q),
  );
}

/** Export helpers — the inspector's JSON/CSV download. */
export function tagsToJson(tags: Tag[]): string {
  return JSON.stringify(
    tags.map((t) => ({ group: t.group, name: t.name, value: t.value })),
    null,
    2,
  );
}

function csvCell(s: string): string {
  return /[",\n\r]/.test(s) ? `"${s.replaceAll('"', '""')}"` : s;
}

export function tagsToCsv(tags: Tag[]): string {
  const lines = ["group,name,value"];
  for (const t of tags) {
    lines.push([t.group, t.name, t.value].map(csvCell).join(","));
  }
  return lines.join("\n") + "\n";
}

export type CompareStatus = "same" | "different" | "onlyA" | "onlyB";

export interface CompareRow {
  key: string;
  group: string;
  name: string;
  aValue: string | null;
  bValue: string | null;
  status: CompareStatus;
}

/** Side-by-side diff of two tag lists, keyed by group + name. Rows are
 *  ordered by group (GROUP_ORDER) then name; differences sort first
 *  inside each group so the eye lands on what changed. */
export function compareTags(a: Tag[], b: Tag[]): CompareRow[] {
  const map = new Map<string, CompareRow>();
  for (const t of a) {
    const group = displayGroup(t);
    const key = `${group}\0${t.name}`;
    map.set(key, {
      key,
      group,
      name: t.name,
      aValue: t.value,
      bValue: null,
      status: "onlyA",
    });
  }
  for (const t of b) {
    const group = displayGroup(t);
    const key = `${group}\0${t.name}`;
    const row = map.get(key);
    if (row) {
      row.bValue = t.value;
      row.status = row.aValue === t.value ? "same" : "different";
    } else {
      map.set(key, {
        key,
        group,
        name: t.name,
        aValue: null,
        bValue: t.value,
        status: "onlyB",
      });
    }
  }
  const rank = (g: string) => {
    const i = GROUP_ORDER.indexOf(g);
    return i === -1 ? GROUP_ORDER.length : i;
  };
  const statusRank: Record<CompareStatus, number> = {
    different: 0,
    onlyA: 1,
    onlyB: 1,
    same: 2,
  };
  return [...map.values()].sort(
    (x, y) =>
      rank(x.group) - rank(y.group) ||
      x.group.localeCompare(y.group) ||
      statusRank[x.status] - statusRank[y.status] ||
      x.name.localeCompare(y.name),
  );
}
