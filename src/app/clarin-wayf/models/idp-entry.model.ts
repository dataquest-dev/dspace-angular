/**
 * Represents a localized string value from the IdP JSON feed.
 */
export interface LocalizedValue {
  value: string;
  lang: string;
}

/**
 * Represents an IdP logo from the JSON feed.
 */
export interface IdpLogo {
  value: string;
  width?: number;
  height?: number;
}

/**
 * Represents a single Identity Provider entry from the SAML metadata feed.
 * Matches the DiscoFeed JSON schema used by CLARIN SPF and other SAML federations.
 */
export interface IdpEntry {
  entityID: string;
  DisplayNames: LocalizedValue[];
  Logos: IdpLogo[];
  Keywords: LocalizedValue[];
  InformationURLs: LocalizedValue[];
  PrivacyStatementURLs: LocalizedValue[];
  Tags: string[];
}
