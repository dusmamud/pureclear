import type { Tag } from "../workers/exiftool.worker";

/**
 * Instant lightweight pre-read via exifr (no WASM cold-start).
 * Shows tags in the inspector immediately on file drop; the ExifTool
 * worker then replaces these with the authoritative read.
 * Best-effort: returns [] when the file has no parseable EXIF.
 */

/**
 * exifr's short names vs ExifTool's display names, measured empirically
 * (2026-11-11, real engine reads of icc-test.jpg + compare-test.jpg):
 * Model → Camera Model Name, GPSLatitudeRef → GPS Latitude Ref,
 * GPSLatitude → GPS Latitude, FNumber → F Number,
 * FocalLength → Focal Length, LensModel → Lens Model. Mapping the
 * preview names up front keeps labels stable when the authoritative
 * read lands ~2 s later; names with no observed counterpart are left
 * unchanged (Make, Software, ISO are already identical).
 */
const DISPLAY_NAMES: Record<string, string> = {
  Model: "Camera Model Name",
  GPSLatitudeRef: "GPS Latitude Ref",
  GPSLatitude: "GPS Latitude",
  FNumber: "F Number",
  FocalLength: "Focal Length",
  LensModel: "Lens Model",
};

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
    tags.push({ group, name: DISPLAY_NAMES[name] ?? name, value: text });
  }
  return tags;
}
