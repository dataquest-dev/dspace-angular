import {
  AsyncPipe,
  NgClass,
} from '@angular/common';
import {
  AfterViewInit,
  Component,
  Inject,
  Input,
  OnInit,
} from '@angular/core';
import {
  Router,
  RouterOutlet,
} from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import {
  BehaviorSubject,
  combineLatest as combineLatestObservable,
  Observable,
  of,
} from 'rxjs';
import {
  first,
  map,
  skipWhile,
  startWith,
} from 'rxjs/operators';
import { INotificationBoardOptions } from 'src/config/notifications-config.interfaces';

import { ThemeConfig } from '../../config/theme.config';
import { environment } from '../../environments/environment';
import { ThemedAdminSidebarComponent } from '../admin/admin-sidebar/themed-admin-sidebar.component';
import { getPageInternalServerErrorRoute } from '../app-routing-paths';
import { ThemedBreadcrumbsComponent } from '../breadcrumbs/themed-breadcrumbs.component';
import {
  NativeWindowRef,
  NativeWindowService,
} from '../core/services/window.service';
import { ThemedFooterComponent } from '../footer/themed-footer.component';
import { ThemedHeaderNavbarWrapperComponent } from '../header-nav-wrapper/themed-header-navbar-wrapper.component';
import { HostWindowService } from '../shared/host-window.service';
import { LiveRegionComponent } from '../shared/live-region/live-region.component';
import { ThemedLoadingComponent } from '../shared/loading/themed-loading.component';
import { MenuService } from '../shared/menu/menu.service';
import { MenuID } from '../shared/menu/menu-id.model';
import { NotificationsBoardComponent } from '../shared/notifications/notifications-board/notifications-board.component';
import { CSSVariableService } from '../shared/sass-helper/css-variable.service';
import { SystemWideAlertBannerComponent } from '../system-wide-alert/alert-banner/system-wide-alert-banner.component';

@Component({
  selector: 'ds-base-root',
  templateUrl: './root.component.html',
  styleUrls: ['./root.component.scss'],
  standalone: true,
  imports: [
    AsyncPipe,
    LiveRegionComponent,
    NgClass,
    NotificationsBoardComponent,
    RouterOutlet,
    SystemWideAlertBannerComponent,
    ThemedAdminSidebarComponent,
    ThemedBreadcrumbsComponent,
    ThemedFooterComponent,
    ThemedHeaderNavbarWrapperComponent,
    ThemedLoadingComponent,
    TranslateModule,
  ],
})
export class RootComponent implements OnInit, AfterViewInit {
  theme: Observable<ThemeConfig> = of({} as any);
  isSidebarVisible$: Observable<boolean>;
  slideSidebarOver$: Observable<boolean>;
  collapsedSidebarWidth$: Observable<string>;
  expandedSidebarWidth$: Observable<string>;

  /**
   * The admin-sidebar padding state ('hidden' | 'unpinned' | 'pinned') used to drive the
   * outer-wrapper's left gutter via CSS classes (see root.component.scss) instead of an Angular
   * animation. CSS resolves the gutter width from the `--ds-admin-sidebar-*` custom properties, so it
   * is rendered identically on the server (the anti-flicker SSR snapshot) and the browser (the live
   * app) — no browser-only CSS-variable read, no hardcoded px, and it stays theme- and viewport-aware.
   */
  sidebarPaddingState$: Observable<string>;

  /**
   * Enables the gutter's `transition: padding-left` only AFTER the first browser paint. The initial
   * SSR->CSR gutter resolution happens behind the anti-flicker overlay; without this gate a plain CSS
   * transition would animate that initial 0->gutter change (the overlay settle detector only watches
   * DOM mutations, not style changes), which could leak a 300ms slide right as the overlay is removed.
   * Off on the server and on first render, so only genuine pin/unpin toggles animate.
   */
  gutterTransitionEnabled = false;
  notificationOptions: INotificationBoardOptions;
  models: any;

  browserOsClasses = new BehaviorSubject<string[]>([]);

  /**
   * Whether or not to show a full screen loader
   */
  @Input() shouldShowFullscreenLoader: boolean;

  /**
   * Whether or not to show a loader across the router outlet
   */
  @Input() shouldShowRouteLoader: boolean;

  constructor(
    private router: Router,
    private cssService: CSSVariableService,
    private menuService: MenuService,
    private windowService: HostWindowService,
    @Inject(NativeWindowService) private _window: NativeWindowRef,
  ) {
    this.notificationOptions = environment.notifications;
  }

  ngOnInit() {
    const browserName = this.getBrowserName();
    if (browserName) {
      const browserOsClasses = new Array<string>();
      browserOsClasses.push(`browser-${browserName}`);
      const osName = this.getOSName();
      if (osName) {
        browserOsClasses.push(`browser-${browserName}-${osName}`);
      }
      this.browserOsClasses.next(browserOsClasses);
    }

    this.isSidebarVisible$ = this.menuService.isMenuVisibleWithVisibleSections(MenuID.ADMIN);

    this.expandedSidebarWidth$ = this.cssService.getVariable('--ds-admin-sidebar-total-width').pipe(
      skipWhile((val) => !val),
      first(),
    );
    this.collapsedSidebarWidth$ = this.cssService.getVariable('--ds-admin-sidebar-fixed-element-width').pipe(
      skipWhile((val) => !val),
      first(),
    );

    const sidebarCollapsed = this.menuService.isMenuCollapsed(MenuID.ADMIN);
    this.slideSidebarOver$ = combineLatestObservable([sidebarCollapsed, this.windowService.isXsOrSm()])
      .pipe(
        map(([collapsed, mobile]) => collapsed || mobile),
        startWith(true),
      );

    // Drive the outer-wrapper gutter via a CSS class instead of the @slideSidebarPadding animation: the
    // animation needs a concrete width from the browser-only CSS-variable store, so on the server it
    // rendered padding-left:0 and the authenticated page jumped right when the SSR snapshot was removed.
    // The CSS class resolves the gutter from `--ds-admin-sidebar-*` (see root.component.scss), identically
    // on server and browser — fixing the jump without any hardcoded width.
    this.sidebarPaddingState$ = combineLatestObservable([this.isSidebarVisible$, this.slideSidebarOver$]).pipe(
      map(([visible, over]) => !visible ? 'hidden' : over ? 'unpinned' : 'pinned'),
    );

    if (this.router.url === getPageInternalServerErrorRoute()) {
      this.shouldShowRouteLoader = false;
    }
  }

  ngAfterViewInit(): void {
    // Enable the gutter slide only after the first paint (browser only; requestAnimationFrame is not
    // defined under SSR), so the initial padding resolution never animates — see gutterTransitionEnabled.
    if (typeof requestAnimationFrame === 'function') {
      requestAnimationFrame(() => { this.gutterTransitionEnabled = true; });
    }
  }

  skipToMainContent() {
    const mainContent = document.getElementById('main-content');
    if (mainContent) {
      mainContent.tabIndex = -1;
      mainContent.focus();
    }
  }

  getBrowserName(): string {
    const userAgent = this._window.nativeWindow.navigator?.userAgent;
    if (/Firefox/.test(userAgent)) {
      return 'firefox';
    }
    if (/Safari/.test(userAgent)) {
      return 'safari';
    }
    return undefined;
  }

  getOSName(): string {
    const userAgent = this._window.nativeWindow.navigator?.userAgent;
    if (/Windows/.test(userAgent)) {
      return 'windows';
    }
    return undefined;
  }
}
