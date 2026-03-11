import { TestBed } from '@angular/core/testing';

import { StaticPageComponent } from './static-page.component';
import { HtmlContentService } from '../shared/html-content.service';
import { Router } from '@angular/router';
import { RouterMock } from '../shared/mocks/router.mock';
import { TranslateModule } from '@ngx-translate/core';
import { of } from 'rxjs';
import { APP_CONFIG } from '../../config/app-config.interface';
import { environment } from '../../environments/environment';
import { ClarinSafeHtmlPipe } from '../shared/utils/clarin-safehtml.pipe';

describe('StaticPageComponent', () => {
  async function setupTest(html: string, restBase?: string) {
    const htmlContentService = jasmine.createSpyObj('htmlContentService', {
      fetchHtmlContent: of(html),
      getHmtlContentByPathAndLocale: Promise.resolve(html)
    });

    const appConfig = {
      ...environment,
      ui: {
        ...(environment as any).ui,
        namespace: 'testNamespace'
      },
      rest: {
        ...(environment as any).rest,
        baseUrl: restBase
      }
    };

    await TestBed.configureTestingModule({
      declarations: [ StaticPageComponent, ClarinSafeHtmlPipe ],
      imports: [
        TranslateModule.forRoot()
      ],
      providers: [
        { provide: HtmlContentService, useValue: htmlContentService },
        { provide: Router, useValue: new RouterMock() },
        { provide: APP_CONFIG, useValue: appConfig }
      ]
    }).compileComponents();

    const fixture = TestBed.createComponent(StaticPageComponent);
    const component = fixture.componentInstance;
    return { fixture, component, htmlContentService };
  }

  it('should create', async () => {
    const { component } = await setupTest('<div>test</div>');
    expect(component).toBeTruthy();
  });

  // Load `TEST MESSAGE`
  it('should load html file content', async () => {
    const { component } = await setupTest('<div id="idShouldNotBeRemoved">TEST MESSAGE</div>');
    await component.ngOnInit();
    expect(component.htmlContent.value).toBe('<div id="idShouldNotBeRemoved">TEST MESSAGE</div>');
  });

  it('should rewrite OAI link with rest.baseUrl', async () => {
    const oaiHtml = '<a href="/server/oai/request?verb=ListSets">OAI</a>';
    const { fixture, component } = await setupTest(oaiHtml, 'https://api.example.org/server');

    await component.ngOnInit();
    fixture.detectChanges();

    const rewritten = 'https://api.example.org/server/oai/request?verb=ListSets';
    expect(component.htmlContent.value).toContain(rewritten);
    const anchor = fixture.nativeElement.querySelector('a');
    expect(anchor.getAttribute('href')).toBe(rewritten);
  });

  it('should leave OAI link unchanged when rest.baseUrl is missing', async () => {
    const oaiHtml = '<a href="/server/oai/request?verb=Identify">OAI</a>';
    const { fixture, component } = await setupTest(oaiHtml, undefined);

    await component.ngOnInit();
    fixture.detectChanges();

    expect(component.htmlContent.value).toContain('/server/oai/request?verb=Identify');
  });

  it('should avoid double slashes when rest.baseUrl ends with slash', async () => {
    const oaiHtml = '<a href="/server/oai/request?verb=ListRecords">OAI</a>';
    const { fixture, component } = await setupTest(oaiHtml, 'https://api.example.org/server/');

    await component.ngOnInit();
    fixture.detectChanges();

    expect(component.htmlContent.value).toContain('https://api.example.org/server/oai/request?verb=ListRecords');
    expect(component.htmlContent.value).not.toContain('//oai');
  });

  it('should include namespace in OAI link when rest.baseUrl has namespace prefix', async () => {
    const oaiHtml = '<a href="/server/oai/request?verb=ListMetadataFormats">full list</a>';
    const { fixture, component } = await setupTest(oaiHtml, 'https://api.example.org/repository/server');

    await component.ngOnInit();
    fixture.detectChanges();

    const rewritten = 'https://api.example.org/repository/server/oai/request?verb=ListMetadataFormats';
    expect(component.htmlContent.value).toContain(rewritten);
    const anchor = fixture.nativeElement.querySelector('a');
    expect(anchor.getAttribute('href')).toBe(rewritten);
  });

  it('should leave content unchanged when no OAI link is present', async () => {
    const otherHtml = '<a href="/server/other">Other</a>';
    const { fixture, component } = await setupTest(otherHtml, 'https://api.example.org/server');

    await component.ngOnInit();
    fixture.detectChanges();

    expect(component.htmlContent.value).toBe(otherHtml);
  });
});
