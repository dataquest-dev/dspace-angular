import { TestBed } from '@angular/core/testing';
import { PLATFORM_ID } from '@angular/core';

import { WayfPersistenceService } from './persistence.service';

describe('WayfPersistenceService', () => {
  let service: WayfPersistenceService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        WayfPersistenceService,
        { provide: PLATFORM_ID, useValue: 'browser' },
      ],
    });
    service = TestBed.inject(WayfPersistenceService);
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should start with null lastIdp when localStorage is empty', () => {
    expect(service.lastIdp()).toBeNull();
  });

  describe('selectIdp()', () => {
    it('should update the lastIdp signal', () => {
      service.selectIdp('https://idp.example.org');
      expect(service.lastIdp()).toBe('https://idp.example.org');
    });

    it('should persist the selection to localStorage', () => {
      service.selectIdp('https://idp.example.org');
      expect(localStorage.getItem('wayf:last-idp')).toBe('https://idp.example.org');
    });

    it('should overwrite previous selection', () => {
      service.selectIdp('https://first.example.org');
      service.selectIdp('https://second.example.org');
      expect(service.lastIdp()).toBe('https://second.example.org');
      expect(localStorage.getItem('wayf:last-idp')).toBe('https://second.example.org');
    });
  });

  describe('initialization from localStorage', () => {
    it('should read existing value from localStorage on creation', () => {
      localStorage.setItem('wayf:last-idp', 'https://persisted.example.org');

      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [
          WayfPersistenceService,
          { provide: PLATFORM_ID, useValue: 'browser' },
        ],
      });
      const freshService = TestBed.inject(WayfPersistenceService);

      expect(freshService.lastIdp()).toBe('https://persisted.example.org');
    });
  });

  describe('SSR safety', () => {
    it('should return null lastIdp on server platform', () => {
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [
          WayfPersistenceService,
          { provide: PLATFORM_ID, useValue: 'server' },
        ],
      });
      const ssrService = TestBed.inject(WayfPersistenceService);

      expect(ssrService.lastIdp()).toBeNull();
    });

    it('should not throw on selectIdp() in server platform', () => {
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [
          WayfPersistenceService,
          { provide: PLATFORM_ID, useValue: 'server' },
        ],
      });
      const ssrService = TestBed.inject(WayfPersistenceService);

      expect(() => ssrService.selectIdp('https://example.org')).not.toThrow();
      expect(ssrService.lastIdp()).toBe('https://example.org');
    });
  });
});
