import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { By } from '@angular/platform-browser';

import { provideMockStore } from '@ngrx/store/testing';
import { Store, StoreModule } from '@ngrx/store';
import { TranslateModule } from '@ngx-translate/core';

import { LogInPasswordComponent } from './log-in-password.component';
import { EPerson } from '../../../../core/eperson/models/eperson.model';
import { EPersonMock } from '../../../testing/eperson.mock';
import { authReducer } from '../../../../core/auth/auth.reducer';
import { AuthService } from '../../../../core/auth/auth.service';
import { storeModuleConfig } from '../../../../app.reducer';
import { AuthMethod } from '../../../../core/auth/models/auth.method';
import { AuthMethodType } from '../../../../core/auth/models/auth.method-type';
import { HardRedirectService } from '../../../../core/services/hard-redirect.service';
import { BrowserOnlyMockPipe } from '../../../testing/browser-only-mock.pipe';
import { of as observableOf } from 'rxjs';
import { ConfigurationDataService } from '../../../../core/data/configuration-data.service';
import { ActivatedRoute , Router} from '@angular/router';
import { RouterMock } from '../../../mocks/router.mock';
import { createSuccessfulRemoteDataObject$ } from '../../../remote-data.utils';
import { ConfigurationProperty } from '../../../../core/shared/configuration-property.model';

describe('LogInPasswordComponent', () => {
  const uiUrl = 'localhost:4000';
  const redirectUrl = '/items/someId';
  let component: LogInPasswordComponent;
  let fixture: ComponentFixture<LogInPasswordComponent>;
  let page: Page;
  let user: EPerson;
  let initialState: any;
  let hardRedirectService: HardRedirectService;
  let authService: any;
  let configurationDataService: ConfigurationDataService;

  beforeEach(() => {
    user = EPersonMock;

    hardRedirectService = jasmine.createSpyObj('hardRedirectService', {
      getCurrentRoute: {}
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

    authService = jasmine.createSpyObj('authService', {
      isAuthenticated: observableOf(true),
      setRedirectUrl: {},
      setRedirectUrlIfNotSet: {}
    });
    configurationDataService = jasmine.createSpyObj('configurationDataService', {
      findByPropertyName: createSuccessfulRemoteDataObject$(Object.assign(new ConfigurationProperty(), {
        name: 'dspace.ui.url',
        values: [
          uiUrl
        ]
      }))
    });

  });

  beforeEach(waitForAsync(() => {
    // refine the test module by declaring the test component
    TestBed.configureTestingModule({
      imports: [
        FormsModule,
        ReactiveFormsModule,
        StoreModule.forRoot({ auth: authReducer }, storeModuleConfig),
        TranslateModule.forRoot()
      ],
      declarations: [
        LogInPasswordComponent,
        BrowserOnlyMockPipe,
      ],
      providers: [
        { provide: AuthService, useValue: authService },
        { provide: 'authMethodProvider', useValue: new AuthMethod(AuthMethodType.Password) },
        { provide: 'isStandalonePage', useValue: true },
        { provide: HardRedirectService, useValue: hardRedirectService },
        { provide: ConfigurationDataService, useValue: configurationDataService },
        { provide: ActivatedRoute, useValue: {
            params: observableOf({}),
            data: observableOf({ metadata: 'title' }),
            snapshot: {
              queryParams: new Map([
                ['redirectUrl', redirectUrl],
              ])
            }
          } },
        { provide: Router, useValue: new RouterMock() },
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
    fixture = TestBed.createComponent(LogInPasswordComponent);

    // get test component from the fixture
    component = fixture.componentInstance;

    // create page
    page = new Page(component, fixture);

    // verify the fixture is stable (no pending tasks)
    fixture.whenStable().then(() => {
      page.addPageElements();
    });

  });

  it('should create a FormGroup comprised of FormControls', () => {
    fixture.detectChanges();
    expect(component.form instanceof FormGroup).toBe(true);
  });

  it('should authenticate', () => {
    fixture.detectChanges();

    // set FormControl values
    component.form.controls.email.setValue('user');
    component.form.controls.password.setValue('password');

    // submit form
    component.submit();

    // verify Store.dispatch() is invoked
    expect(page.navigateSpy.calls.any()).toBe(true, 'Store.dispatch not invoked');
  });

  it('should authenticate and redirect', waitForAsync(() => {
    fixture.detectChanges();

    // set FormControl values
    component.form.controls.email.setValue('user');
    component.form.controls.password.setValue('password');

    // verify the fixture is stable (no pending tasks)
    void fixture.whenStable().then(() => {
      component.redirectUrl = redirectUrl;
      component.baseUrl = uiUrl;
      // submit form
      component.submit();
      expect(authService.setRedirectUrl).toHaveBeenCalledWith(redirectUrl);
    });
  }));

});

/**
 * I represent the DOM elements and attach spies.
 *
 * @class Page
 */
class Page {

  public emailInput: HTMLInputElement;
  public navigateSpy: jasmine.Spy;
  public passwordInput: HTMLInputElement;

  constructor(private component: LogInPasswordComponent, private fixture: ComponentFixture<LogInPasswordComponent>) {
    // use injector to get services
    const injector = fixture.debugElement.injector;
    const store = injector.get(Store);

    // add spies
    this.navigateSpy = spyOn(store, 'dispatch');
  }

  public addPageElements() {
    const emailInputSelector = 'input[formcontrolname=\'email\']';
    this.emailInput = this.fixture.debugElement.query(By.css(emailInputSelector)).nativeElement;

    const passwordInputSelector = 'input[formcontrolname=\'password\']';
    this.passwordInput = this.fixture.debugElement.query(By.css(passwordInputSelector)).nativeElement;
  }
}
