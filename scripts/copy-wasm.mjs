/**
 * Copy the ExifTool WASM binary (zeroperl.wasm, ~25MB) from node_modules
 * into public/wasm/ so it is self-hosted — no third-party CDN involved.
 *
 * Runs automatically before `npm run build` (npm prebuild hook) and can be
 * run manually for `npm run dev`. Idempotent: skips the copy when the
 * destination already matches the installed package version.
 *
 * Windows-compatible (pure node:fs, no shell commands).
 */
import { copyFileSync, mkdirSync, existsSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(fileURLToPath(import.meta.url));
// scripts/ -> project root -> node_modules/@6over3/zeroperl-ts/dist/esm/zeroperl.wasm
const src = join(
  root,
  "..",
  "node_modules",
  "@6over3",
  "zeroperl-ts",
  "dist",
  "esm",
  "zeroperl.wasm",
);
const destDir = join(root, "..", "public", "wasm");
const dest = join(destDir, "zeroperl.wasm");

mkdirSync(destDir, { recursive: true });
const srcSize = statSync(src).size;
if (!existsSync(dest) || statSync(dest).size !== srcSize) {
  copyFileSync(src, dest);
  console.log(
    `copied zeroperl.wasm (${(srcSize / 1024 / 1024).toFixed(1)} MB) -> public/wasm/`,
  );
} else {
  console.log("public/wasm/zeroperl.wasm already up to date");
}
