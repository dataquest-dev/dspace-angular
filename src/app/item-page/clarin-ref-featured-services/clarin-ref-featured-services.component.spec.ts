import {
  ComponentFixture,
  TestBed,
  waitForAsync,
} from '@angular/core/testing';
import {
  TranslateModule,
  TranslateService,
} from '@ngx-translate/core';
import axe from 'axe-core';
import JSON5 from 'json5';

import { RemoteDataBuildService } from '../../core/cache/builders/remote-data-build.service';
import { RequestService } from '../../core/data/request.service';
import { HardRedirectService } from '../../core/services/hard-redirect.service';
import { HALEndpointService } from '../../core/shared/hal-endpoint.service';
import { Item } from '../../core/shared/item.model';
import { createSuccessfulRemoteDataObject$ } from '../../shared/remote-data.utils';
import { ClarinRefFeaturedServicesComponent } from './clarin-ref-featured-services.component';

const FACEBOOK_KEY = 'item.refbox.featured-service.share.facebook';
const TWITTER_KEY = 'item.refbox.featured-service.share.twitter';
const DROPDOWN_KEY = 'item.refbox.featured-service.links.dropdown';

const FEATURED_SERVICES = {
  content: [
    {
      name: 'Kontext',
      url: 'https://lindat.mff.cuni.cz/services/kontext',
      description: 'Concordancer',
      featuredServiceLinks: [
        { key: 'Czech', value: 'https://lindat.mff.cuni.cz/services/kontext/cs' },
      ],
    },
  ],
};

const ITEM = Object.assign(new Item(), {
  id: 'b8a9aad4-916d-4521-bed2-ac8da7bb6845',
  metadata: {
    'dc.identifier.uri': [{ value: 'http://hdl.handle.net/11234/1-5787' }],
    'dc.title': [{ value: 'Universal Dependencies 2.15' }],
  },
});

describe('ClarinRefFeaturedServicesComponent', () => {
  let component: ClarinRefFeaturedServicesComponent;
  let fixture: ComponentFixture<ClarinRefFeaturedServicesComponent>;
  let en: Record<string, any>;

  // The real catalogue, not a stub. A stub stays green after someone drops the keys from en.json5,
  // while production renders the bare key as the accessible name. It is fetched rather than imported
  // because the karma target serves src/assets (see the test target in angular.json).
  beforeAll(async () => {
    const response = await fetch('assets/i18n/en.json5');
    if (!response.ok) {
      throw new Error(`cannot read assets/i18n/en.json5 from the karma server: ${response.status}`);
    }
    en = JSON5.parse(await response.text());
  });

  beforeEach(waitForAsync(() => {
    void TestBed.configureTestingModule({
      imports: [
        ClarinRefFeaturedServicesComponent,
        TranslateModule.forRoot(),
      ],
      providers: [
        { provide: RequestService, useValue: { generateRequestId: () => 'req-1', send: () => undefined } },
        { provide: RemoteDataBuildService, useValue: { buildFromRequestUUID: () => createSuccessfulRemoteDataObject$(FEATURED_SERVICES) } },
        { provide: HALEndpointService, useValue: { getRootHref: () => 'https://example.org/server/api' } },
        { provide: HardRedirectService, useValue: {} },
      ],
    }).compileComponents();
  }));

  beforeEach(() => {
    if (en === undefined) {
      throw new Error('en.json5 was not loaded; the real failure is in beforeAll, not here');
    }
    const translate = TestBed.inject(TranslateService);
    translate.setTranslation('en', en);
    translate.use('en');
    fixture = TestBed.createComponent(ClarinRefFeaturedServicesComponent);
    component = fixture.componentInstance;
    component.item = ITEM;
    fixture.detectChanges();
  });

  const shareAnchors = (): HTMLAnchorElement[] =>
    Array.from(fixture.nativeElement.querySelectorAll('a.clarin-share-buttons'));

  it('renders both share links', () => {
    expect(shareAnchors().length).toEqual(2);
  });

  it('keeps the share labels in en.json5', () => {
    [FACEBOOK_KEY, TWITTER_KEY, DROPDOWN_KEY].forEach((key: string) => {
      expect(typeof en[key])
        .withContext(`${key} is missing from src/assets/i18n/en.json5`)
        .toEqual('string');
      expect((en[key] || '').trim()).not.toEqual('');
    });
  });

  it('gives every share link a non-empty accessible name', () => {
    shareAnchors().forEach((anchor: HTMLAnchorElement) => {
      const name = (anchor.getAttribute('aria-label') || anchor.textContent || '').trim();
      expect(name)
        .withContext(`share link ${anchor.className} has no accessible name: ${anchor.outerHTML}`)
        .not.toEqual('');
    });
  });

  it('does not leave a raw i18n key as the accessible name', () => {
    shareAnchors().forEach((anchor: HTMLAnchorElement) => {
      const name = (anchor.getAttribute('aria-label') || '').trim();
      expect(name)
        .withContext(`share link ${anchor.className} exposes an untranslated key: ${name}`)
        .not.toMatch(/^item\./);
    });
  });

  it('names each share link after the network it shares to', () => {
    const names = shareAnchors().map((a: HTMLAnchorElement) => a.getAttribute('aria-label'));
    expect(names).toEqual([en[FACEBOOK_KEY], en[TWITTER_KEY]]);
    // The name has to say what the link DOES, not only where it goes, so a bare "Facebook" fails.
    expect(names[0]).toMatch(/facebook/i);
    expect(names[0]).toMatch(/shar/i);
    expect(names[1]).toMatch(/twitter/i);
    expect(names[1]).toMatch(/shar/i);
  });

  it('gives the featured-service dropdown toggle an accessible name', () => {
    const toggle = fixture.nativeElement.querySelector('button.dropdown-toggle-split');
    expect(toggle).withContext('dropdown toggle did not render').not.toBeNull();
    const name = (toggle.getAttribute('aria-label') || toggle.textContent || '').trim();
    expect(name).not.toEqual('');
    expect(name).not.toMatch(/^item\./);
    expect(name).toContain('Kontext');
  });

  it('reports no axe link-name or button-name violations', async () => {
    const results = await axe.run(fixture.nativeElement, {
      runOnly: { type: 'rule', values: ['link-name', 'button-name'] },
    });
    const offenders = results.violations.map(v => `${v.id}: ${v.nodes.map(n => n.html).join(' | ')}`);
    expect(offenders).toEqual([]);
  });
});
