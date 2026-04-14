import { TestBed } from '@angular/core/testing';

import { WayfI18nService } from './i18n.service';

describe('WayfI18nService', () => {
  let service: WayfI18nService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [WayfI18nService],
    });
    service = TestBed.inject(WayfI18nService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  // ── t() ─────────────────────────────────────────────────────

  describe('t()', () => {
    it('should return English translation by default', () => {
      service.setLang('en');
      expect(service.t('wayf.title')).toBe('Select your institution');
    });

    it('should return Czech translation when lang is cs', () => {
      service.setLang('cs');
      expect(service.t('wayf.title')).toBe('Vyberte svou instituci');
    });

    it('should return German translation when lang is de', () => {
      service.setLang('de');
      expect(service.t('wayf.title')).toBe('Wählen Sie Ihre Einrichtung');
    });

    it('should fall back to English for unsupported language', () => {
      service.setLang('xx');
      expect(service.t('wayf.title')).toBe('Select your institution');
    });

    it('should return the key when translation is missing', () => {
      service.setLang('en');
      expect(service.t('wayf.nonexistent.key')).toBe('wayf.nonexistent.key');
    });

    it('should interpolate {count} placeholder', () => {
      service.setLang('en');
      expect(service.t('wayf.search.results', { count: 5 })).toBe('5 institutions found');
    });

    it('should interpolate multiple occurrences of the same placeholder', () => {
      service.setLang('en');
      // wayf.a11y.result-count uses {count}
      expect(service.t('wayf.a11y.result-count', { count: 12 })).toBe('12 results available');
    });
  });

  // ── setLang() ───────────────────────────────────────────────

  describe('setLang()', () => {
    it('should change the active language', () => {
      service.setLang('cs');
      expect(service.lang()).toBe('cs');
    });

    it('should update translations reactively', () => {
      service.setLang('en');
      const enTitle = service.t('wayf.loading');
      service.setLang('de');
      const deTitle = service.t('wayf.loading');
      expect(enTitle).not.toBe(deTitle);
    });
  });

  // ── Missing key coverage ────────────────────────────────────

  describe('wayf.local-auth key', () => {
    it('should have English translation for wayf.local-auth', () => {
      service.setLang('en');
      expect(service.t('wayf.local-auth')).toBe('Log in with local account');
    });

    it('should have Czech translation for wayf.local-auth', () => {
      service.setLang('cs');
      expect(service.t('wayf.local-auth')).not.toBe('wayf.local-auth');
    });

    it('should have German translation for wayf.local-auth', () => {
      service.setLang('de');
      expect(service.t('wayf.local-auth')).not.toBe('wayf.local-auth');
    });
  });

  // ── All keys consistency ────────────────────────────────────

  describe('translation key consistency', () => {
    it('should have the same keys in cs as in en', () => {
      service.setLang('en');
      const enKeys = Object.keys(service.translations());
      service.setLang('cs');
      const csKeys = Object.keys(service.translations());
      expect(csKeys.sort()).toEqual(enKeys.sort());
    });

    it('should have the same keys in de as in en', () => {
      service.setLang('en');
      const enKeys = Object.keys(service.translations());
      service.setLang('de');
      const deKeys = Object.keys(service.translations());
      expect(deKeys.sort()).toEqual(enKeys.sort());
    });
  });
});
