import { describe, expect, it } from "vitest";
import { CAMERA_PRESETS, findPreset } from "../src/data/camera-presets";

describe("camera presets", () => {
  it("ships 100+ presets", () => {
    expect(CAMERA_PRESETS.length).toBeGreaterThanOrEqual(100);
  });

  it("has unique ids and valid categories", () => {
    const ids = new Set<string>();
    for (const p of CAMERA_PRESETS) {
      expect(p.id.length).toBeGreaterThan(0);
      expect(ids.has(p.id)).toBe(false);
      ids.add(p.id);
      expect(["phone", "camera", "drone", "action"]).toContain(p.category);
      expect(p.brand.length).toBeGreaterThan(0);
      expect(p.model.length).toBeGreaterThan(0);
    }
  });

  it("every preset carries the same 9 camera tags, all in range", () => {
    const expected = [
      "EXIF:Make",
      "EXIF:Model",
      "EXIF:LensModel",
      "EXIF:Software",
      "EXIF:ISO",
      "EXIF:FNumber",
      "EXIF:FocalLength",
      "EXIF:FocalLengthIn35mmFormat",
      "EXIF:ExposureTime",
    ];
    for (const p of CAMERA_PRESETS) {
      expect(Object.keys(p.tags).sort()).toEqual(expected.sort());
      const iso = p.tags["EXIF:ISO"] as number;
      expect(iso).toBeGreaterThanOrEqual(1);
      expect(iso).toBeLessThanOrEqual(102400);
      const f = p.tags["EXIF:FNumber"] as number;
      expect(f).toBeGreaterThanOrEqual(0.7);
      expect(f).toBeLessThanOrEqual(64);
      const focal = p.tags["EXIF:FocalLength"] as number;
      const focal35 = p.tags["EXIF:FocalLengthIn35mmFormat"] as number;
      expect(focal).toBeGreaterThan(0);
      expect(focal35).toBeGreaterThan(0);
      // Crop factor sanity: 35mm equiv is 0.7x–8x the real focal length
      // (medium format 0.79x, phones ~3.5x, action cams ~1.25x).
      const crop = focal35 / focal;
      expect(crop).toBeGreaterThanOrEqual(0.7);
      expect(crop).toBeLessThanOrEqual(8);
      const exp = p.tags["EXIF:ExposureTime"] as string;
      expect(exp).toMatch(/^1\/\d+$/);
    }
  });

  it("never includes GPS or dates", () => {
    for (const p of CAMERA_PRESETS) {
      for (const key of Object.keys(p.tags)) {
        expect(key.toLowerCase()).not.toContain("gps");
        expect(key.toLowerCase()).not.toContain("date");
      }
    }
  });

  it("findPreset resolves by id", () => {
    const p = findPreset("iphone-15-pro-max");
    expect(p?.brand).toBe("Apple");
    expect(p?.tags["EXIF:Model"]).toBe("iPhone 15 Pro Max");
    expect(findPreset("no-such-preset")).toBeUndefined();
  });
});
