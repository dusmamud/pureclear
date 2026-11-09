import { describe, expect, it } from "vitest";
import { deleteKeysFor, tagDeleteKey } from "../src/lib/tag-delete";
import type { Tag } from "../src/lib/engine";

const T = (group: string, name: string, value = "x"): Tag => ({
  group,
  name,
  value,
});

describe("tagDeleteKey", () => {
  it("strips non-alphanumerics to get the canonical name", () => {
    expect(tagDeleteKey(T("EXIF", "F Number"))).toBe("EXIF:FNumber");
    expect(tagDeleteKey(T("EXIF", "Focal Length In 35mm Format"))).toBe(
      "EXIF:FocalLengthIn35mmFormat",
    );
    expect(tagDeleteKey(T("EXIF", "Date/Time Original"))).toBe(
      "EXIF:DateTimeOriginal",
    );
    expect(tagDeleteKey(T("EXIF", "Y Cb Cr Positioning"))).toBe(
      "EXIF:YCbCrPositioning",
    );
    expect(tagDeleteKey(T("JFIF", "JFIF Version"))).toBe("JFIF:JFIFVersion");
    expect(tagDeleteKey(T("XMP", "Title"))).toBe("XMP:Title");
    expect(tagDeleteKey(T("IPTC", "Keywords"))).toBe("IPTC:Keywords");
  });

  it("maps Camera Model Name to Model", () => {
    expect(tagDeleteKey(T("EXIF", "Camera Model Name"))).toBe("EXIF:Model");
  });

  it("deletes GPS tags from EXIF regardless of display group", () => {
    expect(tagDeleteKey(T("EXIF", "GPS Latitude Ref"))).toBe(
      "EXIF:GPSLatitudeRef",
    );
    expect(tagDeleteKey(T("Composite", "GPS Latitude"))).toBe(
      "EXIF:GPSLatitude",
    );
    expect(tagDeleteKey(T("Composite", "GPS Longitude"))).toBe(
      "EXIF:GPSLongitude",
    );
  });

  it("refuses MakerNotes, File, System and ExifTool groups", () => {
    expect(tagDeleteKey(T("MakerNotes", "MakerNote"))).toBeNull();
    expect(tagDeleteKey(T("File", "File Name"))).toBeNull();
    expect(tagDeleteKey(T("System", "File Size"))).toBeNull();
    expect(tagDeleteKey(T("ExifTool", "ExifTool Version"))).toBeNull();
  });

  it("deleteKeysFor drops unremovable tags", () => {
    expect(
      deleteKeysFor([
        T("EXIF", "Make"),
        T("MakerNotes", "MakerNote"),
        T("GPS", "GPS Latitude"),
      ]),
    ).toEqual(["EXIF:Make", "EXIF:GPSLatitude"]);
  });
});
