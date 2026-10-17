# PureClear

100% in-browser EXIF/metadata remover. Lossless — no re-encode, no uploads, everything
happens on your device.

## Stack

Astro 7 (static) + React 19 island + Tailwind v4 + TypeScript. Stripping engine:
ExifTool WASM (`@uswriting/exiftool`) in a Comlink Web Worker; PDF via `pdf-lib`.

## Setup (Windows 11)

1. Install Node.js 20+ LTS from nodejs.org
2. Install VS Code extensions: **Astro**, **Prettier**, **Tailwind CSS IntelliSense**
3. `npm install`
4. `npm run dev` → http://localhost:4321

## Scripts

| Command             | What it does                              |
| ------------------- | ----------------------------------------- |
| `npm run dev`       | Start dev server                          |
| `npm run build`     | Compile Paraglide messages + build static |
| `npm run preview`   | Preview the production build              |
| `npm run typecheck` | `astro check` (types)                     |
| `npm test`          | Vitest unit tests                         |
| `npm run format`    | Prettier write                            |

## i18n

Translations live in `messages/{locale}.json` (Paraglide inlang format).
v1 locales: `en` (default, no URL prefix), `hi`, `as`.
Add a locale: add the code to `astro.config.mjs` `i18n.locales`, add `messages/{code}.json`,
mirror the pages under `src/pages/{code}/`.

Use Tailwind **logical properties** (`ms-`, `me-`, `ps-`, `pe-`, `start-`, `end-`,
`text-start`) everywhere — never `ml/mr/pl/pr/left/right` — so future RTL locales
(Arabic, Urdu) work with zero rewrites.

## License

MIT
