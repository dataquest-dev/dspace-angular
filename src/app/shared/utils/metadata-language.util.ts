/**
 * Convert a DSpace metadata language value into a valid BCP 47 language tag
 * suitable for an HTML `lang` attribute, or `null` when none applies.
 *
 * DSpace stores the metadata language as a Java-style locale (e.g. `en_US`,
 * `cs_CZ`), the wildcard `*` (language-independent), or nothing. None of the
 * underscore forms or the wildcard are valid BCP 47 / HTML `lang` values, so
 * assistive technology ignores them. This normalizes them:
 * - `null`/`undefined`/empty and the wildcard `*` → `null` (attribute omitted)
 * - the Java-style separator is converted: `en_US` → `en-US`, `cs_CZ` → `cs-CZ`
 *
 * @param language the raw metadata language value
 * @returns a BCP 47 language tag, or `null` when no valid tag applies
 */
export function metadataLangToBcp47(language: string | null | undefined): string | null {
  if (!language || language === '*') {
    return null;
  }
  return language.replace(/_/g, '-');
}
