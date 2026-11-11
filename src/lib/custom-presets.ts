import type { CameraPreset } from "../data/camera-presets";
import type { ExifTags } from "./metadata-editor";

export interface CustomPreset {
  id: string;
  name: string;
  tags: ExifTags;
  createdAt: number;
}

const KEY = "pureclear.customPresets.v1";

/** localStorage when available, in-memory fallback otherwise (private
 *  mode, SSR, unit tests). Custom presets never leave the device. */
const mem = new Map<string, string>();
const store = {
  get(k: string): string | null {
    try {
      if (typeof localStorage !== "undefined") return localStorage.getItem(k);
    } catch {
      /* fall through to memory */
    }
    return mem.get(k) ?? null;
  },
  set(k: string, v: string): void {
    try {
      if (typeof localStorage !== "undefined") {
        localStorage.setItem(k, v);
        return;
      }
    } catch {
      /* fall through to memory */
    }
    mem.set(k, v);
  },
};

export function loadCustomPresets(): CustomPreset[] {
  try {
    const raw = store.get(KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((p): p is CustomPreset => isCustomPreset(p));
  } catch {
    return [];
  }
}

function isCustomPreset(p: unknown): p is CustomPreset {
  if (typeof p !== "object" || p === null) return false;
  const o = p as Record<string, unknown>;
  return (
    typeof o.id === "string" &&
    typeof o.name === "string" &&
    o.name.trim() !== "" &&
    typeof o.tags === "object" &&
    o.tags !== null &&
    Object.keys(o.tags as Record<string, unknown>).length > 0
  );
}

export function saveCustomPreset(name: string, tags: ExifTags): CustomPreset {
  const preset: CustomPreset = {
    id:
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `c${Date.now().toString(36)}${Math.floor(Math.random() * 1e6).toString(36)}`,
    name: name.trim(),
    tags,
    createdAt: Date.now(),
  };
  const all = loadCustomPresets();
  // Same name = same preset: replace the existing entry instead of
  // stacking up duplicates (re-saving from the editor, or re-importing
  // an exported pack, must not duplicate every preset).
  const existing = all.findIndex((p) => p.name === preset.name);
  if (existing !== -1) all.splice(existing, 1);
  all.push(preset);
  store.set(KEY, JSON.stringify(all));
  return preset;
}

export function deleteCustomPreset(id: string): void {
  store.set(
    KEY,
    JSON.stringify(loadCustomPresets().filter((p) => p.id !== id)),
  );
}

/**
 * Adapt a custom preset to the picker/swap shape. Category is unused
 * for custom rows (they live in their own "Your presets" section),
 * so it is fixed to "phone" and never used for filtering.
 */
export function customPresetToCamera(cp: CustomPreset): CameraPreset {
  return {
    id: `custom-${cp.id}`,
    brand: "Custom",
    model: cp.name,
    category: "phone",
    tags: cp.tags,
  };
}

/** Validate an imported preset pack (JSON file). Returns the presets
 *  worth keeping plus human-readable problems; bad entries are skipped,
 *  never applied. */
export function validatePresetPack(data: unknown): {
  presets: { name: string; tags: ExifTags }[];
  errors: string[];
} {
  const presets: { name: string; tags: ExifTags }[] = [];
  const errors: string[] = [];
  if (!Array.isArray(data)) {
    return { presets, errors: ["not-an-array"] };
  }
  for (const [i, item] of data.entries()) {
    if (typeof item !== "object" || item === null) {
      errors.push(`entry ${i}: not-an-object`);
      continue;
    }
    const o = item as Record<string, unknown>;
    if (typeof o.name !== "string" || o.name.trim() === "") {
      errors.push(`entry ${i}: missing-name`);
      continue;
    }
    if (typeof o.tags !== "object" || o.tags === null) {
      errors.push(`entry ${i}: missing-tags`);
      continue;
    }
    const tags = o.tags as Record<string, unknown>;
    const clean: ExifTags = {};
    let bad = false;
    for (const [k, v] of Object.entries(tags)) {
      if (!k.includes(":") || typeof v === "object" || v === undefined) {
        bad = true;
        break;
      }
      clean[k] = v as string | number | boolean;
    }
    if (bad || Object.keys(clean).length === 0) {
      errors.push(`entry ${i}: bad-tags`);
      continue;
    }
    presets.push({ name: o.name.trim(), tags: clean });
  }
  return { presets, errors };
}

export function importPresetPack(data: unknown): {
  imported: number;
  errors: string[];
} {
  const { presets, errors } = validatePresetPack(data);
  for (const p of presets) saveCustomPreset(p.name, p.tags);
  return { imported: presets.length, errors };
}

export function exportPresetPack(presets: CustomPreset[]): string {
  return JSON.stringify(
    presets.map((p) => ({ name: p.name, tags: p.tags })),
    null,
    2,
  );
}
