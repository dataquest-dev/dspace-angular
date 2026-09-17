import {
  ComponentFixture,
  TestBed,
} from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { of } from 'rxjs';

import { AuthService } from '../core/auth/auth.service';
import { LocaleService } from '../core/locale/locale.service';
import { HALEndpointService } from '../core/shared/hal-endpoint.service';
import { EPersonMock } from '../shared/testing/eperson.mock';
import { ClarinNavbarTopComponent } from './clarin-navbar-top.component';
import { ScriptLoaderService } from './script-loader-service';

describe('ClarinNavbarTopComponent', () => {
  let component: ClarinNavbarTopComponent;
  let fixture: ComponentFixture<ClarinNavbarTopComponent>;

  let authService: AuthService;
  let scriptLoader: jasmine.SpyObj<ScriptLoaderService>;
  let halService: HALEndpointService;
  let localeService: jasmine.SpyObj<LocaleService>;

  const ROOT_HREF = 'http://localhost:8080/server/api';

  async function createComponent(authenticated: boolean, scriptsLoad: Promise<any>) {
    authService = jasmine.createSpyObj('authService', {
      isAuthenticated: of(authenticated),
      getAuthenticatedUserFromStore: of(EPersonMock),
    });
    scriptLoader = jasmine.createSpyObj('scriptLoaderService', { load: scriptsLoad });
    halService = jasmine.createSpyObj('halEndpointService', { getRootHref: ROOT_HREF });
    localeService = jasmine.createSpyObj('localeService', ['setCurrentLanguageCode', 'refreshAfterChangeLanguage']);

    await TestBed.configureTestingModule({
      imports: [
        ClarinNavbarTopComponent,
        TranslateModule.forRoot(),
      ],
      providers: [
        { provide: AuthService, useValue: authService },
        { provide: HALEndpointService, useValue: halService },
        { provide: LocaleService, useValue: localeService },
        provideRouter([]),
      ],
    })
      .overrideComponent(ClarinNavbarTopComponent, {
        set: { providers: [{ provide: ScriptLoaderService, useValue: scriptLoader }] },
      })
      .compileComponents();

    fixture = TestBed.createComponent(ClarinNavbarTopComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  it('should create', async () => {
    await createComponent(false, Promise.resolve());

    expect(component).toBeTruthy();
  });

  it('should load authenticated user', async () => {
    await createComponent(true, Promise.resolve());

    expect(component.authenticatedUser).toEqual(EPersonMock);
  });

  it('should leave the authenticated user unset for an anonymous visitor', async () => {
    await createComponent(false, Promise.resolve());

    expect(component.authenticatedUser).toBeNull();
  });

  it('should publish the repository path the DiscoJuice script reads', async () => {
    await createComponent(false, Promise.resolve());

    expect(component.repositoryPath).toEqual(ROOT_HREF);
    expect(fixture.debugElement.query(By.css('#repository_path')).nativeElement.getAttribute('href'))
      .toEqual(ROOT_HREF);
  });

  it('should keep the sign-on link unclickable until the AAI scripts are bound', async () => {
    let releaseScripts: () => void;
    await createComponent(false, new Promise<void>(resolve => releaseScripts = resolve));

    const signOn = fixture.debugElement.query(By.css('#clarin-signon-discojuice'));
    expect(component.scriptsReady).toBeFalse();
    expect(signOn.nativeElement.style.pointerEvents).toEqual('none');

    releaseScripts();
    // the component chains Promise.all -> loadAAIConfig -> scriptsReady, so let every
    // microtask in that chain settle before asserting
    await new Promise(resolve => setTimeout(resolve, 0));
    fixture.detectChanges();

    expect(component.scriptsReady).toBeTrue();
    expect(signOn.nativeElement.style.pointerEvents).toEqual('');
  });

  it('should change the language through the locale service', async () => {
    await createComponent(false, Promise.resolve());

    component.setLanguage('cs');

    expect(localeService.setCurrentLanguageCode).toHaveBeenCalledWith('cs');
    expect(localeService.refreshAfterChangeLanguage).toHaveBeenCalled();
  });
});
