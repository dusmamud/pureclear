import * as Comlink from "comlink";
import type { ExifToolWorkerApi, Tag } from "../workers/exiftool.worker";

export type { Tag };

let worker: Worker | null = null;
let api: Comlink.Remote<ExifToolWorkerApi> | null = null;
let apiPromise: Promise<Comlink.Remote<ExifToolWorkerApi>> | null = null;

function createApi(): Comlink.Remote<ExifToolWorkerApi> {
  worker = new Worker(
    new URL("../workers/exiftool.worker.ts", import.meta.url),
    {
      type: "module",
    },
  );
  return Comlink.wrap<ExifToolWorkerApi>(worker);
}

/** Lazy singleton — the WASM engine loads only on first use. */
function getApi(): Promise<Comlink.Remote<ExifToolWorkerApi>> {
  if (!apiPromise) {
    apiPromise = (async () => {
      api = createApi();
      return api;
    })();
  }
  return apiPromise;
}

function recreateApi(): Comlink.Remote<ExifToolWorkerApi> {
  try {
    worker?.terminate();
  } catch {
    /* noop */
  }
  worker = null;
  api = createApi();
  apiPromise = Promise.resolve(api);
  return api;
}

/**
 * Run a worker call with one crash-recovery retry.
 * If the WASM engine crashes, the worker is recreated and the call retried once.
 */
async function withRecovery<T>(
  fn: (a: Comlink.Remote<ExifToolWorkerApi>) => Promise<T>,
): Promise<T> {
  try {
    return await fn(await getApi());
  } catch (err) {
    // Recreate the worker and retry once before surfacing the error.
    try {
      return await fn(recreateApi());
    } catch {
      throw err;
    }
  }
}

export function readTags(
  buffer: ArrayBuffer,
  filename: string,
): Promise<Tag[]> {
  return withRecovery((a) => a.read(buffer, filename));
}

export function stripFile(
  buffer: ArrayBuffer,
  filename: string,
  knownCount?: number,
): Promise<{ data: ArrayBuffer; removedCount: number; remaining: Tag[] }> {
  return withRecovery((a) => a.strip(buffer, filename, knownCount));
}

/**
 * Start loading + booting the WASM engine ahead of first use (file
 * drag-over / dropzone hover). Fire-and-forget: a failed warmup is
 * harmless because the first real call retries through withRecovery.
 */
export function warmupEngine(): void {
  void (async () => {
    try {
      const a = await getApi();
      await a.warmup();
    } catch {
      /* warmup is best-effort */
    }
  })();
}

/** Free the worker (e.g. on page hide). Next use recreates it lazily. */
export function disposeEngine(): void {
  try {
    worker?.terminate();
  } catch {
    /* noop */
  }
  worker = null;
  api = null;
  apiPromise = null;
}
