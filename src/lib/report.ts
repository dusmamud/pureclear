/**
 * Privacy-first issue reporting.
 *
 * WHAT WE COLLECT — and nothing else:
 * {
 *   "type": "report" | "feedback",
 *   "reason": "tool.error" | "tool.unsupported" | "tool.encryptedPdf", // report only
 *   "fileExt": "heic",          // report only — extension only, NEVER the file name
 *   "sizeBucket": "1-10MB",     // report only — bucket, never the exact byte size
 *   "browser": "Chrome",        // family only, no version
 *   "os": "Windows",            // family only
 *   "appVersion": "1.0.0",
 *   "category": "bug",          // feedback only
 *   "message": "user-typed text or empty",
 *   "page": "/formats/heic",   // locale-agnostic path
 *   "timestamp": "2026-10-19T00:00:00.000Z"
 * }
 *
 * WHAT WE NEVER COLLECT: file names, file contents, user names, emails,
 * IP addresses (not stored in the payload), or any identifier.
 *
 * To receive reports, deploy the companion Worker (see the pureclear-reports
 * repo) and set REPORT_API_BASE below to its URL, e.g.
 * "https://pureclear-reports.<your-subdomain>.workers.dev".
 * Until set, the forms show a "not available yet" note instead of submitting.
 */

export const REPORT_API_BASE = "https://pureclear-reports.beingdusmamud.workers.dev";

export const APP_VERSION = "1.0.0";

export interface ReportPayload {
  type: "report";
  reason: string;
  fileExt: string;
  sizeBucket: string;
  browser: string;
  os: string;
  appVersion: string;
  message: string;
  page: string;
  timestamp: string;
}

export interface FeedbackPayload {
  type: "feedback";
  category: string;
  browser: string;
  os: string;
  appVersion: string;
  message: string;
  page: string;
  timestamp: string;
}

/** Bucket a byte size — never send the exact size. */
export function sizeBucket(bytes: number): string {
  const mb = bytes / (1024 * 1024);
  if (mb < 1) return "<1MB";
  if (mb < 10) return "1-10MB";
  if (mb < 100) return "10-100MB";
  return ">100MB";
}

/** Browser family only — no version strings. */
export function browserFamily(): string {
  const ua = navigator.userAgent;
  if (/\bEdg\b/.test(ua)) return "Edge";
  if (/\bOPR\b|\bOpera\b/.test(ua)) return "Opera";
  if (/\bFirefox\b/.test(ua)) return "Firefox";
  if (/\bSamsungBrowser\b/.test(ua)) return "Samsung Internet";
  if (/\bChrome\b/.test(ua)) return "Chrome";
  if (/\bSafari\b/.test(ua)) return "Safari";
  return "Other";
}

/** OS family only. */
export function osFamily(): string {
  const ua = navigator.userAgent;
  const platform = (
    navigator as unknown as { userAgentData?: { platform?: string } }
  ).userAgentData?.platform;
  const src = `${platform ?? ""} ${ua}`;
  if (/iPhone|iPad|iPod/.test(src)) return "iOS";
  if (/Android/.test(src)) return "Android";
  if (/Mac/.test(src)) return "macOS";
  if (/Win/.test(src)) return "Windows";
  if (/Linux/.test(src)) return "Linux";
  return "Other";
}

/** Locale-agnostic page path: strips a leading /hi or /as segment. */
export function pagePath(): string {
  const p = location.pathname;
  return p.replace(/^\/(hi|as)(?=\/|$)/, "") || "/";
}

function basePayload() {
  return {
    browser: browserFamily(),
    os: osFamily(),
    appVersion: APP_VERSION,
    page: pagePath(),
    timestamp: new Date().toISOString(),
  };
}

export function buildReportPayload(input: {
  reason: string;
  fileExt: string;
  sizeBytes: number;
  message: string;
}): ReportPayload {
  return {
    type: "report",
    reason: input.reason,
    // Extension only — the file name itself is NEVER included.
    fileExt: input.fileExt.toLowerCase().slice(0, 10),
    sizeBucket: sizeBucket(input.sizeBytes),
    message: input.message.slice(0, 2000),
    ...basePayload(),
  };
}

export function buildFeedbackPayload(input: {
  category: string;
  message: string;
}): FeedbackPayload {
  return {
    type: "feedback",
    category: input.category,
    message: input.message.slice(0, 2000),
    ...basePayload(),
  };
}

export async function submitPayload(
  path: "/report" | "/feedback",
  payload: ReportPayload | FeedbackPayload,
): Promise<{ ok: boolean; error?: string }> {
  if (!REPORT_API_BASE) return { ok: false, error: "not_configured" };
  try {
    const res = await fetch(`${REPORT_API_BASE}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return { ok: res.ok, error: res.ok ? undefined : `HTTP ${res.status}` };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "network_error",
    };
  }
}
