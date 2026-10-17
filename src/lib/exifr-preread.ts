import type { Tag } from "../workers/exiftool.worker";

/**
 * Instant lightweight pre-read via exifr (no WASM cold-start).
 * Shows tags in the inspector immediately on file drop; the ExifTool
 * worker then replaces these with the authoritative read.
 * Best-effort: returns [] when the file has no parseable EXIF.
 */
export async function prereadTags(data: ArrayBuffer): Promise<Tag[]> {
  const exifr = (await import("exifr")).default;
  const raw = await exifr.parse(data, {
    // Keep it fast: skip thumbnails and binary blobs.
    skip: ["thumbnail", "makerNote"],
  });
  if (!raw || typeof raw !== "object") return [];

  const tags: Tag[] = [];
  for (const [name, value] of Object.entries(raw)) {
    if (value === undefined || value === null) continue;
    const text = Array.isArray(value)
      ? value.join(", ")
      : value instanceof Date
        ? value.toISOString()
        : String(value);
    if (!text || text.startsWith("(Binary data")) continue;
    const group = /^gps/i.test(name) ? "GPS" : "EXIF";
    tags.push({ group, name, value: text });
  }
  return tags;
}
