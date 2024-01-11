import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { provideMockStore } from '@ngrx/store/testing';
<<<<<<< HEAD
import { Store, StoreModule } from '@ngrx/store';
import { TranslateModule } from '@ngx-translate/core';

import { EPerson } from '../../../../core/eperson/models/eperson.model';
import { EPersonMock } from '../../../testing/eperson.mock';
=======
import { StoreModule } from '@ngrx/store';
import { TranslateModule } from '@ngx-translate/core';
>>>>>>> dspace-7.6.1
import { authReducer } from '../../../../core/auth/auth.reducer';
import { AuthService } from '../../../../core/auth/auth.service';
import { AuthServiceStub } from '../../../testing/auth-service.stub';
import { storeModuleConfig } from '../../../../app.reducer';
import { AuthMethod } from '../../../../core/auth/models/auth.method';
import { AuthMethodType } from '../../../../core/auth/models/auth.method-type';
import { LogInExternalProviderComponent } from './log-in-external-provider.component';
import { NativeWindowService } from '../../../../core/services/window.service';
import { RouterStub } from '../../../testing/router.stub';
import { ActivatedRouteStub } from '../../../testing/active-router.stub';
import { NativeWindowMockFactory } from '../../../mocks/mock-native-window-ref';
import { HardRedirectService } from '../../../../core/services/hard-redirect.service';

describe('LogInExternalProviderComponent', () => {

  let component: LogInExternalProviderComponent;
  let fixture: ComponentFixture<LogInExternalProviderComponent>;
<<<<<<< HEAD
  let page: Page;
  let user: EPerson;
  let componentAsAny: any;
  let setHrefSpy;
  let orcidBaseUrl;
  let location;
=======
  let componentAsAny: any;
  let setHrefSpy;
  let orcidBaseUrl: string;
  let location: string;
>>>>>>> dspace-7.6.1
  let initialState: any;
  let hardRedirectService: HardRedirectService;

  beforeEach(() => {
<<<<<<< HEAD
    user = EPersonMock;
=======
>>>>>>> dspace-7.6.1
    orcidBaseUrl = 'dspace-rest.test/orcid?redirectUrl=';
    location = orcidBaseUrl + 'http://dspace-angular.test/home';

    hardRedirectService = jasmine.createSpyObj('hardRedirectService', {
      getCurrentRoute: {},
      redirect: {}
    });

    initialState = {
      core: {
        auth: {
          authenticated: false,
          loaded: false,
          blocking: false,
          loading: false,
          authMethods: []
        }
      }
    };
  });

  beforeEach(waitForAsync(() => {
    // refine the test module by declaring the test component
<<<<<<< HEAD
    TestBed.configureTestingModule({
=======
    void TestBed.configureTestingModule({
>>>>>>> dspace-7.6.1
      imports: [
        StoreModule.forRoot({ auth: authReducer }, storeModuleConfig),
        TranslateModule.forRoot()
      ],
      declarations: [
        LogInExternalProviderComponent
      ],
      providers: [
        { provide: AuthService, useClass: AuthServiceStub },
<<<<<<< HEAD
        { provide: 'authMethodProvider', useValue: new AuthMethod(AuthMethodType.Orcid, location) },
=======
        { provide: 'authMethodProvider', useValue: new AuthMethod(AuthMethodType.Orcid, 0, location) },
>>>>>>> dspace-7.6.1
        { provide: 'isStandalonePage', useValue: true },
        { provide: NativeWindowService, useFactory: NativeWindowMockFactory },
        { provide: Router, useValue: new RouterStub() },
        { provide: ActivatedRoute, useValue: new ActivatedRouteStub() },
        { provide: HardRedirectService, useValue: hardRedirectService },
        provideMockStore({ initialState }),
      ],
      schemas: [
        CUSTOM_ELEMENTS_SCHEMA
      ]
    })
      .compileComponents();

  }));

  beforeEach(() => {
    // create component and test fixture
    fixture = TestBed.createComponent(LogInExternalProviderComponent);

    // get test component from the fixture
    component = fixture.componentInstance;
    componentAsAny = component;

    // create page
<<<<<<< HEAD
    page = new Page(component, fixture);
=======
>>>>>>> dspace-7.6.1
    setHrefSpy = spyOnProperty(componentAsAny._window.nativeWindow.location, 'href', 'set').and.callThrough();

  });

  it('should set the properly a new redirectUrl', () => {
    const currentUrl = 'http://dspace-angular.test/collections/12345';
    componentAsAny._window.nativeWindow.location.href = currentUrl;

    fixture.detectChanges();

    expect(componentAsAny.injectedAuthMethodModel.location).toBe(location);
    expect(componentAsAny._window.nativeWindow.location.href).toBe(currentUrl);

    component.redirectToExternalProvider();

    expect(setHrefSpy).toHaveBeenCalledWith(currentUrl);

  });

  it('should not set a new redirectUrl', () => {
    const currentUrl = 'http://dspace-angular.test/home';
    componentAsAny._window.nativeWindow.location.href = currentUrl;

    fixture.detectChanges();

    expect(componentAsAny.injectedAuthMethodModel.location).toBe(location);
    expect(componentAsAny._window.nativeWindow.location.href).toBe(currentUrl);

    component.redirectToExternalProvider();

    expect(setHrefSpy).toHaveBeenCalledWith(currentUrl);

  });

});
<<<<<<< HEAD

/**
 * I represent the DOM elements and attach spies.
 *
 * @class Page
 */
class Page {

  public emailInput: HTMLInputElement;
  public navigateSpy: jasmine.Spy;
  public passwordInput: HTMLInputElement;

  constructor(private component: LogInExternalProviderComponent, private fixture: ComponentFixture<LogInExternalProviderComponent>) {
    // use injector to get services
    const injector = fixture.debugElement.injector;
    const store = injector.get(Store);

    // add spies
    this.navigateSpy = spyOn(store, 'dispatch');
  }

}
=======
>>>>>>> dspace-7.6.1
