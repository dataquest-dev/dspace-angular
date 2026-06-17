import { CommonModule } from '@angular/common';
import {
  ApplicationRef,
  CUSTOM_ELEMENTS_SCHEMA,
} from '@angular/core';
import {
  ComponentFixture,
  fakeAsync,
  flush,
  inject,
  TestBed,
  tick,
  waitForAsync,
} from '@angular/core/testing';
import {
  ActivatedRoute,
  Router,
} from '@angular/router';
import {
  Store,
  StoreModule,
} from '@ngrx/store';
import { provideMockStore } from '@ngrx/store/testing';
import {
  TranslateLoader,
  TranslateModule,
} from '@ngx-translate/core';
import { BehaviorSubject } from 'rxjs';

import { APP_CONFIG } from '../config/app-config.interface';
import { environment } from '../environments/environment';
// Load the implementations that should be tested
import { AppComponent } from './app.component';
import { storeModuleConfig } from './app.reducer';
import { BreadcrumbsService } from './breadcrumbs/breadcrumbs.service';
import { authReducer } from './core/auth/auth.reducer';
import { AuthService } from './core/auth/auth.service';
import { LocaleService } from './core/locale/locale.service';
import { HeadTagService } from './core/metadata/head-tag.service';
import { RouteService } from './core/services/route.service';
import {
  NativeWindowRef,
  NativeWindowService,
} from './core/services/window.service';
import { ThemedRootComponent } from './root/themed-root.component';
import { HostWindowResizeAction } from './shared/host-window.actions';
import { HostWindowService } from './shared/host-window.service';
import { MenuService } from './shared/menu/menu.service';
import { MockActivatedRoute } from './shared/mocks/active-router.mock';
import { AngularticsProviderMock } from './shared/mocks/angulartics-provider.service.mock';
import { AuthServiceMock } from './shared/mocks/auth.service.mock';
import { HeadTagServiceMock } from './shared/mocks/head-tag-service.mock';
import { RouterMock } from './shared/mocks/router.mock';
import { getMockThemeService } from './shared/mocks/theme-service.mock';
import { TranslateLoaderMock } from './shared/mocks/translate-loader.mock';
import { CSSVariableService } from './shared/sass-helper/css-variable.service';
import { HostWindowState } from './shared/search/host-window.reducer';
import { CSSVariableServiceStub } from './shared/testing/css-variable-service.stub';
import { HostWindowServiceStub } from './shared/testing/host-window-service.stub';
import { MenuServiceStub } from './shared/testing/menu-service.stub';
import { ThemeService } from './shared/theme-support/theme.service';
import { Angulartics2DSpace } from './statistics/angulartics/dspace-provider';

let comp: AppComponent;
let fixture: ComponentFixture<AppComponent>;
const menuService = new MenuServiceStub();
const initialState = {
  core: { auth: { loading: false } },
};

export function getMockLocaleService(): LocaleService {
  return jasmine.createSpyObj('LocaleService', {
    setCurrentLanguageCode: jasmine.createSpy('setCurrentLanguageCode'),
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
            useClass: TranslateLoaderMock,
          },
        }),
      ],
      providers: [
        { provide: NativeWindowService, useValue: new NativeWindowRef() },
        { provide: HeadTagService, useValue: new HeadTagServiceMock() },
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
        RouteService,
      ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    };
  };

  // waitForAsync beforeEach
  beforeEach(waitForAsync(() => {
    return TestBed.configureTestingModule(getDefaultTestBedConf()).overrideComponent(
      AppComponent, {
        remove: {
          imports: [ ThemedRootComponent ],
        },
      },
    );
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

  describe('removeSsrOverlayWhenStable', () => {
    // The inline bootstrap script in src/index.html injects window.__dspaceRemoveSsrOverlay
    // and AppComponent must call it exactly once when ApplicationRef.isStable first emits true.
    let appRef: ApplicationRef;
    let isStable$: BehaviorSubject<boolean>;
    let originalRaF: typeof window.requestAnimationFrame;

    beforeEach(() => {
      appRef = TestBed.inject(ApplicationRef);
      isStable$ = new BehaviorSubject<boolean>(false);
      // Patch isStable to our controllable subject for this test only
      Object.defineProperty(appRef, 'isStable', { value: isStable$.asObservable() });

      // Force rAF to a synchronous shim so we can flush() through the chain deterministically.
      originalRaF = window.requestAnimationFrame;
      (window as any).requestAnimationFrame = (cb: FrameRequestCallback) => {
        cb(0);
        return 0 as any;
      };
    });

    afterEach(() => {
      (window as any).requestAnimationFrame = originalRaF;
      delete (window as any).__dspaceRemoveSsrOverlay;
    });

    it('removes the overlay once isStable emits true', fakeAsync(() => {
      const spy = jasmine.createSpy('__dspaceRemoveSsrOverlay');
      window.__dspaceRemoveSsrOverlay = spy;

      // Re-construct so the constructor-time subscription picks up our patched isStable + global.
      const f = TestBed.createComponent(AppComponent);
      f.detectChanges();

      expect(spy).not.toHaveBeenCalled();

      isStable$.next(true);
      tick(50); // matches the 50ms pad after rAF in removeSsrOverlayWhenStable
      flush();

      expect(spy).toHaveBeenCalledTimes(1);
    }));

    it('is a no-op when the global is not injected (e.g. CSR-only route, SSR skipped)', fakeAsync(() => {
      // Global intentionally absent; constructor should not throw and should not break later.
      delete (window as any).__dspaceRemoveSsrOverlay;

      const f = TestBed.createComponent(AppComponent);
      expect(() => f.detectChanges()).not.toThrow();

      isStable$.next(true);
      tick(50);
      flush();

      expect(window.__dspaceRemoveSsrOverlay).toBeUndefined();
    }));
  });
});
