import defaultJson from "@guide/member-welcome.json";
import { getPublicApiV1Base } from "./publicApiBase";

export type MemberWelcomeGuideJson = {
  version: string;
  enabled?: boolean;
  title: string;
  subtitle?: string;
  items: { heading: string; text: string }[];
  footer?: string;
  primaryCtaLabel?: string;
  fullGuideLinkLabel?: string;
  fullGuidePath?: string;
};

export const FALLBACK_MEMBER_GUIDE = defaultJson as MemberWelcomeGuideJson;

function isValidGuideData(data: unknown): data is MemberWelcomeGuideJson {
  if (!data || typeof data !== "object") return false;
  const o = data as Record<string, unknown>;
  if (typeof o.version !== "string" || !o.version.trim()) return false;
  if (typeof o.title !== "string") return false;
  if (!Array.isArray(o.items)) return false;
  for (const item of o.items) {
    if (!item || typeof item !== "object") return false;
    const i = item as Record<string, unknown>;
    if (typeof i.heading !== "string" || typeof i.text !== "string") return false;
  }
  return true;
}

/** Konten panduan: API jika sudah diisi admin, selain itu file `guide/member-welcome.json`. */
export async function fetchMemberGuideResolved(): Promise<MemberWelcomeGuideJson> {
  try {
    const res = await fetch(`${getPublicApiV1Base()}/member-mobile-welcome`, {
      cache: "no-store",
    });
    const json = await res.json();
    if (
      json?.status === "success" &&
      json.data != null &&
      isValidGuideData(json.data)
    ) {
      return json.data;
    }
  } catch {
    /* jaringan / server — fallback */
  }
  return FALLBACK_MEMBER_GUIDE;
}

export function guideIsActive(guide: MemberWelcomeGuideJson): boolean {
  return guide.enabled !== false;
}
