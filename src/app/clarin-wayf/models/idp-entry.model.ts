/**
 * Normalized Identity Provider entry — the component's internal data model.
 *
 * All feed formats (Shibboleth DiscoFeed, custom backends, static JSON)
 * are normalized to this shape by the feed service before use.
 */
export interface IdentityProvider {
  /** SAML entityID (unique identifier). */
  entityID: string;

  /** Human-readable display name (already resolved from localized arrays). */
  title: string;

  /** ISO 3166-1 alpha-2 country code (e.g. "CZ", "DE"). */
  country?: string;

  /** Geographic coordinates for distance-based sorting. */
  geo?: { lat: number; lon: number };

  /** Sort weight — higher values appear first within equal search scores. */
  weight?: number;

  /** Short description of the provider. */
  description?: string;

  /** URL to the provider's logo image. */
  logoUrl?: string;

  /** Flat keyword list for search matching. */
  keywords?: string[];
}

// ── Raw DiscoFeed types (used only during normalization) ────────────────

/** A localized value from the standard Shibboleth DiscoFeed. */
export interface DiscoFeedLocalizedValue {
  value: string;
  lang?: string;
}

/** A logo entry from the standard Shibboleth DiscoFeed. */
export interface DiscoFeedLogoEntry {
  value: string;
  height?: string | number;
  width?: string | number;
  lang?: string;
}

/**
 * Raw entry shape from a Shibboleth DiscoFeed endpoint.
 * `/Shibboleth.sso/DiscoFeed` returns an array of these.
 */
export interface DiscoFeedEntry {
  entityID: string;
  DisplayNames?: DiscoFeedLocalizedValue[];
  Descriptions?: DiscoFeedLocalizedValue[];
  Logos?: DiscoFeedLogoEntry[];
  Keywords?: DiscoFeedLocalizedValue[];
  InformationURLs?: DiscoFeedLocalizedValue[];
  PrivacyStatementURLs?: DiscoFeedLocalizedValue[];
}

/**
 * Resolve a single value from a localized array.
 * Tries: exact lang match → 'en' fallback → first entry → fallback.
 */
export function resolveLocalized(
  values: DiscoFeedLocalizedValue[] | undefined,
  lang: string,
  fallback = '',
): string {
  if (!values?.length) {
    return fallback;
  }
  const exact = values.find(v => v.lang === lang);
  if (exact) { return exact.value; }
  const en = values.find(v => v.lang === 'en');
  if (en) { return en.value; }
  return values[0].value;
}

/**
 * Pick the best logo URL from a DiscoFeed Logos array.
 * Prefers a small logo (height ≤ 60px); falls back to the first one.
 */
function pickLogoUrl(logos: DiscoFeedLogoEntry[] | undefined): string | undefined {
  if (!logos?.length) {
    return undefined;
  }
  const small = logos.find(l => l.height != null && Number(l.height) <= 60);
  return (small ?? logos[0]).value || undefined;
}

/**
 * Normalize a raw DiscoFeed entry to the flat IdentityProvider model.
 */
export function normalizeDiscoFeedEntry(
  raw: DiscoFeedEntry,
  lang: string,
): IdentityProvider {
  return {
    entityID: raw.entityID,
    title: resolveLocalized(raw.DisplayNames, lang, raw.entityID),
    description: resolveLocalized(raw.Descriptions, lang) || undefined,
    logoUrl: pickLogoUrl(raw.Logos),
    keywords: raw.Keywords?.map(k => k.value),
  };
}

/**
 * Detect whether a raw JSON entry is a DiscoFeed entry (has DisplayNames)
 * or already an IdentityProvider (has title). Normalize accordingly.
 */
export function normalizeEntry(raw: any, lang: string): IdentityProvider {
  if (raw.DisplayNames || raw.Logos || raw.Keywords) {
    return normalizeDiscoFeedEntry(raw as DiscoFeedEntry, lang);
  }
  // Already in IdentityProvider-like shape — pass through with defaults
  return {
    entityID: raw.entityID,
    title: raw.title ?? raw.entityID,
    country: raw.country,
    geo: raw.geo,
    weight: raw.weight,
    description: raw.description,
    logoUrl: raw.logoUrl,
    keywords: raw.keywords,
  };
}
