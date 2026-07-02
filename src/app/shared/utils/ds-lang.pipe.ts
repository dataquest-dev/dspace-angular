import { Pipe, PipeTransform } from '@angular/core';

import { metadataLangToBcp47 } from './metadata-language.util';

/**
 * Pipe that normalizes a DSpace metadata language value into a valid BCP 47
 * language tag for an HTML `lang` attribute, or `null` when none applies.
 *
 * Delegates to {@link metadataLangToBcp47}, so binding `[attr.lang]` through this
 * pipe both omits the attribute for absent/wildcard languages and converts
 * Java-style locales (`en_US` → `en-US`).
 */
@Pipe({
  name: 'dsLang'
})
export class DsLangPipe implements PipeTransform {
  /**
   * @param {string} language the raw metadata language value
   * @returns {string | null} a BCP 47 language tag, or null when none applies
   */
  transform(language: string | null | undefined): string | null {
    return metadataLangToBcp47(language);
  }
}
