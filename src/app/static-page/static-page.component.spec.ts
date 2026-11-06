import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StaticPageComponent } from './static-page.component';
import { HtmlContentService } from '../shared/html-content.service';
import { Router } from '@angular/router';
import { RouterMock } from '../shared/mocks/router.mock';
import { TranslateModule } from '@ngx-translate/core';
import { Observable, of, throwError } from 'rxjs';
import { APP_CONFIG } from '../../config/app-config.interface';
import { environment } from '../../environments/environment';
import { ClarinSafeHtmlPipe } from '../shared/utils/clarin-safehtml.pipe';
import { ServerResponseService } from '../core/services/server-response.service';
import { ConfigurationDataService } from '../core/data/configuration-data.service';
import { ConfigurationProperty } from '../core/shared/configuration-property.model';
import { RemoteData } from '../core/data/remote-data';
import { createFailedRemoteDataObject$, createSuccessfulRemoteDataObject$ } from '../shared/remote-data.utils';

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
    configProperties: { [name: string]: string[] } = {}
  ) {
    const htmlContentService = jasmine.createSpyObj('htmlContentService', {
      fetchHtmlContent: of(html),
      getHmtlContentByPathAndLocale: contentPromise ?? Promise.resolve(html)
    });

    // Unknown properties fail with 404, like a property the backend doesn't expose
    const configurationService = jasmine.createSpyObj('configurationService', ['findByPropertyName']);
    configurationService.findByPropertyName.and.callFake((name: string): Observable<RemoteData<ConfigurationProperty>> =>
      Object.prototype.hasOwnProperty.call(configProperties, name)
        ? createSuccessfulRemoteDataObject$(Object.assign(new ConfigurationProperty(), { name, values: configProperties[name] }))
        : createFailedRemoteDataObject$('No such configuration property', 404)
    );

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
        { provide: ConfigurationDataService, useValue: configurationService },
        { provide: APP_CONFIG, useValue: appConfig }
      ]
    }).compileComponents();

    const fixture = TestBed.createComponent(StaticPageComponent);
    const component = fixture.componentInstance;
    return { fixture, component, htmlContentService, responseService, configurationService };
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
    const allPlaceholdersHtml = '<p>Welcome to ${dspace.name}, provided by ${description.institution}, ' +
      'located at ${description.location}.</p><p>Laws of ${description.country}, court of ${description.city}.</p>';
    const allProperties = {
      'dspace.name': ['Test Repository'],
      'description.institution': ['Test Institute'],
      'description.location': ['Test Street 1', '100 00 Test City'],
      'description.city': ['Test City'],
      'description.country': ['Test Country'],
    };

    function setupInterpolationTest(html: string, configProperties: { [name: string]: string[] } = {}, restBase?: string) {
      return setupTest(html, restBase, undefined, '/static/test-file.html', configProperties);
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

    it('should replace all placeholders with backend configuration properties', async () => {
      const { fixture, component } = await setupInterpolationTest(allPlaceholdersHtml, allProperties);
      await render(fixture);

      expect(component.htmlContent.value).toBe('<p>Welcome to Test Repository, provided by Test Institute, ' +
        'located at Test Street 1, 100 00 Test City.</p><p>Laws of Test Country, court of Test City.</p>');
      expect(warnSpy).not.toHaveBeenCalled();
    });

    it('should join a value the backend split on commas', async () => {
      // How the backend returns `dspace.name = A (B), C, D`
      const { fixture, component } = await setupInterpolationTest('<p>${dspace.name}</p>', {
        'dspace.name': ['LINDAT/CLARIAH-CZ digital library at the Institute of Formal and Applied Linguistics (ÚFAL)',
          'Faculty of Mathematics and Physics', 'Charles University'],
      });
      await render(fixture);

      expect(component.htmlContent.value).toBe('<p>LINDAT/CLARIAH-CZ digital library at the Institute of Formal and Applied ' +
        'Linguistics (ÚFAL), Faculty of Mathematics and Physics, Charles University</p>');
    });

    it('should request each property once', async () => {
      const { fixture, configurationService } = await setupInterpolationTest('<p>${dspace.name} ${dspace.name} ${description.city}</p>', allProperties);
      await render(fixture);

      expect(configurationService.findByPropertyName).toHaveBeenCalledTimes(2);
      expect(configurationService.findByPropertyName).toHaveBeenCalledWith('dspace.name');
      expect(configurationService.findByPropertyName).toHaveBeenCalledWith('description.city');
    });

    it('should not request any property when the page has no placeholders', async () => {
      const html = '<p>No placeholders here</p>';
      const { fixture, component, configurationService } = await setupInterpolationTest(html, allProperties);
      await render(fixture);

      expect(component.htmlContent.value).toBe(html);
      expect(configurationService.findByPropertyName).not.toHaveBeenCalled();
      expect(warnSpy).not.toHaveBeenCalled();
    });

    it('should leave an unknown or unexposed placeholder literal and warn once', async () => {
      const { fixture, component } = await setupInterpolationTest('<p>${dspace.name} ${foo.bar}</p>', allProperties);
      await render(fixture);

      expect(component.htmlContent.value).toBe('<p>Test Repository ${foo.bar}</p>');
      expect(warnSpy).toHaveBeenCalledOnceWith('Static page: unresolved variables', ['foo.bar']);
    });

    it('should treat an empty value as missing', async () => {
      const { fixture, component } = await setupInterpolationTest('<p>${dspace.name} ${description.city}</p>',
        { 'dspace.name': [''], 'description.city': [] });
      await render(fixture);

      expect(component.htmlContent.value).toBe('<p>${dspace.name} ${description.city}</p>');
      expect(warnSpy).toHaveBeenCalledOnceWith('Static page: unresolved variables', ['dspace.name', 'description.city']);
    });

    it('should still show the page when a property request errors', async () => {
      const { fixture, component, configurationService, responseService } = await setupInterpolationTest('<p>${dspace.name}</p>');
      configurationService.findByPropertyName.and.returnValue(throwError(() => new Error('backend down')));
      await render(fixture);

      expect(component.contentState).toBe('found');
      expect(component.htmlContent.value).toBe('<p>${dspace.name}</p>');
      expect(responseService.setNotFound).not.toHaveBeenCalled();
      expect(warnSpy).toHaveBeenCalledOnceWith('Static page: unresolved variables', ['dspace.name']);
    });

    it('should HTML-escape values', async () => {
      const { fixture, component } = await setupInterpolationTest('<p id="target">${dspace.name}</p>', { 'dspace.name': ['A & <b>B</b>'] });
      await render(fixture);

      expect(component.htmlContent.value).toBe('<p id="target">A &amp; &lt;b&gt;B&lt;/b&gt;</p>');
      const target = fixture.nativeElement.querySelector('#target');
      expect(target.querySelector('b')).toBeNull();
      expect(target.textContent).toBe('A & <b>B</b>');
    });

    it('should insert values containing replacement patterns literally', async () => {
      const { fixture, component } = await setupInterpolationTest(
        '<p id="target">${dspace.name}|${description.city}</p>',
        { 'dspace.name': ['a$&b'], 'description.city': ['c$1$`$\'d'] }
      );
      await render(fixture);

      expect(fixture.nativeElement.querySelector('#target').textContent).toBe('a$&b|c$1$`$\'d');
      expect(component.htmlContent.value).not.toContain('${');
    });

    it('should not touch other placeholder syntaxes', async () => {
      const html = '<p>$dspace.name {{\'x\' | translate}} $ {dspace.name}</p>';
      const { fixture, component, configurationService } = await setupInterpolationTest(html, allProperties);
      await render(fixture);

      expect(component.htmlContent.value).toBe(html);
      expect(configurationService.findByPropertyName).not.toHaveBeenCalled();
    });

    it('should apply both the OAI link rewrite and variable interpolation', async () => {
      const { fixture, component } = await setupInterpolationTest(
        '<a href="/server/oai/request?verb=Identify">${dspace.name}</a>',
        allProperties,
        'https://api.example.org/repository/server'
      );
      await render(fixture);

      expect(component.htmlContent.value)
        .toBe('<a href="https://api.example.org/repository/server/oai/request?verb=Identify">Test Repository</a>');
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
