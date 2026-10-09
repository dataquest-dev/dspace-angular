import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { TranslateLoader, TranslateModule } from '@ngx-translate/core';

import { ClarinItemAuthorPreviewComponent } from './clarin-item-author-preview.component';
import { ConfigurationDataService } from '../../core/data/configuration-data.service';
import { ConfigurationProperty } from '../../core/shared/configuration-property.model';
import { Item } from '../../core/shared/item.model';
import { TranslateLoaderMock } from '../mocks/translate-loader.mock';
import { createFailedRemoteDataObject$, createSuccessfulRemoteDataObject$ } from '../remote-data.utils';

describe('ClarinItemAuthorPreviewComponent', () => {
  const UI_URL = 'http://localhost:4000';
  const ORCID_DOMAIN = 'https://orcid.org';
  const ORCID_ID = '0000-0002-1825-0097';
  const ORCID_LINK_TITLE_KEY = 'item.view.box.author.preview.orcid-link.title';

  let fixture: ComponentFixture<ClarinItemAuthorPreviewComponent>;
  let properties: { [name: string]: string };

  const configurationService = jasmine.createSpyObj('configurationService', ['findByPropertyName']);

  function itemWithAuthors(authors: { value: string, authority?: string }[]): Item {
    return Object.assign(new Item(), {
      metadata: {
        'dc.contributor.author': authors.map((author, place) => Object.assign({ language: null, place }, author)),
      },
    });
  }

  async function render(authors: { value: string, authority?: string }[]): Promise<void> {
    fixture = TestBed.createComponent(ClarinItemAuthorPreviewComponent);
    fixture.componentInstance.item = itemWithAuthors(authors);
    fixture.componentInstance.fields = ['dc.contributor.author'];
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  }

  function query(selector: string): HTMLAnchorElement[] {
    return fixture.debugElement.queryAll(By.css(selector)).map((el) => el.nativeElement);
  }

  beforeEach(async () => {
    properties = { 'dspace.ui.url': UI_URL, 'orcid.domain-url': ORCID_DOMAIN };
    configurationService.findByPropertyName.and.callFake((name: string) => name in properties
      ? createSuccessfulRemoteDataObject$(Object.assign(new ConfigurationProperty(), { name, values: [properties[name]] }))
      : createFailedRemoteDataObject$('No such configuration property', 404));

    await TestBed.configureTestingModule({
      imports: [
        TranslateModule.forRoot({ loader: { provide: TranslateLoader, useClass: TranslateLoaderMock } }),
      ],
      declarations: [ClarinItemAuthorPreviewComponent],
      providers: [
        { provide: ConfigurationDataService, useValue: configurationService },
      ],
    }).compileComponents();
  });

  it('should create', async () => {
    await render([]);
    expect(fixture.componentInstance).toBeTruthy();
  });

  describe('author with an ORCID iD authority', () => {
    it('keeps the name on the search link and adds an ORCID profile link by default', async () => {
      await render([{ value: 'Doe, Jane', authority: ORCID_ID }]);

      const [nameLink] = query('a.item-author');
      expect(nameLink.getAttribute('href')).toBe(`${UI_URL}/search?f.author=${ORCID_ID},authority`);
      expect(nameLink.querySelector('i.fa-orcid')).toBeNull();

      const [orcidLink] = query('a.orcid-icon-link');
      expect(orcidLink.getAttribute('href')).toBe(`${ORCID_DOMAIN}/${ORCID_ID}`);
      expect(orcidLink.querySelector('i.fa-orcid')).not.toBeNull();
    });

    it('links the name to the ORCID profile when orcid.author.link-target is orcid', async () => {
      properties['orcid.author.link-target'] = 'orcid';
      await render([{ value: 'Doe, Jane', authority: ORCID_ID }]);

      const [nameLink] = query('a.item-author');
      expect(nameLink.getAttribute('href')).toBe(`${ORCID_DOMAIN}/${ORCID_ID}`);
      expect(nameLink.querySelector('i.fa-orcid')).not.toBeNull();
      expect(query('a.orcid-icon-link').length).toBe(0);
    });

    it('falls back to the default for an unknown orcid.author.link-target', async () => {
      properties['orcid.author.link-target'] = 'profile';
      await render([{ value: 'Doe, Jane', authority: ORCID_ID }]);

      expect(query('a.item-author')[0].getAttribute('href')).toBe(`${UI_URL}/search?f.author=${ORCID_ID},authority`);
      expect(query('a.orcid-icon-link').length).toBe(1);
    });

    for (const linkTarget of ['browse', 'orcid']) {
      it(`opens the ORCID profile in a new tab with an accessible name (link-target ${linkTarget})`, async () => {
        properties['orcid.author.link-target'] = linkTarget;
        await render([{ value: 'Doe, Jane', authority: ORCID_ID }]);

        const [orcidLink] = query(`a[href="${ORCID_DOMAIN}/${ORCID_ID}"]`);
        expect(orcidLink.getAttribute('target')).toBe('_blank');
        expect(orcidLink.getAttribute('rel')).toBe('noopener noreferrer');
        expect(orcidLink.getAttribute('aria-label')).toBe(`${ORCID_LINK_TITLE_KEY} Doe, Jane`);
        expect(orcidLink.getAttribute('title')).toBe(ORCID_LINK_TITLE_KEY);
        expect(orcidLink.querySelector('i.fa-orcid').getAttribute('aria-hidden')).toBe('true');
      });
    }

    it('renders the ORCID link for the first author of a long author list', async () => {
      await render([
        { value: 'Doe, Jane', authority: ORCID_ID },
        ...['A', 'B', 'C', 'D', 'E'].map((value) => ({ value })),
      ]);

      expect(query('a.orcid-icon-link').map((link) => link.getAttribute('href')))
        .toEqual([`${ORCID_DOMAIN}/${ORCID_ID}`]);
    });
  });

  describe('author without an ORCID link renders as before', () => {
    it('without authority: equals search link, no icon', async () => {
      await render([{ value: 'Doe, John' }]);

      const [nameLink] = query('a.item-author');
      expect(nameLink.getAttribute('href')).toBe(`${UI_URL}/search?f.author=Doe%2C%20John,equals`);
      expect(nameLink.querySelector('i')).toBeNull();
      expect(query('a.orcid-icon-link').length).toBe(0);
    });

    it('with a non-ORCID authority: authority search link with the plain icon inside', async () => {
      await render([{ value: 'ACME', authority: 'local-authority-1' }]);

      const [nameLink] = query('a.item-author');
      expect(nameLink.getAttribute('href')).toBe(`${UI_URL}/search?f.author=local-authority-1,authority`);
      expect(nameLink.querySelector('i.fa-orcid')).not.toBeNull();
      expect(query('a.orcid-icon-link').length).toBe(0);
    });

    it('with an ORCID iD but orcid.domain-url not exposed: same as any authority', async () => {
      delete properties['orcid.domain-url'];
      properties['orcid.author.link-target'] = 'orcid';
      await render([{ value: 'Doe, Jane', authority: ORCID_ID }]);

      const [nameLink] = query('a.item-author');
      expect(nameLink.getAttribute('href')).toBe(`${UI_URL}/search?f.author=${ORCID_ID},authority`);
      expect(nameLink.querySelector('i.fa-orcid')).not.toBeNull();
      expect(query('a.orcid-icon-link').length).toBe(0);
    });
  });
});
