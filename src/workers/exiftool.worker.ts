import * as Comlink from "comlink";
import { parseMetadata, writeMetadata } from "@uswriting/exiftool";

// zeroperl's browser detection is `typeof window !== "u" && typeof document !== "u"`.
// Web Workers have neither, so without this shim it falls into the Node.js branch
// and tries `import("node:fs/promises")` — which throws in a browser worker.
// Shimming both (before first parseMetadata call) routes it to the fetch() path,
// where our custom `wasmFetch` below takes over. The check runs lazily inside
// ZeroPerl.create(), not at import time, so module-body assignment is sufficient.
(globalThis as any).window ??= globalThis;
(globalThis as any).document ??= {};

export interface Tag {
  group: string;
  name: string;
  value: string;
}

/** Groups that are file-system noise, not privacy-relevant metadata. */
const HIDDEN_GROUPS = new Set(["Composite", "ExifTool", "System", "File"]);

/**
 * ICC color profiles are deliberately KEPT by the strip args (see
 * STRIP_ARGS) so colors stay accurate — a profile is color math, not
 * personal data. Counting its ~20 sub-tags as "remaining metadata"
 * would falsely report a successful strip as failed, so the group is
 * filtered from tag lists and surfaced separately via hasIccProfile().
 */
const ICC_GROUP = "ICC_Profile";

/** Strip args: delete everything except the ICC color profile, plus any
 *  C2PA/JUMBF provenance manifest (creator names + edit history). */
export const STRIP_ARGS = ["-all=", "--icc_profile:all", "-jumbf:all="];
// NOTE: -jumbf:all must NOT be added to reads — empirically it makes
// ExifTool return empty output for files without JUMBF data. The delete
// side (-jumbf:all=) works fine in strip args.
const READ_ARGS = ["-G"];

/**
 * Self-hosted WASM URL. The zeroperl loader fetches "./zeroperl.wasm"
 * relative to the worker script by default (which 404s after bundling),
 * but @uswriting/exiftool accepts a custom `fetch` — so we point it at
 * our own /wasm/zeroperl.wasm (copied from node_modules at build time,
 * served with application/wasm via public/_headers). Zero third-party CDN.
 */
const WASM_URL = "/wasm/zeroperl.wasm";
const wasmFetch = () => fetch(WASM_URL);

/** Parse `exiftool -G` text output into tag objects. */
export function parseExifToolText(text: string): Tag[] {
  const tags: Tag[] = [];
  for (const line of text.split("\n")) {
    const groupMatch = line.match(/^\[([^\]]+)\]\s+/);
    if (!groupMatch) continue;
    const group = groupMatch[1];
    if (HIDDEN_GROUPS.has(group) || group === ICC_GROUP) continue;
    const rest = line.slice(groupMatch[0].length);
    const colon = rest.indexOf(":");
    if (colon === -1) continue;
    const name = rest.slice(0, colon).trim();
    const value = rest.slice(colon + 1).trim();
    if (!name || !value) continue;
    if (value.startsWith("(Binary data")) continue;
    tags.push({ group, name, value });
  }
  return tags;
}

/** True when the file carries an ICC color profile (kept on purpose). */
export function hasIccProfile(text: string): boolean {
  return text.split("\n").some((line) => line.startsWith(`[${ICC_GROUP}]`));
}

const api = {
  /**
   * Boot the WASM engine (download + Perl init) without reading a real
   * file, so the first real read doesn't pay the cold-start cost.
   * Mirrors the reference implementation's `-ver` warmup call.
   */
  async warmup(): Promise<void> {
    try {
      await parseMetadata(
        { name: "warmup.txt", data: new Uint8Array(0) },
        { args: ["-ver"], fetch: wasmFetch },
      );
    } catch {
      /* warmup is best-effort */
    }
  },

  /** Read metadata tags from a file. Returns display-ready tags plus
   *  whether the file carries an ICC color profile (kept on purpose). */
  async read(
    buffer: ArrayBuffer,
    filename: string,
  ): Promise<{ tags: Tag[]; hasIcc: boolean }> {
    const result = await parseMetadata(
      { name: filename, data: new Uint8Array(buffer) },
      { args: READ_ARGS, fetch: wasmFetch },
    );
    if (!result.success) {
      throw new Error(result.error || "Failed to read metadata");
    }
    if (!result.data) throw new Error("Failed to read metadata");
    return {
      tags: parseExifToolText(result.data),
      hasIcc: hasIccProfile(result.data),
    };
  },

  /**
   * Strip all metadata losslessly, then verify by re-reading.
   * Returns the cleaned bytes plus before/after tag counts.
   * When `knownCount` is provided (the caller already holds an
   * authoritative read of this exact file), the internal before-read
   * is skipped — saving one full ExifTool pass per strip.
   */
  async strip(
    buffer: ArrayBuffer,
    filename: string,
    knownCount?: number,
  ): Promise<{ data: ArrayBuffer; removedCount: number; remaining: Tag[] }> {
    const file = { name: filename, data: new Uint8Array(buffer) };

    let beforeCount = knownCount;
    if (beforeCount === undefined) {
      const before = await parseMetadata(file, {
        args: READ_ARGS,
        fetch: wasmFetch,
      });
      beforeCount =
        before.success && before.data
          ? parseExifToolText(before.data).length
          : 0;
    }

    const stripped = await writeMetadata(
      file,
      {},
      { args: STRIP_ARGS, fetch: wasmFetch },
    );
    if (!stripped.success) {
      throw new Error(stripped.error || "Failed to strip metadata");
    }
    if (!stripped.data) throw new Error("Failed to strip metadata");
    // writeMetadata returns the cleaned file bytes.
    const cleanedBuffer: ArrayBuffer = stripped.data as ArrayBuffer;

    // Verify: re-read the cleaned file. Trust, but verify.
    let remaining: Tag[] = [];
    try {
      const check = await parseMetadata(
        { name: filename, data: new Uint8Array(cleanedBuffer) },
        { args: READ_ARGS, fetch: wasmFetch },
      );
      if (check.success && check.data)
        remaining = parseExifToolText(check.data);
    } catch {
      // Verification is best-effort; the cleaned file is still returned.
    }

    return {
      data: cleanedBuffer,
      removedCount: Math.max(0, beforeCount - remaining.length),
      remaining,
    };
  },
};

// Only expose via Comlink when actually running inside a worker.
// (Importing this module in Node — e.g. unit tests — must not throw.)
if (
  typeof self !== "undefined" &&
  typeof (self as any).postMessage === "function"
) {
  try {
    Comlink.expose(api);
  } catch {
    /* non-worker environment */
  }
}
export type ExifToolWorkerApi = typeof api;
