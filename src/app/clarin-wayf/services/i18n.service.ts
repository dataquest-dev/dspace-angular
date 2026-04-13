import {
  computed,
  Injectable,
  signal,
} from '@angular/core';

/**
 * Internal i18n map keyed by language code → translation key → translated string.
 * This avoids any dependency on Angular's i18n compiler or @ngx-translate at runtime,
 * making the component fully self-contained for future extraction.
 */
const TRANSLATIONS: Record<string, Record<string, string>> = {
  en: {
    'wayf.title': 'Select your institution',
    'wayf.search.placeholder': 'Search for your institution...',
    'wayf.search.results': '{count} institutions found',
    'wayf.search.no-results': 'No institutions match your search',
    'wayf.recent.continue': 'Continue with',
    'wayf.hub.badge': 'Hub',
    'wayf.loading': 'Loading institutions...',
    'wayf.error.feed': 'Failed to load identity providers. Please try again.',
    'wayf.a11y.search-label': 'Search for your institution',
    'wayf.a11y.list-label': 'List of identity providers',
    'wayf.a11y.result-count': '{count} results available',
    'wayf.pinned.label': 'Default institution',
  },
  cs: {
    'wayf.title': 'Vyberte svou instituci',
    'wayf.search.placeholder': 'Hledejte svou instituci...',
    'wayf.search.results': '{count} institucí nalezeno',
    'wayf.search.no-results': 'Žádné instituce neodpovídají vašemu hledání',
    'wayf.recent.continue': 'Pokračovat s',
    'wayf.hub.badge': 'Hub',
    'wayf.loading': 'Načítání institucí...',
    'wayf.error.feed': 'Nepodařilo se načíst poskytovatele identity. Zkuste to prosím znovu.',
    'wayf.a11y.search-label': 'Hledejte svou instituci',
    'wayf.a11y.list-label': 'Seznam poskytovatelů identity',
    'wayf.a11y.result-count': '{count} výsledků k dispozici',
    'wayf.pinned.label': 'Výchozí instituce',
  },
  de: {
    'wayf.title': 'Wählen Sie Ihre Einrichtung',
    'wayf.search.placeholder': 'Suchen Sie Ihre Einrichtung...',
    'wayf.search.results': '{count} Einrichtungen gefunden',
    'wayf.search.no-results': 'Keine Einrichtungen gefunden',
    'wayf.recent.continue': 'Weiter mit',
    'wayf.hub.badge': 'Hub',
    'wayf.loading': 'Einrichtungen werden geladen...',
    'wayf.error.feed': 'Identitätsanbieter konnten nicht geladen werden. Bitte versuchen Sie es erneut.',
    'wayf.a11y.search-label': 'Suchen Sie Ihre Einrichtung',
    'wayf.a11y.list-label': 'Liste der Identitätsanbieter',
    'wayf.a11y.result-count': '{count} Ergebnisse verfügbar',
    'wayf.pinned.label': 'Standardeinrichtung',
  },
};

/**
 * Signal-based translation service for the WAYF component.
 * Self-contained — no dependency on @ngx-translate or Angular i18n compiler.
 */
@Injectable({ providedIn: 'root' })
export class WayfI18nService {

  /** Active language code. */
  readonly lang = signal(this.detectLang());

  /** The active translation map. */
  readonly translations = computed(() => {
    const lang = this.lang();
    return TRANSLATIONS[lang] ?? TRANSLATIONS['en'];
  });

  /**
   * Translate a key, interpolating {placeholders} from the params map.
   */
  t(key: string, params?: Record<string, string | number>): string {
    let text = this.translations()[key] ?? TRANSLATIONS['en'][key] ?? key;
    if (params) {
      for (const [k, v] of Object.entries(params)) {
        text = text.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v));
      }
    }
    return text;
  }

  /**
   * Set the active language. Falls back to 'en' if not supported.
   */
  setLang(lang: string): void {
    this.lang.set(lang);
  }

  private detectLang(): string {
    try {
      const browserLang = navigator?.language?.split('-')[0];
      if (browserLang && TRANSLATIONS[browserLang]) {
        return browserLang;
      }
    } catch {
      // SSR — no navigator
    }
    return 'en';
  }
}
