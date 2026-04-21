import { TestBed } from '@angular/core/testing';
import { PLATFORM_ID } from '@angular/core';

import { WayfFeedService } from './feed.service';
import { IdentityProvider } from '../models/idp-entry.model';

describe('WayfFeedService', () => {
  let service: WayfFeedService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        WayfFeedService,
        { provide: PLATFORM_ID, useValue: 'browser' },
      ],
    });
    service = TestBed.inject(WayfFeedService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should start with empty entries', () => {
    expect(service.entries()).toEqual([]);
  });

  it('should start with loading = false', () => {
    expect(service.loading()).toBe(false);
  });

  it('should start with error = null', () => {
    expect(service.error()).toBeNull();
  });

  describe('loadFeed()', () => {
    let fetchSpy: jasmine.Spy;

    afterEach(() => {
      fetchSpy?.and.callThrough();
    });

    it('should parse a standard DiscoFeed response', async () => {
      const mockData = [
        {
          entityID: 'https://idp.example.org',
          DisplayNames: [{ value: 'Example Uni', lang: 'en' }],
        },
      ];
      fetchSpy = spyOn(globalThis, 'fetch').and.resolveTo(
        new Response(JSON.stringify(mockData), { status: 200 }),
      );

      await service.loadFeed('https://feed.example.org/DiscoFeed');

      expect(service.entries().length).toBe(1);
      expect(service.entries()[0].entityID).toBe('https://idp.example.org');
      expect(service.entries()[0].title).toBe('Example Uni');
      expect(service.loading()).toBe(false);
      expect(service.error()).toBeNull();
    });

    it('should parse a flat IdentityProvider response', async () => {
      const mockData: IdentityProvider[] = [
        { entityID: 'https://idp.example.org', title: 'Example Uni' },
      ];
      fetchSpy = spyOn(globalThis, 'fetch').and.resolveTo(
        new Response(JSON.stringify(mockData), { status: 200 }),
      );

      await service.loadFeed('https://feed.example.org/feed.json');

      expect(service.entries().length).toBe(1);
      expect(service.entries()[0].title).toBe('Example Uni');
    });

    it('should set error on HTTP failure', async () => {
      fetchSpy = spyOn(globalThis, 'fetch').and.resolveTo(
        new Response(null, { status: 500, statusText: 'Internal Server Error' }),
      );

      await service.loadFeed('https://feed.example.org/DiscoFeed');

      expect(service.error()).toContain('500');
      expect(service.entries()).toEqual([]);
      expect(service.loading()).toBe(false);
    });

    it('should set error on network failure', async () => {
      fetchSpy = spyOn(globalThis, 'fetch').and.rejectWith(new Error('Network error'));

      await service.loadFeed('https://feed.example.org/DiscoFeed');

      expect(service.error()).toBe('Network error');
      expect(service.entries()).toEqual([]);
    });

    it('should handle non-array JSON gracefully', async () => {
      fetchSpy = spyOn(globalThis, 'fetch').and.resolveTo(
        new Response(JSON.stringify({ not: 'an array' }), { status: 200 }),
      );

      await service.loadFeed('https://feed.example.org/DiscoFeed');

      expect(service.entries()).toEqual([]);
      expect(service.error()).toBeNull();
    });

    it('should handle HTTP 204 (no content)', async () => {
      fetchSpy = spyOn(globalThis, 'fetch').and.resolveTo(
        new Response(null, { status: 204, statusText: 'No Content' }),
      );

      await service.loadFeed('https://feed.example.org/DiscoFeed');

      expect(service.entries()).toEqual([]);
      expect(service.error()).toBeNull();
    });

    it('should set loading to true during fetch', async () => {
      let resolvePromise: (value: Response) => void;
      const pendingResponse = new Promise<Response>(resolve => {
        resolvePromise = resolve;
      });
      fetchSpy = spyOn(globalThis, 'fetch').and.returnValue(pendingResponse);

      const loadPromise = service.loadFeed('https://feed.example.org/DiscoFeed');

      expect(service.loading()).toBe(true);

      resolvePromise!(new Response(JSON.stringify([]), { status: 200 }));
      await loadPromise;

      expect(service.loading()).toBe(false);
    });

    it('should call fetch with credentials: omit', async () => {
      fetchSpy = spyOn(globalThis, 'fetch').and.resolveTo(
        new Response(JSON.stringify([]), { status: 200 }),
      );

      await service.loadFeed('https://feed.example.org/DiscoFeed');

      expect(fetchSpy).toHaveBeenCalledWith(
        'https://feed.example.org/DiscoFeed',
        { credentials: 'omit' },
      );
    });

    it('should deduplicate entries with the same entityID', async () => {
      const mockData = [
        { entityID: 'https://idp.example.org', DisplayNames: [{ value: 'Uni A', lang: 'en' }] },
        { entityID: 'https://idp.example.org', DisplayNames: [{ value: 'Uni A', lang: 'en' }] },
        { entityID: 'https://idp2.example.org', DisplayNames: [{ value: 'Uni B', lang: 'en' }] },
      ];
      fetchSpy = spyOn(globalThis, 'fetch').and.resolveTo(
        new Response(JSON.stringify(mockData), { status: 200 }),
      );

      await service.loadFeed('https://feed.example.org/DiscoFeed');

      expect(service.entries().length).toBe(2);
      expect(service.entries()[0].entityID).toBe('https://idp.example.org');
      expect(service.entries()[1].entityID).toBe('https://idp2.example.org');
    });
  });

  describe('SSR safety', () => {
    it('should skip fetch on server platform', async () => {
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [
          WayfFeedService,
          { provide: PLATFORM_ID, useValue: 'server' },
        ],
      });
      const ssrService = TestBed.inject(WayfFeedService);
      const fetchSpy = spyOn(globalThis, 'fetch');

      await ssrService.loadFeed('https://feed.example.org/DiscoFeed');

      expect(fetchSpy).not.toHaveBeenCalled();
      expect(ssrService.entries()).toEqual([]);
    });
  });
});
