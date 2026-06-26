/**
 * Pure: map a marketing lead → the deterministic OutreachFacts the model must not
 * contradict. The app passes its camelCase `MarketingLead` (structurally a LeadInput),
 * so no app imports leak into the package. Language pick: el for a .gr site or a
 * Greek area, else en (the parked-doc locked decision).
 */

import type { Lang, OutreachFacts } from "./types";

/** The subset of a marketing lead the facts need (MarketingLead is assignable). */
export interface LeadInput {
  id: string;
  name: string;
  category: string | null;
  area: string | null;
  website: string | null;
  hasWebsite: boolean;
  phone: string | null;
  email: string | null;
  pitchAngle: string | null;
  tags: string[];
  tech: string[];
  ugliness: number | null;
}

function pickLang(website: string | null, area: string | null): Lang {
  if (website && /\.gr\b/i.test(website)) return "el";
  if (area && /(greece|ελλ)/i.test(area)) return "el";
  return "en";
}

export function buildFacts(lead: LeadInput): OutreachFacts {
  return {
    leadId: lead.id,
    businessName: lead.name,
    category: lead.category,
    area: lead.area,
    website: lead.website,
    hasWebsite: lead.hasWebsite,
    phone: lead.phone,
    email: lead.email,
    lang: pickLang(lead.website, lead.area),
    pitchAngle: lead.pitchAngle,
    tags: Array.isArray(lead.tags) ? lead.tags : [],
    tech: Array.isArray(lead.tech) ? lead.tech : [],
    ugliness: lead.ugliness,
  };
}
