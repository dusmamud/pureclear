import type { Tag } from "./engine";

/**
 * Map an inspector tag (ExifTool `-G` display name) to the ExifTool
 * delete key (`GROUP:CanonicalName`) used with `-TAG=` to remove it.
 *
 * Verified empirically (2026-11-09, real engine): display names do NOT
 * work — `EXIF:Camera Model Name=` fails with "doesn't exist or isn't
 * writable" — but canonical names do (`EXIF:Model=`,
 * `EXIF:GPSLatitude=` deleted, Make + ISO survived). Canonical names
 * are the display name with non-alphanumerics stripped, except:
 * - "Camera Model Name" is the odd one out: canonical name is "Model".
 * - GPS tags always delete from the EXIF group: the coordinate only
 *   appears as a Composite tag (computed), and piexif-style files store
 *   the ref in EXIF — `EXIF:GPSLatitude=` removes both.
 *
 * Returns null for tags that cannot be removed individually
 * (MakerNotes is one binary blob; File/System/ExifTool are not real
 * metadata) — the UI disables those checkboxes.
 */
const NAME_OVERRIDES: Record<string, string> = {
  "Camera Model Name": "Model",
};

const NON_REMOVABLE_GROUPS = new Set([
  "MakerNotes",
  "File",
  "System",
  "ExifTool",
]);

export function tagDeleteKey(tag: Tag): string | null {
  if (NON_REMOVABLE_GROUPS.has(tag.group)) return null;
  if (tag.group === "Composite" && !tag.name.toUpperCase().startsWith("GPS"))
    return null;
  const canonical =
    NAME_OVERRIDES[tag.name] ?? tag.name.replace(/[^A-Za-z0-9]/g, "");
  if (!canonical) return null;
  const group = tag.name.toUpperCase().startsWith("GPS") ? "EXIF" : tag.group;
  return `${group}:${canonical}`;
}

/** Delete keys for a list of tags; null entries are dropped. */
export function deleteKeysFor(tags: Tag[]): string[] {
  const keys: string[] = [];
  for (const t of tags) {
    const key = tagDeleteKey(t);
    if (key) keys.push(key);
  }
  return keys;
}
