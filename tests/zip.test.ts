import { describe, expect, it } from "vitest";
import { unzipSync } from "fflate";
import { zipFiles } from "../src/lib/zip";

describe("zipFiles", () => {
  it("zips entries at level 0 and round-trips", () => {
    const a = new Uint8Array([1, 2, 3]);
    const b = new Uint8Array([4, 5]);
    const zipped = zipFiles([
      { name: "a.bin", data: a },
      { name: "b.bin", data: b },
    ]);
    const out = unzipSync(zipped);
    expect(Object.keys(out).sort()).toEqual(["a.bin", "b.bin"]);
    expect(Array.from(out["a.bin"])).toEqual([1, 2, 3]);
  });
});
