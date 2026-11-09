import { describe, expect, it } from "vitest";
import {
  exportPresetPack,
  importPresetPack,
  loadCustomPresets,
  saveCustomPreset,
  validatePresetPack,
} from "../src/lib/custom-presets";

describe("custom presets", () => {
  it("saves and loads a preset", () => {
    const before = loadCustomPresets().length;
    const p = saveCustomPreset("My Canon", {
      "EXIF:Make": "Canon",
      "EXIF:ISO": 400,
    });
    expect(p.name).toBe("My Canon");
    const all = loadCustomPresets();
    expect(all.length).toBe(before + 1);
    expect(all[all.length - 1].tags["EXIF:ISO"]).toBe(400);
  });

  it("round-trips through export/import", () => {
    saveCustomPreset("Pack One", { "EXIF:Make": "Sony" });
    const pack = exportPresetPack(loadCustomPresets());
    const parsed: unknown = JSON.parse(pack);
    expect(Array.isArray(parsed)).toBe(true);
    const { imported, errors } = importPresetPack(parsed);
    expect(errors).toEqual([]);
    expect(imported).toBeGreaterThanOrEqual(1);
  });

  it("rejects bad pack entries and keeps the good ones", () => {
    const { presets, errors } = validatePresetPack([
      { name: "Good", tags: { "EXIF:Make": "Nikon" } },
      { name: "", tags: { "EXIF:Make": "X" } },
      { name: "NoTags" },
      { name: "BadTag", tags: { Make: "X" } },
      "not-an-object",
    ]);
    expect(presets).toEqual([{ name: "Good", tags: { "EXIF:Make": "Nikon" } }]);
    expect(errors.length).toBe(4);
    expect(validatePresetPack({ nope: true }).errors).toEqual(["not-an-array"]);
  });
});
