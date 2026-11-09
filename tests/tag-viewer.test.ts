import { describe, expect, it } from "vitest";
import {
  compareTags,
  filterTags,
  groupTags,
  tagsToCsv,
  tagsToJson,
} from "../src/lib/tag-viewer";
import type { Tag } from "../src/lib/engine";

const T = (group: string, name: string, value: string): Tag => ({
  group,
  name,
  value,
});

describe("groupTags", () => {
  it("orders EXIF before GPS before XMP, unknown groups last alphabetically", () => {
    const tags = [
      T("XMP", "Title", "Sunset"),
      T("GPS", "GPS Latitude", "28 deg"),
      T("Zebra", "Zed", "1"),
      T("EXIF", "Make", "Canon"),
      T("Apple", "Foo", "2"),
    ];
    expect(groupTags(tags).map((g) => g.group)).toEqual([
      "EXIF",
      "GPS",
      "XMP",
      "Apple",
      "Zebra",
    ]);
  });

  it("keeps first-seen order inside a group", () => {
    const tags = [T("EXIF", "B", "1"), T("EXIF", "A", "2")];
    expect(groupTags(tags)[0].tags.map((t) => t.name)).toEqual(["B", "A"]);
  });
});

describe("filterTags", () => {
  const tags = [
    T("EXIF", "Make", "Canon"),
    T("GPS", "GPS Latitude", "28 deg"),
    T("EXIF", "ISO", "100"),
  ];

  it("matches name, value, and group case-insensitively", () => {
    expect(filterTags(tags, "canon").map((t) => t.name)).toEqual(["Make"]);
    expect(filterTags(tags, "GPS").map((t) => t.name)).toEqual([
      "GPS Latitude",
    ]);
    expect(filterTags(tags, "100").map((t) => t.name)).toEqual(["ISO"]);
  });

  it("returns everything on an empty query", () => {
    expect(filterTags(tags, "  ")).toBe(tags);
  });
});

describe("tagsToJson / tagsToCsv", () => {
  const tags = [
    T("EXIF", "Make", "Canon"),
    T("EXIF", "Description", 'Say "hi", now'),
  ];

  it("round-trips through JSON", () => {
    const parsed = JSON.parse(tagsToJson(tags));
    expect(parsed).toEqual([
      { group: "EXIF", name: "Make", value: "Canon" },
      { group: "EXIF", name: "Description", value: 'Say "hi", now' },
    ]);
  });

  it("quotes CSV cells with commas or quotes", () => {
    expect(tagsToCsv(tags)).toBe(
      'group,name,value\nEXIF,Make,Canon\nEXIF,Description,"Say ""hi"", now"\n',
    );
  });
});

describe("compareTags", () => {
  const a = [
    T("EXIF", "Make", "Canon"),
    T("EXIF", "ISO", "100"),
    T("GPS", "GPS Latitude", "28 deg"),
  ];
  const b = [
    T("EXIF", "Make", "Nikon"),
    T("EXIF", "ISO", "100"),
    T("EXIF", "Model", "Z 6II"),
  ];

  it("marks same, different, and one-sided rows", () => {
    const rows = compareTags(a, b);
    const byName = new Map(rows.map((r) => [r.name, r.status]));
    expect(byName.get("Make")).toBe("different");
    expect(byName.get("ISO")).toBe("same");
    expect(byName.get("Model")).toBe("onlyB");
    expect(byName.get("GPS Latitude")).toBe("onlyA");
  });

  it("sorts differences before same values inside a group", () => {
    const rows = compareTags(a, b).filter((r) => r.group === "EXIF");
    expect(rows.map((r) => r.name)).toEqual(["Make", "Model", "ISO"]);
  });
});
