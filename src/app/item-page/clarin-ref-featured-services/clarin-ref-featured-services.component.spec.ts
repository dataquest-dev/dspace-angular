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

import { RemoteDataBuildService } from '../../core/cache/builders/remote-data-build.service';
import { RequestService } from '../../core/data/request.service';
import { HardRedirectService } from '../../core/services/hard-redirect.service';
import { HALEndpointService } from '../../core/shared/hal-endpoint.service';
import { Item } from '../../core/shared/item.model';
import { createSuccessfulRemoteDataObject$ } from '../../shared/remote-data.utils';
import { ClarinRefFeaturedServicesComponent } from './clarin-ref-featured-services.component';

/**
 * The accessible names of the share links come from these keys, so the spec has to translate them for
 * real. A loader returning {} would hand the pipe the key back and the anchors would "pass" while a
 * screen reader read out `item.refbox.featured-service.share.facebook`.
 */
const TRANSLATIONS = {
  'item.refbox.featured-service.share.message': 'Share',
  'item.refbox.featured-service.share.facebook': 'Share this item on Facebook',
  'item.refbox.featured-service.share.twitter': 'Share this item on Twitter',
  'item.refbox.featured-service.links.dropdown': 'More links for {{name}}',
  'item.refbox.featured-service.heading': 'This resource is also integrated in following services:',
};

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
    const translate = TestBed.inject(TranslateService);
    translate.setTranslation('en', TRANSLATIONS);
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
    expect(names).toEqual(['Share this item on Facebook', 'Share this item on Twitter']);
  });

  it('gives the featured-service dropdown toggle an accessible name', () => {
    const toggle = fixture.nativeElement.querySelector('button.dropdown-toggle-split');
    expect(toggle).withContext('dropdown toggle did not render').not.toBeNull();
    expect((toggle.getAttribute('aria-label') || toggle.textContent || '').trim()).toEqual('More links for Kontext');
  });

  it('reports no axe link-name or button-name violations', async () => {
    const results = await axe.run(fixture.nativeElement, {
      runOnly: { type: 'rule', values: ['link-name', 'button-name'] },
    });
    const offenders = results.violations.map(v => `${v.id}: ${v.nodes.map(n => n.html).join(' | ')}`);
    expect(offenders).toEqual([]);
  });
});
