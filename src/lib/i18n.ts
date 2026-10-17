export type Locale = "en" | "hi" | "as";

export const LOCALES: Locale[] = ["en", "hi", "as"];
export const DEFAULT_LOCALE: Locale = "en";

export const LOCALE_META: Record<
  Locale,
  { label: string; nativeLabel: string; dir: "ltr" | "rtl" }
> = {
  en: { label: "English", nativeLabel: "English", dir: "ltr" },
  hi: { label: "Hindi", nativeLabel: "हिन्दी", dir: "ltr" },
  as: { label: "Assamese", nativeLabel: "অসমীয়া", dir: "ltr" },
};

export function isLocale(value: string): value is Locale {
  return (LOCALES as string[]).includes(value);
}

/** Prefix a path with the locale, unless it's the default locale. */
export function localePath(locale: Locale, path: string): string {
  const clean = path.startsWith("/") ? path : `/${path}`;
  return locale === DEFAULT_LOCALE ? clean : `/${locale}${clean}`;
}

/** Extract locale from the current URL pathname. */
export function localeFromPath(pathname: string): Locale {
  const seg = pathname.split("/").filter(Boolean)[0];
  return seg && isLocale(seg) ? seg : DEFAULT_LOCALE;
}

/** Max file size before we warn the user (100 MB). */
export const MAX_FILE_SIZE_WARN = 100 * 1024 * 1024;

export const SUPPORTED_EXTENSIONS = [
  "jpg",
  "jpeg",
  "png",
  "webp",
  "heic",
  "heif",
  "avif",
  "gif",
  "mp4",
  "mov",
  "pdf",
] as const;

export type SupportedExtension = (typeof SUPPORTED_EXTENSIONS)[number];

export function getExtension(filename: string): string {
  return filename.split(".").pop()?.toLowerCase() ?? "";
}

export function isSupported(filename: string): boolean {
  return (SUPPORTED_EXTENSIONS as readonly string[]).includes(
    getExtension(filename),
  );
}
