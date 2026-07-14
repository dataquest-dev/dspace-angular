import { first, map, skipWhile, startWith } from 'rxjs/operators';
import { AfterViewInit, Component, Input, OnInit } from '@angular/core';
import { Router } from '@angular/router';

import { combineLatest as combineLatestObservable, Observable, of } from 'rxjs';
import { CSSVariableService } from '../shared/sass-helper/css-variable.service';
import { MenuService } from '../shared/menu/menu.service';
import { HostWindowService } from '../shared/host-window.service';
import { ThemeConfig } from '../../config/theme.config';
import { environment } from '../../environments/environment';
import { MenuID } from '../shared/menu/menu-id.model';
import { getPageInternalServerErrorRoute } from '../app-routing-paths';
import { INotificationBoardOptions } from 'src/config/notifications-config.interfaces';

@Component({
  selector: 'ds-root',
  templateUrl: './root.component.html',
  styleUrls: ['./root.component.scss'],
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
  ) {
    this.notificationOptions = environment.notifications;
  }

  ngOnInit() {
    this.isSidebarVisible$ = this.menuService.isMenuVisibleWithVisibleSections(MenuID.ADMIN);

    // Still provided to <ds-themed-admin-sidebar>; the sidebar element itself sizes from CSS vars, so a
    // null value on the server (the store is browser-only) is harmless there.
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
}
