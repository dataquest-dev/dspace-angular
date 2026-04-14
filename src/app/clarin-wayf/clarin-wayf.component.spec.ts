import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PLATFORM_ID } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

import { ClarinWayfComponent } from './clarin-wayf.component';
import { WAYF_CONFIG, WAYF_DEFAULTS, WayfConfig } from './wayf.config';

/** Minimal config for tests — only the 3 required fields. */
const TEST_CONFIG: WayfConfig = {
  ...WAYF_DEFAULTS,
  feedUrl: 'https://test.example.org/DiscoFeed',
  spEntityId: 'https://sp.example.org',
  loginEndpoint: 'https://test.example.org/Shibboleth.sso/Login',
};

/** Stub ActivatedRoute with configurable query params. */
function mockActivatedRoute(queryParams: Record<string, string> = {}): Partial<ActivatedRoute> {
  return {
    snapshot: {
      queryParams,
    } as any,
  };
}

describe('ClarinWayfComponent', () => {
  let component: ClarinWayfComponent;
  let fixture: ComponentFixture<ClarinWayfComponent>;
  let fetchSpy: jasmine.Spy;

  beforeEach(async () => {
    fetchSpy = spyOn(globalThis, 'fetch').and.resolveTo(
      new Response(JSON.stringify([]), { status: 200 }),
    );

    await TestBed.configureTestingModule({
      imports: [ClarinWayfComponent],
      providers: [
        { provide: PLATFORM_ID, useValue: 'browser' },
        { provide: WAYF_CONFIG, useValue: TEST_CONFIG },
        { provide: ActivatedRoute, useValue: mockActivatedRoute() },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ClarinWayfComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    fetchSpy?.and.callThrough();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should call loadFeed on init', () => {
    fixture.detectChanges();
    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });

  // ── Security: URL validation ────────────────────────────────

  describe('sanitizeReturnUrl()', () => {
    it('should accept https URLs', () => {
      const result = (component as any).sanitizeReturnUrl('https://sp.example.org/callback');
      expect(result).toBe('https://sp.example.org/callback');
    });

    it('should accept http URLs', () => {
      const result = (component as any).sanitizeReturnUrl('http://sp.example.org/callback');
      expect(result).toBe('http://sp.example.org/callback');
    });

    it('should reject javascript: URLs', () => {
      const result = (component as any).sanitizeReturnUrl('javascript:alert(1)');
      expect(result).toBeNull();
    });

    it('should reject data: URLs', () => {
      const result = (component as any).sanitizeReturnUrl('data:text/html,<script>alert(1)</script>');
      expect(result).toBeNull();
    });

    it('should reject malformed URLs', () => {
      const result = (component as any).sanitizeReturnUrl('not-a-url');
      expect(result).toBeNull();
    });

    it('should handle null input', () => {
      const result = (component as any).sanitizeReturnUrl(null);
      expect(result).toBeNull();
    });

    it('should handle empty string', () => {
      const result = (component as any).sanitizeReturnUrl('');
      expect(result).toBeNull();
    });
  });

  describe('feedUrl validation', () => {
    it('should NOT fetch when feedUrl has javascript: scheme', async () => {
      fetchSpy.calls.reset();

      await TestBed.resetTestingModule();
      await TestBed.configureTestingModule({
        imports: [ClarinWayfComponent],
        providers: [
          { provide: PLATFORM_ID, useValue: 'browser' },
          {
            provide: WAYF_CONFIG,
            useValue: { ...TEST_CONFIG, feedUrl: 'javascript:alert(1)' },
          },
          { provide: ActivatedRoute, useValue: mockActivatedRoute() },
        ],
      }).compileComponents();

      const f = TestBed.createComponent(ClarinWayfComponent);
      f.detectChanges();
      await f.whenStable();

      expect(fetchSpy).not.toHaveBeenCalled();
    });
  });

  // ── SAMLDS params ───────────────────────────────────────────

  describe('SAMLDS parameter parsing', () => {
    it('should parse entityID from query params', async () => {
      await TestBed.resetTestingModule();
      await TestBed.configureTestingModule({
        imports: [ClarinWayfComponent],
        providers: [
          { provide: PLATFORM_ID, useValue: 'browser' },
          { provide: WAYF_CONFIG, useValue: TEST_CONFIG },
          {
            provide: ActivatedRoute,
            useValue: mockActivatedRoute({
              entityID: 'https://sp.example.org',
              return: 'https://sp.example.org/return',
            }),
          },
        ],
      }).compileComponents();

      const f = TestBed.createComponent(ClarinWayfComponent);
      f.detectChanges();

      expect(f.componentInstance.samldsParams().entityID).toBe('https://sp.example.org');
      expect(f.componentInstance.samldsParams().return).toBe('https://sp.example.org/return');
    });

    it('should reject non-HTTPS return URLs in SAMLDS', async () => {
      await TestBed.resetTestingModule();
      await TestBed.configureTestingModule({
        imports: [ClarinWayfComponent],
        providers: [
          { provide: PLATFORM_ID, useValue: 'browser' },
          { provide: WAYF_CONFIG, useValue: TEST_CONFIG },
          {
            provide: ActivatedRoute,
            useValue: mockActivatedRoute({
              return: 'javascript:alert(1)',
            }),
          },
        ],
      }).compileComponents();

      const f = TestBed.createComponent(ClarinWayfComponent);
      f.detectChanges();

      expect(f.componentInstance.samldsParams().return).toBeNull();
    });
  });

  // ── Config resolution ───────────────────────────────────────

  describe('config resolution', () => {
    it('should resolve serviceName from WAYF_CONFIG', () => {
      fixture.detectChanges();
      expect(component.resolvedServiceName()).toBe(TEST_CONFIG.serviceName);
    });

    it('should resolve maxResults from WAYF_CONFIG', () => {
      fixture.detectChanges();
      expect(component.resolvedMaxResults()).toBe(TEST_CONFIG.maxResults);
    });
  });

  // ── Event emitters ──────────────────────────────────────────

  describe('onIdpSelected()', () => {
    it('should emit idpSelected event', () => {
      fixture.detectChanges();
      const spy = jasmine.createSpy('idpSelected');
      component.idpSelected.subscribe(spy);

      const mockIdp = { entityID: 'https://idp.example.org', title: 'Test' };
      component.onIdpSelected(mockIdp);

      expect(spy).toHaveBeenCalledWith(mockIdp);
    });
  });

  describe('search', () => {
    it('should update searchQuery on onQueryChange', () => {
      fixture.detectChanges();
      component.onQueryChange('test query');
      expect(component.searchQuery()).toBe('test query');
    });

    it('should clear searchQuery on onEscaped', () => {
      fixture.detectChanges();
      component.onQueryChange('foo');
      component.onEscaped();
      expect(component.searchQuery()).toBe('');
    });
  });

  describe('isPassive mode', () => {
    afterEach(() => localStorage.removeItem('wayf:last-idp'));

    it('should build redirect URL with last IdP when isPassive and return URL are set', async () => {
      localStorage.setItem('wayf:last-idp', 'https://idp.example.org/shibboleth');

      await TestBed.resetTestingModule();
      await TestBed.configureTestingModule({
        imports: [ClarinWayfComponent],
        providers: [
          { provide: PLATFORM_ID, useValue: 'browser' },
          { provide: WAYF_CONFIG, useValue: TEST_CONFIG },
          { provide: ActivatedRoute, useValue: mockActivatedRoute({ isPassive: 'true', return: 'https://sp.example.org/return' }) },
        ],
      }).compileComponents();

      const f = TestBed.createComponent(ClarinWayfComponent);
      f.detectChanges();

      const params = f.componentInstance.samldsParams();
      expect(params.isPassive).toBeTrue();
      expect(params.return).toBe('https://sp.example.org/return');
      expect(localStorage.getItem('wayf:last-idp')).toBe('https://idp.example.org/shibboleth');
    });
  });
});
