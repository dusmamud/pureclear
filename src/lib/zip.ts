import { zipSync } from "fflate";

export interface ZipEntry {
  name: string;
  data: Uint8Array;
}

/** Zip already-cleaned files at level 0 (they're already compressed — instant). */
export function zipFiles(entries: ZipEntry[]): Uint8Array<ArrayBuffer> {
  const obj: Record<string, Uint8Array> = {};
  for (const e of entries) obj[e.name] = e.data;
  return zipSync(obj, { level: 0 }) as Uint8Array<ArrayBuffer>;
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}
