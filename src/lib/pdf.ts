import { PDFDocument, PDFName } from "pdf-lib";

/**
 * Remove XMP metadata streams from the catalog, every page, and any indirect
 * object with /Type /Metadata — mirrors the reference site's stripXmpObjects.
 */
function stripXmpObjects(pdfDoc: PDFDocument): void {
  const ctx = pdfDoc.context;
  const key = PDFName.of("Metadata");

  const dropRef = (holder: { get?: unknown; delete?: unknown }): void => {
    if (!holder || typeof (holder as any).get !== "function") return;
    const h = holder as any;
    const ref = h.get(key);
    if (!ref) return;
    h.delete(key);
    if (typeof ctx.delete === "function" && ref?.tag) ctx.delete(ref);
  };

  dropRef(pdfDoc.catalog as any);
  try {
    for (const page of pdfDoc.getPages()) dropRef((page as any).node);
  } catch {
    /* pages may be unreadable — continue */
  }
  try {
    for (const [ref, obj] of (ctx as any).enumerateIndirectObjects()) {
      const dict = (obj as any)?.dict;
      if (!dict || typeof dict.get !== "function") continue;
      const type = dict.get(PDFName.of("Type"));
      if (type && String(type) === "/Metadata") (ctx as any).delete(ref);
    }
  } catch {
    /* enumeration failed — continue */
  }
}

/**
 * Strip ALL metadata from a PDF: wipe the Info dict completely and remove every
 * XMP stream. Throws a clean error for encrypted PDFs.
 */
export async function stripPdfMetadata(
  buffer: ArrayBuffer,
): Promise<Uint8Array> {
  let pdfDoc: PDFDocument;
  try {
    pdfDoc = await PDFDocument.load(buffer, { ignoreEncryption: true });
  } catch (err) {
    throw new Error("encrypted", { cause: err });
  }

  // Wipe the entire Info dictionary (fix: getKeywords() returns string[] — we
  // delete keys directly instead of touching typed accessors).
  const infoRef = (pdfDoc.context as any).trailerInfo?.Info;
  if (infoRef) {
    const infoDict = pdfDoc.context.lookup(infoRef) as any;
    if (infoDict?.dict) {
      for (const key of Array.from(infoDict.dict.keys())) {
        infoDict.dict.delete(key);
      }
    }
  }

  stripXmpObjects(pdfDoc);

  return await pdfDoc.save();
}
