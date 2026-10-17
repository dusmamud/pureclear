import { describe, expect, it } from "vitest";
import { parseExifToolText } from "../src/workers/exiftool.worker";

describe("parseExifToolText", () => {
  it("parses grouped tags and skips hidden groups", () => {
    const text = [
      "[EXIF] ImageWidth : 4000",
      "[EXIF] GPSLatitude : 19.07",
      "[File] FileName : test.jpg",
      "[Composite] ImageSize : 4000x3000",
      "[System] Foo : bar",
      "not a tag line",
      "[EXIF] Empty : ",
      "[EXIF] Binary : (Binary data 123 bytes)",
    ].join("\n");
    const tags = parseExifToolText(text);
    expect(tags).toHaveLength(2);
    expect(tags[0]).toEqual({
      group: "EXIF",
      name: "ImageWidth",
      value: "4000",
    });
    expect(tags[1].name).toBe("GPSLatitude");
  });

  it("handles values containing colons", () => {
    const tags = parseExifToolText(
      "[EXIF] DateTimeOriginal : 2026:10:18 12:00:00",
    );
    expect(tags[0].value).toBe("2026:10:18 12:00:00");
  });
});
