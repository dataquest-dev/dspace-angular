import { CommonModule } from '@angular/common';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import {
  ComponentFixture,
  TestBed,
} from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { of } from 'rxjs';

import { AccessibilitySettingsService } from '../accessibility/accessibility-settings.service';
import { AccessibilitySettingsServiceStub } from '../accessibility/accessibility-settings.service.stub';
import { ThemedAdminSidebarComponent } from '../admin/admin-sidebar/themed-admin-sidebar.component';
import { ThemedBreadcrumbsComponent } from '../breadcrumbs/themed-breadcrumbs.component';
import { ThemedFooterComponent } from '../footer/themed-footer.component';
import { ThemedHeaderNavbarWrapperComponent } from '../header-nav-wrapper/themed-header-navbar-wrapper.component';
import { HostWindowService } from '../shared/host-window.service';
import { ThemedLoadingComponent } from '../shared/loading/themed-loading.component';
import { MenuService } from '../shared/menu/menu.service';
import { RouterMock } from '../shared/mocks/router.mock';
import { NotificationsBoardComponent } from '../shared/notifications/notifications-board/notifications-board.component';
import { CSSVariableService } from '../shared/sass-helper/css-variable.service';
import { CSSVariableServiceStub } from '../shared/testing/css-variable-service.stub';
import { HostWindowServiceStub } from '../shared/testing/host-window-service.stub';
import { MenuServiceStub } from '../shared/testing/menu-service.stub';
import { SystemWideAlertBannerComponent } from '../system-wide-alert/alert-banner/system-wide-alert-banner.component';
import { RootComponent } from './root.component';

describe('RootComponent', () => {
  let component: RootComponent;
  let fixture: ComponentFixture<RootComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        CommonModule,
        NoopAnimationsModule,
        TranslateModule.forRoot(),
        RootComponent,
      ],
      providers: [
        { provide: Router, useValue: new RouterMock() },
        { provide: MenuService, useValue: new MenuServiceStub() },
        { provide: CSSVariableService, useClass: CSSVariableServiceStub },
        { provide: HostWindowService, useValue: new HostWindowServiceStub(800) },
        { provide: AccessibilitySettingsService, useValue: new AccessibilitySettingsServiceStub() },
      ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    })
      .overrideComponent(RootComponent, {
        remove: {
          imports: [
            ThemedAdminSidebarComponent,
            SystemWideAlertBannerComponent,
            ThemedHeaderNavbarWrapperComponent,
            ThemedBreadcrumbsComponent,
            ThemedLoadingComponent,
            ThemedFooterComponent,
            NotificationsBoardComponent,
          ],
        },
      })
      .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(RootComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should emit the hidden gutter state when the admin sidebar is not visible', () => {
    spyOn(TestBed.inject(MenuService), 'isMenuVisibleWithVisibleSections').and.returnValue(of(false));
    component.ngOnInit();
    component.browserOsClasses.next(['browser-firefox', 'browser-firefox-windows']);
    fixture.detectChanges();

    let state: string;
    component.sidebarPaddingState$.subscribe((value: string) => state = value);
    expect(state).toEqual('hidden');

    // the gutter class must be merged with the browser/OS classes, not replace them
    let classes: string[];
    component.outerWrapperClasses$.subscribe((value: string[]) => classes = value);
    expect(classes).toEqual(['browser-firefox', 'browser-firefox-windows', 'ds-admin-sidebar-hidden']);

    const wrapper: HTMLElement = fixture.nativeElement.querySelector('.outer-wrapper');
    expect(Array.from(wrapper.classList)).toContain('browser-firefox');
    expect(Array.from(wrapper.classList)).toContain('browser-firefox-windows');
    expect(Array.from(wrapper.classList)).toContain('ds-admin-sidebar-hidden');
  });

  it('should enable the gutter transition only after the first paint', () => {
    const paints: FrameRequestCallback[] = [];
    spyOn(window, 'requestAnimationFrame').and.callFake((callback: FrameRequestCallback) => {
      paints.push(callback);
      return 0;
    });

    const gutterFixture = TestBed.createComponent(RootComponent);
    gutterFixture.detectChanges();
    const wrapper: HTMLElement = gutterFixture.nativeElement.querySelector('.outer-wrapper');

    // the gutter itself is rendered right away (this is what removes the SSR -> CSR jump) ...
    expect(Array.from(wrapper.classList)).toContain('ds-admin-sidebar-pinned');
    // ... but it must not animate before the first paint
    expect(gutterFixture.componentInstance.gutterTransitionEnabled).toBeFalse();
    expect(Array.from(wrapper.classList)).not.toContain('ds-admin-sidebar-animate');

    expect(paints.length).toBeGreaterThan(0);
    paints.forEach((callback: FrameRequestCallback) => callback(0));
    gutterFixture.detectChanges();

    expect(gutterFixture.componentInstance.gutterTransitionEnabled).toBeTrue();
    expect(Array.from(wrapper.classList)).toContain('ds-admin-sidebar-animate');
  });
});
