/**
 * Represents a single Identity Provider entry from the backend DiscoFeed.
 *
 * Matches the "shrunk" JSON shape returned by the DSpace backend
 * (`/api/discojuice/feeds`), where the backend has already:
 *  - extracted the first DisplayName → `title`
 *  - merged remaining DisplayNames + Keywords + Descriptions → `keywords[]`
 *  - resolved or guessed a two-letter ISO country code → `country`
 *  - stripped Logos, InformationURLs, PrivacyStatementURLs, etc.
 */
export interface IdpEntry {
  /** SAML entityID (unique identifier). */
  entityID: string;

  /** Primary display name (first value from the original DisplayNames). */
  title: string;

  /** Searchable keywords (remaining names + original Keywords + Descriptions). */
  keywords: string[];

  /** Two-letter ISO 3166-1 country code (may be empty). */
  country: string;

  /** Tags from the SAML metadata (e.g. "clarin", "sirtfi"). Kept as-is by backend. */
  Tags?: string[];
}
