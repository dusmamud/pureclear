import type { Tag } from "../workers/exiftool.worker";

/** One editable metadata field. Values are always strings in the form;
 *  numbers/dates/GPS are converted when building the ExifTool tag object. */
export type FieldId =
  | "title"
  | "description"
  | "author"
  | "copyright"
  | "keywords"
  | "make"
  | "model"
  | "lensModel"
  | "software"
  | "iso"
  | "fNumber"
  | "exposureTime"
  | "focalLength"
  | "focal35"
  | "dateTimeOriginal"
  | "createDate"
  | "modifyDate"
  | "latitude"
  | "longitude"
  | "altitude";

export type FieldGroup = "basic" | "camera" | "dates" | "location";

export type EditorValues = Record<FieldId, string>;

export interface FieldDef {
  id: FieldId;
  group: FieldGroup;
  /** i18n label key, e.g. "editor.field.title" */
  labelKey: string;
  type: "text" | "textarea" | "number" | "date";
  /** Placeholder shown in the input (already translated text). */
  placeholder: string;
}

export const EDIT_FIELDS: FieldDef[] = [
  {
    id: "title",
    group: "basic",
    labelKey: "editor.field.title",
    type: "text",
    placeholder: "My photo",
  },
  {
    id: "description",
    group: "basic",
    labelKey: "editor.field.description",
    type: "textarea",
    placeholder: "",
  },
  {
    id: "author",
    group: "basic",
    labelKey: "editor.field.author",
    type: "text",
    placeholder: "Jane Doe",
  },
  {
    id: "copyright",
    group: "basic",
    labelKey: "editor.field.copyright",
    type: "text",
    placeholder: "© 2026 Jane Doe",
  },
  {
    id: "keywords",
    group: "basic",
    labelKey: "editor.field.keywords",
    type: "text",
    placeholder: "beach, sunset",
  },
  {
    id: "make",
    group: "camera",
    labelKey: "editor.field.make",
    type: "text",
    placeholder: "Canon",
  },
  {
    id: "model",
    group: "camera",
    labelKey: "editor.field.model",
    type: "text",
    placeholder: "EOS R5",
  },
  {
    id: "lensModel",
    group: "camera",
    labelKey: "editor.field.lensModel",
    type: "text",
    placeholder: "RF 24-70mm",
  },
  {
    id: "software",
    group: "camera",
    labelKey: "editor.field.software",
    type: "text",
    placeholder: "Adobe Lightroom",
  },
  {
    id: "iso",
    group: "camera",
    labelKey: "editor.field.iso",
    type: "number",
    placeholder: "100",
  },
  {
    id: "fNumber",
    group: "camera",
    labelKey: "editor.field.fNumber",
    type: "number",
    placeholder: "2.8",
  },
  {
    id: "exposureTime",
    group: "camera",
    labelKey: "editor.field.exposureTime",
    type: "text",
    placeholder: "1/125",
  },
  {
    id: "focalLength",
    group: "camera",
    labelKey: "editor.field.focalLength",
    type: "number",
    placeholder: "24",
  },
  {
    id: "focal35",
    group: "camera",
    labelKey: "editor.field.focal35",
    type: "number",
    placeholder: "24",
  },
  {
    id: "dateTimeOriginal",
    group: "dates",
    labelKey: "editor.field.dateTimeOriginal",
    type: "date",
    placeholder: "2026:10:18 12:00:00",
  },
  {
    id: "createDate",
    group: "dates",
    labelKey: "editor.field.createDate",
    type: "date",
    placeholder: "2026:10:18 12:00:00",
  },
  {
    id: "modifyDate",
    group: "dates",
    labelKey: "editor.field.modifyDate",
    type: "date",
    placeholder: "2026:10:18 12:00:00",
  },
  {
    id: "latitude",
    group: "location",
    labelKey: "editor.field.latitude",
    type: "number",
    placeholder: "19.0760",
  },
  {
    id: "longitude",
    group: "location",
    labelKey: "editor.field.longitude",
    type: "number",
    placeholder: "72.8777",
  },
  {
    id: "altitude",
    group: "location",
    labelKey: "editor.field.altitude",
    type: "number",
    placeholder: "10",
  },
];

export const FIELD_GROUPS: { id: FieldGroup; labelKey: string }[] = [
  { id: "basic", labelKey: "editor.group.basic" },
  { id: "camera", labelKey: "editor.group.camera" },
  { id: "dates", labelKey: "editor.group.dates" },
  { id: "location", labelKey: "editor.group.location" },
];

/** Fields shown for PDFs (Info dict only — no camera/GPS groups, and no
 *  copyright / DateTimeOriginal, which have no PDF Info-dict key). */
export const PDF_FIELD_IDS: FieldId[] = [
  "title",
  "author",
  "keywords",
  "createDate",
  "modifyDate",
];

export function emptyValues(): EditorValues {
  const v = {} as EditorValues;
  for (const f of EDIT_FIELDS) v[f.id] = "";
  return v;
}

/** ExifTool tag keys written for each field. Basic fields are written to
 *  both EXIF and XMP/IPTC (MWG mapping) so every reader sees the change. */
const TAG_KEYS: Partial<Record<FieldId, string[]>> = {
  title: ["XMP:Title", "EXIF:ImageDescription"],
  description: ["XMP:Description"],
  author: ["EXIF:Artist", "XMP:Creator"],
  copyright: ["EXIF:Copyright", "XMP:Rights"],
  keywords: ["IPTC:Keywords", "XMP:Subject"],
  make: ["EXIF:Make"],
  model: ["EXIF:Model"],
  lensModel: ["EXIF:LensModel"],
  software: ["EXIF:Software"],
  iso: ["EXIF:ISO"],
  fNumber: ["EXIF:FNumber"],
  exposureTime: ["EXIF:ExposureTime"],
  focalLength: ["EXIF:FocalLength"],
  focal35: ["EXIF:FocalLengthIn35mmFormat"],
  dateTimeOriginal: ["EXIF:DateTimeOriginal"],
  createDate: ["EXIF:CreateDate"],
  modifyDate: ["EXIF:ModifyDate"],
};

/** Where to read each field's current value from: [group, name] pairs
 *  tried in order. Groups compared case-insensitively. NOTE: names are
 *  ExifTool's *display* names from plain `-G` output ("Camera Model Name",
 *  "F Number", "Date/Time Original") — not the short tag names. GPS
 *  coordinates only appear as Composite tags in plain `-G` output (the
 *  EXIF-group copy is suppressed as a duplicate without `-a`), so
 *  Composite is tried first for GPS. Short names after each display name
 *  are the exifr preview's naming (shown while the WASM engine boots) —
 *  without them the editor pre-fill is empty for files opened early. */
const READ_FROM: Partial<Record<FieldId, [string, string][]>> = {
  title: [
    ["XMP", "Title"],
    ["EXIF", "Image Description"],
  ],
  description: [["XMP", "Description"]],
  author: [
    ["EXIF", "Artist"],
    ["XMP", "Creator"],
  ],
  copyright: [
    ["EXIF", "Copyright"],
    ["XMP", "Rights"],
  ],
  keywords: [
    ["IPTC", "Keywords"],
    ["XMP", "Subject"],
  ],
  make: [["EXIF", "Make"]],
  model: [
    ["EXIF", "Camera Model Name"],
    ["EXIF", "Model"],
  ],
  lensModel: [
    ["EXIF", "Lens Model"],
    ["EXIF", "LensModel"],
  ],
  software: [["EXIF", "Software"]],
  iso: [["EXIF", "ISO"]],
  fNumber: [
    ["EXIF", "F Number"],
    ["EXIF", "FNumber"],
  ],
  exposureTime: [
    ["EXIF", "Exposure Time"],
    ["EXIF", "ExposureTime"],
  ],
  focalLength: [
    ["EXIF", "Focal Length"],
    ["EXIF", "FocalLength"],
  ],
  focal35: [
    ["EXIF", "Focal Length In 35mm Format"],
    ["EXIF", "FocalLengthIn35mmFormat"],
    ["EXIF", "FocalLengthIn35mmFilm"],
  ],
  dateTimeOriginal: [
    ["EXIF", "Date/Time Original"],
    ["EXIF", "DateTimeOriginal"],
  ],
  createDate: [
    ["EXIF", "Create Date"],
    ["EXIF", "CreateDate"],
  ],
  modifyDate: [
    ["EXIF", "Modify Date"],
    ["EXIF", "ModifyDate"],
  ],
  latitude: [
    ["Composite", "GPS Latitude"],
    ["EXIF", "GPS Latitude"],
    ["GPS", "GPSLatitude"],
    ["EXIF", "GPSLatitude"],
  ],
  longitude: [
    ["Composite", "GPS Longitude"],
    ["EXIF", "GPS Longitude"],
    ["GPS", "GPSLongitude"],
    ["EXIF", "GPSLongitude"],
  ],
  altitude: [
    ["Composite", "GPS Altitude"],
    ["EXIF", "GPS Altitude"],
    ["GPS", "GPSAltitude"],
    ["EXIF", "GPSAltitude"],
  ],
};

function findTag(tags: Tag[], group: string, name: string): Tag | undefined {
  return tags.find(
    (t) => t.group.toUpperCase() === group.toUpperCase() && t.name === name,
  );
}

/** Parse a leading number out of a display value ("24.0 mm" -> "24"). */
function leadingNumber(value: string): string {
  const m = value.match(/-?\d+(?:\.\d+)?/);
  return m ? m[0] : "";
}

/**
 * Parse ExifTool's DMS GPS display ("28 deg 36' 0.00\" N") back to decimal
 * degrees. Also handles exifr's preview format ("28,36,0" — comma-
 * separated degrees, minutes, seconds). Plain decimals pass through
 * unchanged. The EXIF-group copy of a coordinate carries no hemisphere
 * suffix — pass its Ref tag value ("North"/"South"/...) as `refHint`
 * for that case.
 */
export function parseGpsDisplay(value: string, refHint?: string): string {
  const v = value.trim();
  const commaDms = /^(\d+(?:\.\d+)?),(\d+(?:\.\d+)?),([\d.]+)$/.exec(v);
  if (commaDms) {
    const ref = (refHint ?? "").toUpperCase();
    let dec =
      Number(commaDms[1]) +
      Number(commaDms[2]) / 60 +
      Number(commaDms[3]) / 3600;
    if (ref === "S" || ref === "W" || ref === "SOUTH" || ref === "WEST")
      dec = -dec;
    return String(Number(dec.toFixed(6)));
  }
  const dms =
    /^(-?\d+(?:\.\d+)?)\s*deg\s+(\d+(?:\.\d+)?)'\s+([\d.]+)"\s*([NSEW])?$/i.exec(
      v,
    );
  if (!dms) return leadingNumber(v);
  const deg = Number(dms[1]);
  const min = Number(dms[2]);
  const sec = Number(dms[3]);
  const ref = (dms[4] ?? refHint ?? "").toUpperCase();
  let dec = Math.abs(deg) + min / 60 + sec / 3600;
  if (ref === "S" || ref === "W" || ref === "SOUTH" || ref === "WEST")
    dec = -dec;
  return String(Number(dec.toFixed(6)));
}

/** Convert an ISO date string (exifr preview) to ExifTool's format. */
function normalizeDate(value: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})/.exec(
    value.trim(),
  );
  if (!m) return value;
  return `${m[1]}:${m[2]}:${m[3]} ${m[4]}:${m[5]}:${m[6]}`;
}

/** Pre-fill the editor form from the file's current tags. */
export function tagsToFormValues(tags: Tag[]): EditorValues {
  const v = emptyValues();
  for (const field of EDIT_FIELDS) {
    const sources = READ_FROM[field.id];
    if (!sources) continue;
    for (const [group, name] of sources) {
      const tag = findTag(tags, group, name);
      if (!tag) continue;
      if (
        field.id === "dateTimeOriginal" ||
        field.id === "createDate" ||
        field.id === "modifyDate"
      ) {
        // exifr previews dates as ISO strings; normalize to ExifTool form.
        v[field.id] = normalizeDate(tag.value);
      } else if (field.id === "latitude" || field.id === "longitude") {
        // EXIF-group coordinates carry no hemisphere suffix — the Ref
        // tag next to them holds it ("North"/"South"/"East"/"West").
        const refName =
          field.id === "latitude" ? "GPS Latitude Ref" : "GPS Longitude Ref";
        const refTag =
          findTag(tags, "EXIF", refName) ??
          findTag(
            tags,
            "GPS",
            field.id === "latitude" ? "GPSLatitudeRef" : "GPSLongitudeRef",
          );
        v[field.id] = parseGpsDisplay(tag.value, refTag?.value);
      } else if (field.type === "number") {
        v[field.id] = leadingNumber(tag.value);
      } else {
        v[field.id] = tag.value;
      }
      break;
    }
  }
  return v;
}

// ---------------------------------------------------------------------------
// Validation — returns an i18n error key, or null when the value is fine.
// ---------------------------------------------------------------------------

const DATE_RE = /^(\d{4}):(\d{2}):(\d{2}) (\d{2}):(\d{2}):(\d{2})$/;

export function isValidDateTime(value: string): boolean {
  const m = DATE_RE.exec(value.trim());
  if (!m) return false;
  const [, y, mo, d, h, mi, s] = m.map(Number);
  if (mo < 1 || mo > 12 || d < 1 || d > 31 || h > 23 || mi > 59 || s > 59)
    return false;
  const dt = new Date(y, mo - 1, d, h, mi, s);
  return (
    dt.getFullYear() === y && dt.getMonth() === mo - 1 && dt.getDate() === d
  );
}

function numInRange(value: string, min: number, max: number): boolean {
  if (value.trim() === "") return false;
  const n = Number(value);
  return Number.isFinite(n) && n >= min && n <= max;
}

export function validateField(id: FieldId, value: string): string | null {
  const v = value.trim();
  if (v === "") return null; // empty = leave unchanged (or delete if it had one)
  switch (id) {
    case "title":
    case "author":
    case "copyright":
    case "make":
    case "model":
    case "lensModel":
    case "software":
      return v.length > 200 ? "editor.errTextTooLong" : null;
    case "description":
      return v.length > 1000 ? "editor.errTextTooLong" : null;
    case "keywords":
      return v.length > 500 || v.split(",").some((k) => k.trim().length > 100)
        ? "editor.errTextTooLong"
        : null;
    case "iso":
      return /^\d+$/.test(v) && numInRange(v, 1, 102400)
        ? null
        : "editor.errIso";
    case "fNumber":
      return numInRange(v, 0.7, 64) ? null : "editor.errFNumber";
    case "exposureTime":
      if (/^\d+\/\d+$/.test(v)) {
        const den = Number(v.split("/")[1]);
        return den > 0 && den <= 8000 ? null : "editor.errExposure";
      }
      return numInRange(v, 0.0001, 30) ? null : "editor.errExposure";
    case "focalLength":
      return numInRange(v, 0.1, 2000) ? null : "editor.errFocal";
    case "focal35":
      return numInRange(v, 1, 2000) ? null : "editor.errFocal";
    case "dateTimeOriginal":
    case "createDate":
    case "modifyDate":
      return isValidDateTime(v) ? null : "editor.errDate";
    case "latitude":
      return numInRange(v, -90, 90) ? null : "editor.errLat";
    case "longitude":
      return numInRange(v, -180, 180) ? null : "editor.errLon";
    case "altitude":
      return numInRange(v, -10000, 10000) ? null : "editor.errAlt";
    default:
      return null;
  }
}

/**
 * Validate a whole form. Returns per-field error keys plus a group-level
 * GPS error (lat/lon must be set together; altitude needs lat/lon).
 *
 * The GPS pair rule only fires when the user actually CHANGED a GPS
 * field: a file that already carries a latitude without a longitude
 * (partial GPS data exists in the wild) must open in a valid state —
 * blocking Save until the user invents a longitude or deletes the
 * latitude would make the editor unusable for that file.
 */
export function validateValues(
  values: EditorValues,
  initial?: EditorValues,
): {
  errors: Partial<Record<FieldId, string>>;
  gpsError: string | null;
} {
  const errors: Partial<Record<FieldId, string>> = {};
  for (const f of EDIT_FIELDS) {
    const err = validateField(f.id, values[f.id]);
    if (err) errors[f.id] = err;
  }
  let gpsError: string | null = null;
  const lat = values.latitude.trim();
  const lon = values.longitude.trim();
  const alt = values.altitude.trim();
  const gpsChanged =
    !initial ||
    initial.latitude.trim() !== lat ||
    initial.longitude.trim() !== lon ||
    initial.altitude.trim() !== alt;
  if (gpsChanged) {
    if ((lat === "") !== (lon === "")) gpsError = "editor.errGpsPair";
    else if (alt !== "" && (lat === "" || lon === ""))
      gpsError = "editor.errGpsAlt";
  }
  return { errors, gpsError };
}

// ---------------------------------------------------------------------------
// Build the ExifTool tag object from form values.
// Only changed fields are emitted; a cleared field emits "" (delete).
// ---------------------------------------------------------------------------

export type ExifTags = Record<
  string,
  string | number | boolean | (string | number)[]
>;

export function buildWriteTags(
  values: EditorValues,
  initial: EditorValues,
): { tags: ExifTags; changed: FieldId[] } {
  const tags: ExifTags = {};
  const changed: FieldId[] = [];

  for (const field of EDIT_FIELDS) {
    const id = field.id;
    if (id === "latitude" || id === "longitude" || id === "altitude") continue;
    const v = (values[id] ?? "").trim();
    const orig = (initial[id] ?? "").trim();
    if (v === orig) continue;
    changed.push(id);
    const keys = TAG_KEYS[id];
    if (!keys) continue;
    if (v === "") {
      for (const k of keys) tags[k] = "";
      continue;
    }
    if (id === "keywords") {
      const arr = v
        .split(",")
        .map((k) => k.trim())
        .filter(Boolean);
      for (const k of keys) tags[k] = arr.length ? arr : "";
    } else if (id === "iso") {
      for (const k of keys) tags[k] = Number(v);
    } else if (id === "fNumber" || id === "focalLength" || id === "focal35") {
      for (const k of keys) tags[k] = Number(v);
    } else {
      for (const k of keys) tags[k] = v;
    }
  }

  // GPS: lat/lon are written together (plus refs) — ExifTool needs the
  // full set to create a valid GPS IFD.
  const latChanged =
    values.latitude.trim() !== initial.latitude.trim() ||
    values.longitude.trim() !== initial.longitude.trim();
  const altChanged = values.altitude.trim() !== initial.altitude.trim();
  if (latChanged) {
    if (values.latitude.trim() !== initial.latitude.trim())
      changed.push("latitude");
    if (values.longitude.trim() !== initial.longitude.trim())
      changed.push("longitude");
    const lat = values.latitude.trim();
    const lon = values.longitude.trim();
    if (lat === "" || lon === "") {
      tags["EXIF:GPSLatitude"] = "";
      tags["EXIF:GPSLatitudeRef"] = "";
      tags["EXIF:GPSLongitude"] = "";
      tags["EXIF:GPSLongitudeRef"] = "";
    } else {
      const la = Number(lat);
      const lo = Number(lon);
      tags["EXIF:GPSLatitude"] = Math.abs(la);
      tags["EXIF:GPSLatitudeRef"] = la >= 0 ? "N" : "S";
      tags["EXIF:GPSLongitude"] = Math.abs(lo);
      tags["EXIF:GPSLongitudeRef"] = lo >= 0 ? "E" : "W";
    }
  }
  if (altChanged) {
    changed.push("altitude");
    const alt = values.altitude.trim();
    if (alt === "") {
      tags["EXIF:GPSAltitude"] = "";
      tags["EXIF:GPSAltitudeRef"] = "";
    } else {
      const a = Number(alt);
      tags["EXIF:GPSAltitude"] = Math.abs(a);
      tags["EXIF:GPSAltitudeRef"] = a >= 0 ? 0 : 1;
    }
  }

  return { tags, changed };
}

/** PDF Info-dict fields: value = set, null = delete, undefined = skip. */
export interface PdfEditFields {
  title?: string | null;
  author?: string | null;
  creator?: string | null;
  subject?: string | null;
  keywords?: string[] | null;
  createDate?: string | null;
  modifyDate?: string | null;
}

/** Map editor form values to PDF Info-dict edits (changed fields only). */
export function buildPdfEditFields(
  values: EditorValues,
  initial: EditorValues,
): PdfEditFields {
  const out: PdfEditFields = {};
  const pick = (id: FieldId): string | null | undefined => {
    const v = (values[id] ?? "").trim();
    const orig = (initial[id] ?? "").trim();
    if (v === orig) return undefined;
    return v === "" ? null : v;
  };
  const title = pick("title");
  if (title !== undefined) out.title = title;
  const author = pick("author");
  if (author !== undefined) out.author = author;
  const keywords = pick("keywords");
  if (keywords !== undefined)
    out.keywords =
      keywords === null
        ? null
        : keywords
            .split(",")
            .map((k) => k.trim())
            .filter(Boolean);
  const createDate = pick("createDate");
  if (createDate !== undefined) out.createDate = createDate;
  const modifyDate = pick("modifyDate");
  if (modifyDate !== undefined) out.modifyDate = modifyDate;
  return out;
}
