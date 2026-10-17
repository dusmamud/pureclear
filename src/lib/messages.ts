import en from "../../messages/en.json";
import hi from "../../messages/hi.json";
import as from "../../messages/as.json";
import type { Locale } from "./i18n";

const ALL = { en, hi, as } as const;

export type Messages = typeof en;

/** Raw message map for a locale — passed as props to the React island. */
export function getRawMessages(locale: Locale): Record<string, string> {
  return ALL[locale] as unknown as Record<string, string>;
}
