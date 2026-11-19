import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { AuthService } from '../../core/auth/auth.service';
import { FileService } from '../../core/shared/file.service';
import { EMPTY, of as observableOf, Subject, throwError } from 'rxjs';
import { Bitstream } from '../../core/shared/bitstream.model';
import { BitstreamDownloadPageComponent } from './bitstream-download-page.component';
import { AuthorizationDataService } from '../../core/data/feature-authorization/authorization-data.service';
import { HardRedirectService } from '../../core/services/hard-redirect.service';
import { createSuccessfulRemoteDataObject } from '../../shared/remote-data.utils';
import { ActivatedRoute, Router } from '@angular/router';
import { getForbiddenRoute } from '../../app-routing-paths';
import { TranslateModule } from '@ngx-translate/core';
import { CommonModule } from '@angular/common';
import { SignpostingDataService } from '../../core/data/signposting-data.service';
import { ServerResponseService } from '../../core/services/server-response.service';
import { PLATFORM_ID } from '@angular/core';

describe('BitstreamDownloadPageComponent', () => {
  let component: BitstreamDownloadPageComponent;
  let fixture: ComponentFixture<BitstreamDownloadPageComponent>;

  let authService: AuthService;
  let fileService: FileService;
  let authorizationService: AuthorizationDataService;
  let hardRedirectService: HardRedirectService;
  let activatedRoute;
  let router;

  let bitstream: Bitstream;
  let serverResponseService: jasmine.SpyObj<ServerResponseService>;
  let signpostingDataService: jasmine.SpyObj<SignpostingDataService>;

  const mocklink = {
    href: 'http://test.org',
    rel: 'test',
    type: 'test'
  };

  const mocklink2 = {
    href: 'http://test2.org',
    rel: 'test',
    type: 'test'
  };

  function init() {
    authService = jasmine.createSpyObj('authService', {
      isAuthenticated: observableOf(true),
      setRedirectUrl: {}
    });
    authorizationService = jasmine.createSpyObj('authorizationSerivice', {
      isAuthorized: observableOf(true)
    });

    fileService = jasmine.createSpyObj('fileService', {
      retrieveFileDownloadLink: observableOf('content-url-with-headers')
    });

    hardRedirectService = jasmine.createSpyObj('fileService', {
      redirect: {}
    });
    bitstream = Object.assign(new Bitstream(), {
      uuid: 'bitstreamUuid',
      _links: {
        content: { href: 'bitstream-content-link' },
        self: { href: 'bitstream-self-link' },
      }
    });

    activatedRoute = {
      data: observableOf({
        bitstream: createSuccessfulRemoteDataObject(
          bitstream
        )
      }),
      params: observableOf({
        id: 'testid'
      })
    };

    router = jasmine.createSpyObj('router', ['navigateByUrl']);

    serverResponseService = jasmine.createSpyObj('ServerResponseService', {
      setHeader: jasmine.createSpy('setHeader'),
    });

    signpostingDataService = jasmine.createSpyObj('SignpostingDataService', {
      getLinks: observableOf([mocklink, mocklink2])
    });
  }

  function initTestbed() {
    TestBed.configureTestingModule({
      imports: [CommonModule, TranslateModule.forRoot()],
      declarations: [BitstreamDownloadPageComponent],
      providers: [
        { provide: ActivatedRoute, useValue: activatedRoute },
        { provide: Router, useValue: router },
        { provide: AuthorizationDataService, useValue: authorizationService },
        { provide: AuthService, useValue: authService },
        { provide: FileService, useValue: fileService },
        { provide: HardRedirectService, useValue: hardRedirectService },
        { provide: ServerResponseService, useValue: serverResponseService },
        { provide: SignpostingDataService, useValue: signpostingDataService },
        { provide: PLATFORM_ID, useValue: 'server' }
      ]
    })
      .compileComponents();
  }

  describe('init', () => {
    beforeEach(waitForAsync(() => {
      init();
      initTestbed();
    }));
    beforeEach(() => {
      fixture = TestBed.createComponent(BitstreamDownloadPageComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();
    });
    it('should init the comp', () => {
      expect(component).toBeTruthy();
    });
  });

  describe('bitstream retrieval', () => {
    describe('when the user is authorized and not logged in', () => {
      beforeEach(waitForAsync(() => {
        init();
        (authService.isAuthenticated as jasmine.Spy).and.returnValue(observableOf(false));

        initTestbed();
      }));
      beforeEach(() => {
        fixture = TestBed.createComponent(BitstreamDownloadPageComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
      });
      it('should redirect to the content link', () => {
        expect(hardRedirectService.redirect).toHaveBeenCalledWith('bitstream-content-link');
      });
      it('should add the signposting links', () => {
        expect(serverResponseService.setHeader).toHaveBeenCalled();
      });
    });
    describe('when the user is authorized and logged in', () => {
      beforeEach(waitForAsync(() => {
        init();
        initTestbed();
      }));
      beforeEach(() => {
        fixture = TestBed.createComponent(BitstreamDownloadPageComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
      });
      it('should redirect to an updated content link', () => {
        expect(hardRedirectService.redirect).toHaveBeenCalledWith('content-url-with-headers');
      });
    });
    describe('when the user is not authorized and logged in', () => {
      beforeEach(waitForAsync(() => {
        init();
        (authorizationService.isAuthorized as jasmine.Spy).and.returnValue(observableOf(false));
        initTestbed();
      }));
      beforeEach(() => {
        fixture = TestBed.createComponent(BitstreamDownloadPageComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
      });
      it('should navigate to the forbidden route', () => {
        expect(router.navigateByUrl).toHaveBeenCalledWith(getForbiddenRoute(), { skipLocationChange: true });
      });
    });
    describe('when the user is not authorized and not logged in', () => {
      beforeEach(waitForAsync(() => {
        init();
        (authService.isAuthenticated as jasmine.Spy).and.returnValue(observableOf(false));
        (authorizationService.isAuthorized as jasmine.Spy).and.returnValue(observableOf(false));
        initTestbed();
      }));
      beforeEach(() => {
        fixture = TestBed.createComponent(BitstreamDownloadPageComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
      });
      it('should navigate to the login page', () => {
        expect(authService.setRedirectUrl).toHaveBeenCalled();
        expect(router.navigateByUrl).toHaveBeenCalledWith('login');
      });
    });
  });
  describe('when signposting responds after download authorization', () => {
    let links$: Subject<any[]>;

    beforeEach(waitForAsync(() => {
      init();
      links$ = new Subject();
      signpostingDataService.getLinks.and.returnValue(links$);
      initTestbed();
    }));

    beforeEach(() => {
      fixture = TestBed.createComponent(BitstreamDownloadPageComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();
    });

    it('should not wait for optional signposting before redirecting', () => {
      expect(hardRedirectService.redirect).toHaveBeenCalledWith('content-url-with-headers');
    });

    it('should cancel pending optional signposting at the redirect decision', () => {
      expect(links$.observers.length).toBe(0);
    });

    it('should ignore signposting that arrives after redirecting', () => {
      links$.next([mocklink]);
      expect(serverResponseService.setHeader).not.toHaveBeenCalled();
      expect(hardRedirectService.redirect).toHaveBeenCalledTimes(1);
    });

    it('should redirect without a Link header if signposting is empty or malformed', () => {
      links$.next(null);
      expect(serverResponseService.setHeader).not.toHaveBeenCalled();
      expect(hardRedirectService.redirect).toHaveBeenCalledWith('content-url-with-headers');
    });

    it('should ignore optional signposting errors after redirecting', () => {
      const warning = spyOn(console, 'warn');
      links$.error(new Error('signposting unavailable'));
      expect(serverResponseService.setHeader).not.toHaveBeenCalled();
      expect(hardRedirectService.redirect).toHaveBeenCalledWith('content-url-with-headers');
      expect(warning).not.toHaveBeenCalled();
    });

    it('should request download authorization while signposting is pending', () => {
      expect(authorizationService.isAuthorized).toHaveBeenCalled();
      expect(fileService.retrieveFileDownloadLink).toHaveBeenCalled();
      expect(hardRedirectService.redirect).toHaveBeenCalled();
    });

  });

  [
    { name: 'malformed', response: () => observableOf(null), warns: false },
    { name: 'failed', response: () => throwError(() => new Error('optional metadata failed')), warns: true },
    { name: 'empty', response: () => EMPTY, warns: false },
    { name: 'a null link entry', response: () => observableOf([null]), warns: true },
    { name: 'an invalid header', response: () => observableOf([mocklink]), warns: true },
  ].forEach(scenario => {
    describe(`when optional signposting is ${scenario.name} before authorization completes`, () => {
      beforeEach(waitForAsync(() => {
        init();
        signpostingDataService.getLinks.and.returnValue(scenario.response());
        initTestbed();
      }));

      it('should omit Link and still redirect', () => {
        const warning = spyOn(console, 'warn');
        if (scenario.name === 'an invalid header') {
          serverResponseService.setHeader.and.throwError('Invalid character in header content');
        }
        fixture = TestBed.createComponent(BitstreamDownloadPageComponent);
        fixture.detectChanges();
        expect(serverResponseService.setHeader.calls.count()).toBe(scenario.name === 'an invalid header' ? 1 : 0);
        expect(hardRedirectService.redirect).toHaveBeenCalledWith('content-url-with-headers');
        expect(warning.calls.count()).toBe(scenario.warns ? 1 : 0);
      });
    });
  });

  describe('when destroyed before download authorization completes', () => {
    let authorization$: Subject<boolean>;
    let links$: Subject<any[]>;

    beforeEach(waitForAsync(() => {
      init();
      authorization$ = new Subject();
      links$ = new Subject();
      (authorizationService.isAuthorized as jasmine.Spy).and.returnValue(authorization$);
      signpostingDataService.getLinks.and.returnValue(links$);
      initTestbed();
    }));

    it('should unsubscribe pending metadata and authorization without late side effects', () => {
      fixture = TestBed.createComponent(BitstreamDownloadPageComponent);
      fixture.detectChanges();
      fixture.destroy();
      authorization$.next(true);
      links$.next([mocklink]);
      expect(authorization$.observers.length).toBe(0);
      expect(links$.observers.length).toBe(0);
      expect(serverResponseService.setHeader).not.toHaveBeenCalled();
      expect(hardRedirectService.redirect).not.toHaveBeenCalled();
    });
  });

});
