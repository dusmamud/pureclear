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

export interface PdfEditFields {
  /** Set a value, null deletes the key, undefined skips it. */
  title?: string | null;
  author?: string | null;
  creator?: string | null;
  subject?: string | null;
  keywords?: string[] | null;
  /** "YYYY:MM:DD HH:MM:SS" */
  createDate?: string | null;
  modifyDate?: string | null;
}

/** Parse "YYYY:MM:DD HH:MM:SS" into a Date (local time). */
function parsePdfDate(value: string): Date | null {
  const m = /^(\d{4}):(\d{2}):(\d{2}) (\d{2}):(\d{2}):(\d{2})$/.exec(
    value.trim(),
  );
  if (!m) return null;
  const [, y, mo, d, h, mi, s] = m.map(Number);
  const dt = new Date(y, mo - 1, d, h, mi, s);
  return Number.isNaN(dt.getTime()) ? null : dt;
}

/** Delete one key from the Info dict (used when a field is cleared). */
function deleteInfoKey(pdfDoc: PDFDocument, keyName: string): void {
  const infoRef = (pdfDoc.context as any).trailerInfo?.Info;
  if (!infoRef) return;
  const infoDict = pdfDoc.context.lookup(infoRef) as any;
  infoDict?.dict?.delete?.(PDFName.of(keyName));
}

/**
 * Edit a PDF's Info-dict metadata (Title/Author/Creator/Subject/Keywords/
 * Dates). Only the fields present in `fields` change; everything else —
 * pages, content, XMP — is untouched. Throws "encrypted" for locked PDFs.
 */
export async function editPdfMetadata(
  buffer: ArrayBuffer,
  fields: PdfEditFields,
): Promise<Uint8Array> {
  let pdfDoc: PDFDocument;
  try {
    pdfDoc = await PDFDocument.load(buffer, { ignoreEncryption: true });
  } catch (err) {
    throw new Error("encrypted", { cause: err });
  }

  const applyText = (
    keyName: string,
    value: string | null | undefined,
    setter: (v: string) => void,
  ) => {
    if (value === undefined) return;
    if (value === null) deleteInfoKey(pdfDoc, keyName);
    else setter(value);
  };
  applyText("Title", fields.title, (v) => pdfDoc.setTitle(v));
  applyText("Author", fields.author, (v) => pdfDoc.setAuthor(v));
  applyText("Creator", fields.creator, (v) => pdfDoc.setCreator(v));
  applyText("Subject", fields.subject, (v) => pdfDoc.setSubject(v));
  if (fields.keywords !== undefined) {
    if (fields.keywords === null) deleteInfoKey(pdfDoc, "Keywords");
    else pdfDoc.setKeywords(fields.keywords);
  }
  const applyDate = (
    keyName: string,
    value: string | null | undefined,
    setter: (d: Date) => void,
  ) => {
    if (value === undefined) return;
    if (value === null) {
      deleteInfoKey(pdfDoc, keyName);
      return;
    }
    const dt = parsePdfDate(value);
    if (dt) setter(dt);
  };
  applyDate("CreationDate", fields.createDate, (d) =>
    pdfDoc.setCreationDate(d),
  );
  applyDate("ModDate", fields.modifyDate, (d) => pdfDoc.setModificationDate(d));

  return await pdfDoc.save();
}
