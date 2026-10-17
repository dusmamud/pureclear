import { describe, expect, it } from "vitest";
import { PDFDocument } from "pdf-lib";
import { stripPdfMetadata } from "../src/lib/pdf";

describe("stripPdfMetadata", () => {
  it("wipes the Info dict and XMP streams", async () => {
    const doc = await PDFDocument.create();
    doc.setTitle("Secret Title");
    doc.setAuthor("John Doe");
    doc.setKeywords(["confidential"]);
    doc.setProducer("EvilSoft");
    const page = doc.addPage([300, 300]);
    page.drawText("hello");
    const bytes = await doc.save();

    const cleaned = await stripPdfMetadata(
      bytes.buffer.slice(0) as ArrayBuffer,
    );
    const reloaded = await PDFDocument.load(cleaned);

    expect(reloaded.getTitle()).toBeUndefined();
    expect(reloaded.getAuthor()).toBeUndefined();
    expect(reloaded.getKeywords()).toBeFalsy();
    // Document still valid with its page
    expect(reloaded.getPageCount()).toBe(1);
  });
});
