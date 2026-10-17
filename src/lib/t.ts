import * as m from "../paraglide/messages.js";
import type { Locale } from "./i18n";

/**
 * Parallel-safe SSG translation access.
 * Usage: const tr = t('hi'); tr('hero.title'); tr('tool.tagsFound', { count: 3 });
 */
export function t(locale: Locale) {
  return (key: string, inputs?: Record<string, string | number>): string => {
    const fn = (m as unknown as Record<string, CallableFunction>)[key];
    if (typeof fn !== "function") {
      console.warn(`[i18n] missing message: ${key}`);
      return key;
    }
    return String(fn(inputs ?? {}, { locale }));
  };
}

export type Translate = ReturnType<typeof t>;
