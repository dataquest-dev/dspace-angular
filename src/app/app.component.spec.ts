import { Store, StoreModule } from '@ngrx/store';
import { ComponentFixture, discardPeriodicTasks, fakeAsync, inject, TestBed, tick, waitForAsync } from '@angular/core/testing';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { BehaviorSubject } from 'rxjs';

// Load the implementations that should be tested
import { AppComponent } from './app.component';
import { HostWindowState } from './shared/search/host-window.reducer';
import { HostWindowResizeAction } from './shared/host-window.actions';
import { MetadataService } from './core/metadata/metadata.service';

import { NativeWindowRef, NativeWindowService } from './core/services/window.service';
import { TranslateLoaderMock } from './shared/mocks/translate-loader.mock';
import { MetadataServiceMock } from './shared/mocks/metadata-service.mock';
import { AngularticsProviderMock } from './shared/mocks/angulartics-provider.service.mock';
import { AuthServiceMock } from './shared/mocks/auth.service.mock';
import { AuthService } from './core/auth/auth.service';
import { MenuService } from './shared/menu/menu.service';
import { CSSVariableService } from './shared/sass-helper/css-variable.service';
import { CSSVariableServiceStub } from './shared/testing/css-variable-service.stub';
import { MenuServiceStub } from './shared/testing/menu-service.stub';
import { HostWindowService } from './shared/host-window.service';
import { HostWindowServiceStub } from './shared/testing/host-window-service.stub';
import { RouteService } from './core/services/route.service';
import { MockActivatedRoute } from './shared/mocks/active-router.mock';
import { RouterMock } from './shared/mocks/router.mock';
import { Angulartics2DSpace } from './statistics/angulartics/dspace-provider';
import { storeModuleConfig } from './app.reducer';
import { LocaleService } from './core/locale/locale.service';
import { authReducer } from './core/auth/auth.reducer';
import { MockStore, provideMockStore } from '@ngrx/store/testing';
import { ThemeService } from './shared/theme-support/theme.service';
import { getMockThemeService } from './shared/mocks/theme-service.mock';
import { BreadcrumbsService } from './breadcrumbs/breadcrumbs.service';
import { APP_CONFIG } from '../config/app-config.interface';
import { environment } from '../environments/environment';

let comp: AppComponent;
let fixture: ComponentFixture<AppComponent>;
const menuService = new MenuServiceStub();
const initialState = {
  core: { auth: { loading: false, blocking: false } }
};

export function getMockLocaleService(): LocaleService {
  return jasmine.createSpyObj('LocaleService', {
    setCurrentLanguageCode: jasmine.createSpy('setCurrentLanguageCode')
  });
}

describe('App component', () => {

  let breadcrumbsServiceSpy;

  const getDefaultTestBedConf = () => {
    breadcrumbsServiceSpy = jasmine.createSpyObj(['listenForRouteChanges']);

    return {
      imports: [
        CommonModule,
        StoreModule.forRoot(authReducer, storeModuleConfig),
        TranslateModule.forRoot({
          loader: {
            provide: TranslateLoader,
            useClass: TranslateLoaderMock
          }
        }),
      ],
      declarations: [AppComponent], // declare the test component
      providers: [
        { provide: NativeWindowService, useValue: new NativeWindowRef() },
        { provide: MetadataService, useValue: new MetadataServiceMock() },
        { provide: Angulartics2DSpace, useValue: new AngularticsProviderMock() },
        { provide: AuthService, useValue: new AuthServiceMock() },
        { provide: Router, useValue: new RouterMock() },
        { provide: ActivatedRoute, useValue: new MockActivatedRoute() },
        { provide: MenuService, useValue: menuService },
        { provide: CSSVariableService, useClass: CSSVariableServiceStub },
        { provide: HostWindowService, useValue: new HostWindowServiceStub(800) },
        { provide: LocaleService, useValue: getMockLocaleService() },
        { provide: ThemeService, useValue: getMockThemeService() },
        { provide: BreadcrumbsService, useValue: breadcrumbsServiceSpy },
        { provide: APP_CONFIG, useValue: environment },
        provideMockStore({ initialState }),
        AppComponent,
        RouteService
      ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA]
    };
  };

  // waitForAsync beforeEach
  beforeEach(waitForAsync(() => {
    return TestBed.configureTestingModule(getDefaultTestBedConf());
  }));

  // synchronous beforeEach
  beforeEach(() => {
    fixture = TestBed.createComponent(AppComponent);
    comp = fixture.componentInstance; // component test instance
    fixture.detectChanges();
  });

  it('should create component', inject([AppComponent], (app: AppComponent) => {
    // Perform test using fixture and service
    expect(app).toBeTruthy();
  }));

  describe('when the window is resized', () => {
    let width: number;
    let height: number;
    let store: Store<HostWindowState>;

    beforeEach(() => {
      store = fixture.debugElement.injector.get(Store) as Store<HostWindowState>;
      spyOn(store, 'dispatch');

      window.dispatchEvent(new Event('resize'));
      width = window.innerWidth;
      height = window.innerHeight;
    });

    it('should dispatch a HostWindowResizeAction with the width and height of the window as its payload', () => {
      expect(store.dispatch).toHaveBeenCalledWith(new HostWindowResizeAction(width, height));
    });

  });

  describe('removeSsrOverlayWhenContentVisible', () => {
    // The inline bootstrap script in src/index.html injects window.__dspaceRemoveSsrOverlay.
    // Once auth blocking and theme loading are both false, AppComponent waits for the <ds-app> DOM
    // to settle (no element added/removed for the quiet window) and only then removes the overlay.
    let mockStore: MockStore;
    let themeLoading$: BehaviorSubject<boolean>;
    let themeService: ThemeService;
    let originalRaF: typeof window.requestAnimationFrame;
    let dsAppEl: HTMLElement;

    beforeEach(() => {
      mockStore = TestBed.inject(MockStore);
      themeService = TestBed.inject(ThemeService);
      themeLoading$ = new BehaviorSubject<boolean>(true);
      (themeService as any).isThemeLoading$ = themeLoading$.asObservable();
      mockStore.setState({ core: { auth: { loading: false, blocking: true } } });

      // A settled <ds-app> with real content present, so the DOM-settle watcher can resolve.
      dsAppEl = document.createElement('ds-app');
      dsAppEl.setAttribute('style', 'display:block;height:800px');
      dsAppEl.innerHTML = '<main id="main-content" style="display:block;height:800px">home content</main>';
      document.body.appendChild(dsAppEl);

      // Force rAF to a synchronous shim so assertions are deterministic.
      originalRaF = window.requestAnimationFrame;
      (window as any).requestAnimationFrame = (cb: FrameRequestCallback) => {
        cb(0);
        return 0 as any;
      };
    });

    afterEach(() => {
      (window as any).requestAnimationFrame = originalRaF;
      delete (window as any).__dspaceRemoveSsrOverlay;
      if (dsAppEl && dsAppEl.parentNode) { dsAppEl.parentNode.removeChild(dsAppEl); }
    });

    it('removes the overlay once auth/theme are ready AND the DOM has settled', fakeAsync(() => {
      const spy = jasmine.createSpy('__dspaceRemoveSsrOverlay');
      window.__dspaceRemoveSsrOverlay = spy;

      // Re-construct so constructor-time subscription picks up our patched streams + global.
      const f = TestBed.createComponent(AppComponent);
      f.detectChanges();

      expect(spy).not.toHaveBeenCalled();

      mockStore.setState({ core: { auth: { loading: false, blocking: false } } });
      themeLoading$.next(false);

      // Not removed at the gate: the DOM-settle quiet window must elapse first.
      expect(spy).not.toHaveBeenCalled();
      tick(700); // > SETTLE_QUIET_MS
      expect(spy).toHaveBeenCalledTimes(1);

      discardPeriodicTasks();
    }));

    it('is a no-op when the global is not injected (e.g. CSR-only route, SSR skipped)', fakeAsync(() => {
      // Global intentionally absent; constructor should not throw and should not break later.
      delete (window as any).__dspaceRemoveSsrOverlay;

      const f = TestBed.createComponent(AppComponent);
      expect(() => f.detectChanges()).not.toThrow();

      mockStore.setState({ core: { auth: { loading: false, blocking: false } } });
      themeLoading$.next(false);
      tick(700);

      expect(window.__dspaceRemoveSsrOverlay).toBeUndefined();
      discardPeriodicTasks();
    }));
  });
});
