import { describe, expect, it } from "vitest";
import {
  buildWriteTags,
  buildPdfEditFields,
  emptyValues,
  parseGpsDisplay,
  tagsToFormValues,
  validateField,
  validateValues,
  type EditorValues,
} from "../src/lib/metadata-editor";

describe("parseGpsDisplay", () => {
  it("converts DMS to decimal degrees", () => {
    expect(parseGpsDisplay("28 deg 36' 0.00\" N")).toBe("28.6");
    expect(parseGpsDisplay("77 deg 12' 30.00\" W")).toBe("-77.208333");
    expect(parseGpsDisplay("19.076")).toBe("19.076");
    expect(parseGpsDisplay("19 deg 4' 33.60\"", "South")).toBe("-19.076");
    expect(parseGpsDisplay("19 deg 4' 33.60\"", "North")).toBe("19.076");
  });
});

describe("tagsToFormValues", () => {
  it("pre-fills fields from EXIF/XMP/IPTC/GPS tags", () => {
    const v = tagsToFormValues([
      { group: "EXIF", name: "Make", value: "Canon" },
      { group: "EXIF", name: "Camera Model Name", value: "EOS R5" },
      { group: "EXIF", name: "ISO", value: "400" },
      { group: "EXIF", name: "Focal Length", value: "24.0 mm" },
      {
        group: "EXIF",
        name: "Date/Time Original",
        value: "2026:10:18 12:00:00",
      },
      { group: "EXIF", name: "Artist", value: "Jane Doe" },
      { group: "XMP", name: "Title", value: "Sunset" },
      { group: "IPTC", name: "Keywords", value: "beach, sunset" },
      {
        group: "Composite",
        name: "GPS Latitude",
        value: "28 deg 36' 0.00\" N",
      },
      {
        group: "Composite",
        name: "GPS Longitude",
        value: "77 deg 12' 0.00\" E",
      },
    ]);
    expect(v.make).toBe("Canon");
    expect(v.model).toBe("EOS R5");
    expect(v.iso).toBe("400");
    expect(v.focalLength).toBe("24.0");
    expect(v.dateTimeOriginal).toBe("2026:10:18 12:00:00");
    expect(v.author).toBe("Jane Doe");
    expect(v.title).toBe("Sunset");
    expect(v.keywords).toBe("beach, sunset");
    expect(v.latitude).toBe("28.6");
    expect(v.longitude).toBe("77.2");
  });
});

describe("validateField", () => {
  it("accepts valid values, rejects bad ones", () => {
    expect(validateField("latitude", "19.076")).toBeNull();
    expect(validateField("latitude", "91")).toBe("editor.errLat");
    expect(validateField("longitude", "-181")).toBe("editor.errLon");
    expect(validateField("iso", "0")).toBe("editor.errIso");
    expect(validateField("iso", "100")).toBeNull();
    expect(validateField("iso", "12.5")).toBe("editor.errIso");
    expect(validateField("fNumber", "2.8")).toBeNull();
    expect(validateField("fNumber", "0.5")).toBe("editor.errFNumber");
    expect(validateField("exposureTime", "1/125")).toBeNull();
    expect(validateField("exposureTime", "1/0")).toBe("editor.errExposure");
    expect(validateField("exposureTime", "0.008")).toBeNull();
    expect(validateField("dateTimeOriginal", "2026:10:18 12:00:00")).toBeNull();
    expect(validateField("dateTimeOriginal", "2026-10-18")).toBe(
      "editor.errDate",
    );
    expect(validateField("dateTimeOriginal", "2026:13:40 25:00:00")).toBe(
      "editor.errDate",
    );
    expect(validateField("title", "")).toBeNull();
  });

  it("requires lat/lon together, altitude needs both", () => {
    const base = emptyValues();
    const onlyLat = { ...base, latitude: "19" };
    expect(validateValues(onlyLat).gpsError).toBe("editor.errGpsPair");
    const both = { ...base, latitude: "19", longitude: "72" };
    expect(validateValues(both).gpsError).toBeNull();
    const altOnly = { ...base, altitude: "10" };
    expect(validateValues(altOnly).gpsError).toBe("editor.errGpsAlt");
  });
});

describe("buildWriteTags", () => {
  const initial = emptyValues();

  it("writes changed fields, skips unchanged ones", () => {
    const values: EditorValues = {
      ...emptyValues(),
      make: "Canon",
      iso: "400",
      latitude: "19.076",
      longitude: "72.8777",
    };
    const { tags, changed } = buildWriteTags(values, initial);
    expect(tags["EXIF:Make"]).toBe("Canon");
    expect(tags["EXIF:ISO"]).toBe(400);
    expect(tags["EXIF:GPSLatitude"]).toBe(19.076);
    expect(tags["EXIF:GPSLatitudeRef"]).toBe("N");
    expect(tags["EXIF:GPSLongitude"]).toBe(72.8777);
    expect(tags["EXIF:GPSLongitudeRef"]).toBe("E");
    expect(changed).toContain("make");
    expect(changed).toContain("iso");
    expect(changed).toContain("latitude");
    expect(changed).toContain("longitude");
    expect(Object.keys(tags)).not.toContain("EXIF:Model");
  });

  it("emits empty string to delete a cleared field, with GPS refs", () => {
    const before: EditorValues = {
      ...emptyValues(),
      make: "Canon",
      latitude: "19.076",
      longitude: "72.8777",
      altitude: "10",
    };
    const after = emptyValues();
    const { tags, changed } = buildWriteTags(after, before);
    expect(tags["EXIF:Make"]).toBe("");
    expect(tags["EXIF:GPSLatitude"]).toBe("");
    expect(tags["EXIF:GPSLatitudeRef"]).toBe("");
    expect(tags["EXIF:GPSLongitude"]).toBe("");
    expect(tags["EXIF:GPSAltitude"]).toBe("");
    expect(changed).toContain("make");
    expect(changed).toContain("latitude");
  });

  it("splits keywords into an array, writes to IPTC + XMP", () => {
    const values: EditorValues = {
      ...emptyValues(),
      keywords: "beach, sunset",
    };
    const { tags } = buildWriteTags(values, initial);
    expect(tags["IPTC:Keywords"]).toEqual(["beach", "sunset"]);
    expect(tags["XMP:Subject"]).toEqual(["beach", "sunset"]);
  });

  it("maps PDF fields, skipping unchanged ones", () => {
    const values: EditorValues = { ...emptyValues(), title: "Report" };
    const fields = buildPdfEditFields(values, initial);
    expect(fields.title).toBe("Report");
    expect(fields.author).toBeUndefined();
    const cleared = buildPdfEditFields(emptyValues(), {
      ...emptyValues(),
      title: "Report",
    });
    expect(cleared.title).toBeNull();
  });
});

describe("tagsToFormValues with exifr preview naming", () => {
  it("pre-fills from short names, comma GPS and ISO dates", () => {
    const v = tagsToFormValues([
      { group: "EXIF", name: "Make", value: "TestCam" },
      { group: "EXIF", name: "Model", value: "ICC-Test" },
      { group: "EXIF", name: "ISO", value: "100" },
      {
        group: "EXIF",
        name: "DateTimeOriginal",
        value: "2026-10-18T12:00:00.000Z",
      },
      { group: "GPS", name: "GPSLatitude", value: "28,36,0" },
      { group: "GPS", name: "GPSLatitudeRef", value: "N" },
      { group: "GPS", name: "GPSLongitude", value: "77,12,0" },
      { group: "GPS", name: "GPSLongitudeRef", value: "E" },
    ]);
    expect(v.make).toBe("TestCam");
    expect(v.model).toBe("ICC-Test");
    expect(v.iso).toBe("100");
    expect(v.dateTimeOriginal).toBe("2026:10:18 12:00:00");
    expect(v.latitude).toBe("28.6");
    expect(v.longitude).toBe("77.2");
  });
});
