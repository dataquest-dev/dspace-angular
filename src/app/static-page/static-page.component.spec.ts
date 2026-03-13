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
import { ServerResponseService } from '../core/services/server-response.service';

describe('StaticPageComponent', () => {
  function createDeferred<T>() {
    let resolve: (value: T) => void;
    let reject: (reason?: any) => void;
    const promise = new Promise<T>((res, rej) => {
      resolve = res;
      reject = rej;
    });
    return { promise, resolve: resolve!, reject: reject! };
  }

  async function setupTest(
    html: string | undefined,
    restBase?: string,
    contentPromise?: Promise<string | undefined>,
    route: string = '/static/test-file.html'
  ) {
    const htmlContentService = jasmine.createSpyObj('htmlContentService', {
      fetchHtmlContent: of(html),
      getHmtlContentByPathAndLocale: contentPromise ?? Promise.resolve(html)
    });

    const responseService = jasmine.createSpyObj('responseService', {
      setNotFound: null
    });

    const router = new RouterMock();
    router.setRoute(route);

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
        { provide: Router, useValue: router },
        { provide: ServerResponseService, useValue: responseService },
        { provide: APP_CONFIG, useValue: appConfig }
      ]
    }).compileComponents();

    const fixture = TestBed.createComponent(StaticPageComponent);
    const component = fixture.componentInstance;
    return { fixture, component, htmlContentService, responseService };
  }

  it('should create', async () => {
    const { component } = await setupTest('<div>test</div>');
    expect(component).toBeTruthy();
  });

  it('should load html file content', async () => {
    const { component } = await setupTest('<div id="idShouldNotBeRemoved">TEST MESSAGE</div>');
    await component.ngOnInit();
    expect(component.htmlContent.value).toBe('<div id="idShouldNotBeRemoved">TEST MESSAGE</div>');
  });

  it('should call HtmlContentService with the route html file name', async () => {
    const { component, htmlContentService } = await setupTest('<div>TEST MESSAGE</div>', undefined, undefined, '/static/license-ud-1.0.html');
    await component.ngOnInit();

    expect(htmlContentService.getHmtlContentByPathAndLocale).toHaveBeenCalledWith('license-ud-1.0.html');
  });

  it('should rewrite OAI link with rest.baseUrl', async () => {
    const oaiHtml = '<a href="/server/oai/request?verb=ListSets">OAI</a>';
    const { fixture, component } = await setupTest(oaiHtml, 'https://api.example.org/server');

    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const rewritten = 'https://api.example.org/server/oai/request?verb=ListSets';
    expect(component.htmlContent.value).toContain(rewritten);
    const anchor = fixture.nativeElement.querySelector('a');
    expect(anchor.getAttribute('href')).toBe(rewritten);
  });

  it('should leave OAI link unchanged when rest.baseUrl is missing', async () => {
    const oaiHtml = '<a href="/server/oai/request?verb=Identify">OAI</a>';
    const { fixture, component } = await setupTest(oaiHtml, undefined);

    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(component.htmlContent.value).toContain('/server/oai/request?verb=Identify');
  });

  it('should avoid double slashes when rest.baseUrl ends with slash', async () => {
    const oaiHtml = '<a href="/server/oai/request?verb=ListRecords">OAI</a>';
    const { fixture, component } = await setupTest(oaiHtml, 'https://api.example.org/server/');

    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(component.htmlContent.value).toContain('https://api.example.org/server/oai/request?verb=ListRecords');
    expect(component.htmlContent.value).not.toContain('//oai');
  });

  it('should include namespace in OAI link when rest.baseUrl has namespace prefix', async () => {
    const oaiHtml = '<a href="/server/oai/request?verb=ListMetadataFormats">full list</a>';
    const { fixture, component } = await setupTest(oaiHtml, 'https://api.example.org/repository/server');

    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const rewritten = 'https://api.example.org/repository/server/oai/request?verb=ListMetadataFormats';
    expect(component.htmlContent.value).toContain(rewritten);
    const anchor = fixture.nativeElement.querySelector('a');
    expect(anchor.getAttribute('href')).toBe(rewritten);
  });

  it('should leave content unchanged when no OAI link is present', async () => {
    const otherHtml = '<a href="/server/other">Other</a>';
    const { fixture, component } = await setupTest(otherHtml, 'https://api.example.org/server');

    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(component.htmlContent.value).toBe(otherHtml);
  });

  describe('contentState behavior', () => {
    it('should initialize contentState to "loading"', async () => {
      const { component } = await setupTest('<div>test</div>');
      expect(component.contentState).toBe('loading');
    });

    it('should set contentState to "found" when content loads successfully', async () => {
      const { component } = await setupTest('<div>Test Content</div>');
      await component.ngOnInit();
      expect(component.contentState).toBe('found');
    });

    it('should set contentState to "not-found" when content is undefined', async () => {
      const { component, responseService } = await setupTest(undefined);

      await component.ngOnInit();

      expect(component.contentState).toBe('not-found');
      expect(responseService.setNotFound).toHaveBeenCalled();
    });

    it('should keep loading state and not render 404 before content promise resolves', async () => {
      const deferred = createDeferred<string | undefined>();
      const { fixture, component } = await setupTest(undefined, undefined, deferred.promise);

      const initPromise = component.ngOnInit();
      fixture.detectChanges();

      expect(component.contentState).toBe('loading');
      expect(component.htmlContent.value).toBe('');
      expect(fixture.nativeElement.querySelector('.page-not-found')).toBeNull();

      deferred.resolve('<div>Loaded later</div>');
      await initPromise;
      fixture.detectChanges();

      expect(component.contentState).toBe('found');
      expect(fixture.nativeElement.querySelector('.page-not-found')).toBeNull();
    });

    it('should reset stale not-found state to loading on init', async () => {
      const deferred = createDeferred<string | undefined>();
      const { component } = await setupTest(undefined, undefined, deferred.promise);

      component.contentState = 'not-found';
      component.htmlContent.next('<div>stale</div>');

      const initPromise = component.ngOnInit();

      expect(component.contentState).toBe('loading');
      expect(component.htmlContent.value).toBe('');

      deferred.resolve('<div>fresh</div>');
      await initPromise;

      expect(component.contentState).toBe('found');
    });
  });

  describe('change detection', () => {
    it('should call changeDetector.detectChanges() after successful content load', async () => {
      const { component } = await setupTest('<div>test</div>');
      spyOn((component as any).changeDetector, 'detectChanges');

      await component.ngOnInit();

      expect((component as any).changeDetector.detectChanges).toHaveBeenCalled();
    });

    it('should call changeDetector.detectChanges() when content not found', async () => {
      const { component } = await setupTest(undefined);

      spyOn((component as any).changeDetector, 'detectChanges');

      await component.ngOnInit();

      expect((component as any).changeDetector.detectChanges).toHaveBeenCalled();
    });
  });
});
