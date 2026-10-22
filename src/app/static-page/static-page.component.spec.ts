import { ComponentFixture, TestBed } from '@angular/core/testing';

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
import { StaticPageConfig } from '../../config/static-page-config.interface';

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
    route: string = '/static/test-file.html',
    staticPage?: StaticPageConfig
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
        nameSpace: '/testNamespace'
      },
      rest: {
        ...(environment as any).rest,
        baseUrl: restBase
      },
      staticPage
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

  function createLinkEvent(href: string, useNestedTarget = false): Event {
    const anchor = document.createElement('a');
    anchor.setAttribute('href', href);

    let target: EventTarget = anchor;
    if (useNestedTarget) {
      const nestedElement = document.createElement('span');
      anchor.appendChild(nestedElement);
      target = nestedElement;
    }

    return {
      target,
      preventDefault: jasmine.createSpy('preventDefault')
    } as unknown as Event;
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

  describe('variable interpolation', () => {
    const allPlaceholdersHtml = '<p>Welcome to ${dspace.name}, provided by ${lr.description.institution}, ' +
      'located at ${lr.description.location}.</p><p>Laws of ${lr.description.country}, court of ${lr.description.city}.</p>';
    const allVariables = {
      'dspace.name': 'Test Repository',
      'lr.description.institution': 'Test Institute',
      'lr.description.location': 'Test Street 1, 100 00 Test City',
      'lr.description.city': 'Test City',
      'lr.description.country': 'Test Country',
    };

    function setupInterpolationTest(html: string, variables?: { [key: string]: string }, restBase?: string) {
      const staticPage = variables === undefined ? undefined : { variables };
      return setupTest(html, restBase, undefined, '/static/test-file.html', staticPage);
    }

    async function render(fixture: ComponentFixture<StaticPageComponent>) {
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();
    }

    let warnSpy: jasmine.Spy;

    beforeEach(() => {
      warnSpy = spyOn(console, 'warn');
    });

    it('should replace all configured placeholders', async () => {
      const { fixture, component } = await setupInterpolationTest(allPlaceholdersHtml, allVariables);
      await render(fixture);

      const content = component.htmlContent.value;
      Object.values(allVariables).forEach((value) => expect(content).toContain(value));
      expect(content).not.toContain('${');
      expect(warnSpy).not.toHaveBeenCalled();
    });

    it('should leave an unknown placeholder literal and warn once', async () => {
      const { fixture, component } = await setupInterpolationTest('<p>${dspace.name} ${foo.bar}</p>', allVariables);
      await render(fixture);

      expect(component.htmlContent.value).toBe('<p>Test Repository ${foo.bar}</p>');
      expect(warnSpy).toHaveBeenCalledTimes(1);
      expect(warnSpy).toHaveBeenCalledWith('Static page: unresolved variables', ['foo.bar']);
    });

    it('should treat an empty string value as missing', async () => {
      const { fixture, component } = await setupInterpolationTest('<p>${dspace.name}</p>', { ...allVariables, 'dspace.name': '' });
      await render(fixture);

      expect(component.htmlContent.value).toBe('<p>${dspace.name}</p>');
      expect(warnSpy).toHaveBeenCalledOnceWith('Static page: unresolved variables', ['dspace.name']);
    });

    it('should treat a null value as missing', async () => {
      // A YAML key without a value (`dspace.name:`) is loaded as null
      const { fixture, component } = await setupInterpolationTest('<p>${dspace.name}</p>', { ...allVariables, 'dspace.name': null });
      await render(fixture);

      expect(component.htmlContent.value).toBe('<p>${dspace.name}</p>');
      expect(warnSpy).toHaveBeenCalledOnceWith('Static page: unresolved variables', ['dspace.name']);
    });

    it('should treat a non-string value as missing', async () => {
      // YAML can load a number, e.g. `dspace.name: 123`
      const { fixture, component } = await setupInterpolationTest('<p>${dspace.name}</p>', { ...allVariables, 'dspace.name': 123 } as any);
      await render(fixture);

      expect(component.htmlContent.value).toBe('<p>${dspace.name}</p>');
      expect(warnSpy).toHaveBeenCalledOnceWith('Static page: unresolved variables', ['dspace.name']);
    });

    it('should HTML-escape values', async () => {
      const { fixture, component } = await setupInterpolationTest('<p id="target">${dspace.name}</p>', { 'dspace.name': 'A & <b>B</b>' });
      await render(fixture);

      expect(component.htmlContent.value).toBe('<p id="target">A &amp; &lt;b&gt;B&lt;/b&gt;</p>');
      const target = fixture.nativeElement.querySelector('#target');
      expect(target.querySelector('b')).toBeNull();
      expect(target.textContent).toBe('A & <b>B</b>');
    });

    it('should insert values containing replacement patterns literally', async () => {
      const { fixture, component } = await setupInterpolationTest(
        '<p id="target">${dspace.name}|${lr.description.city}</p>',
        { 'dspace.name': 'a$&b', 'lr.description.city': 'c$1$`$\'d' }
      );
      await render(fixture);

      expect(fixture.nativeElement.querySelector('#target').textContent).toBe('a$&b|c$1$`$\'d');
      expect(component.htmlContent.value).not.toContain('${');
    });

    it('should leave content unchanged when staticPage config is missing', async () => {
      const { fixture, component } = await setupInterpolationTest(allPlaceholdersHtml, undefined);
      await render(fixture);

      expect(component.contentState).toBe('found');
      expect(component.htmlContent.value).toBe(allPlaceholdersHtml);
    });

    it('should leave all placeholders literal and warn once when the variables map is empty', async () => {
      const { fixture, component } = await setupInterpolationTest(allPlaceholdersHtml, {});
      await render(fixture);

      expect(component.htmlContent.value).toBe(allPlaceholdersHtml);
      expect(warnSpy).toHaveBeenCalledTimes(1);
      expect(warnSpy.calls.mostRecent().args[1]).toEqual(jasmine.arrayWithExactContents(Object.keys(allVariables)));
    });

    it('should not touch other placeholder syntaxes', async () => {
      const html = '<p>$dspace.name {{\'x\' | translate}} $ {dspace.name}</p>';
      const { fixture, component } = await setupInterpolationTest(html, allVariables);
      await render(fixture);

      expect(component.htmlContent.value).toBe(html);
      expect(warnSpy).not.toHaveBeenCalled();
    });

    it('should apply both the OAI link rewrite and variable interpolation', async () => {
      const { fixture, component } = await setupInterpolationTest(
        '<a href="/server/oai/request?verb=Identify">${dspace.name}</a>',
        allVariables,
        'https://api.example.org/repository/server'
      );
      await render(fixture);

      expect(component.htmlContent.value)
        .toBe('<a href="https://api.example.org/repository/server/oai/request?verb=Identify">Test Repository</a>');
    });

    it('should not resolve inherited object properties', async () => {
      const { fixture, component } = await setupInterpolationTest('<p>${toString} ${constructor}</p>', allVariables);
      await render(fixture);

      expect(component.htmlContent.value).toBe('<p>${toString} ${constructor}</p>');
      expect(warnSpy).toHaveBeenCalledOnceWith('Static page: unresolved variables', ['toString', 'constructor']);
    });
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

  describe('link handling', () => {
    it('should intercept and navigate dot-relative links under the static route', async () => {
      const { component } = await setupTest('<div>test</div>');
      const navigateTo = spyOn<any>(component, 'navigateTo');
      const event = createLinkEvent('./cite');

      component.processLinks(event);

      expect((event.preventDefault as jasmine.Spy)).toHaveBeenCalled();
      expect(navigateTo).toHaveBeenCalledWith(`${window.location.origin}/testNamespace/static/cite`);
    });

    it('should resolve nested relative-link clicks inside anchors', async () => {
      const { component } = await setupTest('<div>test</div>');
      const navigateTo = spyOn<any>(component, 'navigateTo');
      const event = createLinkEvent('../discover?query=test', true);

      component.processLinks(event);

      expect((event.preventDefault as jasmine.Spy)).toHaveBeenCalled();
      expect(navigateTo).toHaveBeenCalledWith(`${window.location.origin}/testNamespace/discover?query=test`);
    });

    it('should not intercept explicit app-route links', async () => {
      const { component } = await setupTest('<div>test</div>');
      const navigateTo = spyOn<any>(component, 'navigateTo');
      const event = createLinkEvent('contract');

      component.processLinks(event);

      expect((event.preventDefault as jasmine.Spy)).not.toHaveBeenCalled();
      expect(navigateTo).not.toHaveBeenCalled();
    });

    it('should not intercept fragment links', async () => {
      const { component } = await setupTest('<div>test</div>');
      const navigateTo = spyOn<any>(component, 'navigateTo');
      const event = createLinkEvent('#about-contracts');

      component.processLinks(event);

      expect((event.preventDefault as jasmine.Spy)).not.toHaveBeenCalled();
      expect(navigateTo).not.toHaveBeenCalled();
    });
  });
});
