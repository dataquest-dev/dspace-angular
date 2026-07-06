import { map, startWith } from 'rxjs/operators';
import { AfterViewInit, Component, Inject, Input, OnInit } from '@angular/core';
import { Router } from '@angular/router';

import { combineLatest as combineLatestObservable, Observable, of } from 'rxjs';
import { Store } from '@ngrx/store';
import { TranslateService } from '@ngx-translate/core';

import { MetadataService } from '../core/metadata/metadata.service';
import { HostWindowState } from '../shared/search/host-window.reducer';
import { NativeWindowRef, NativeWindowService } from '../core/services/window.service';
import { AuthService } from '../core/auth/auth.service';
import { CSSVariableService } from '../shared/sass-helper/css-variable.service';
import { MenuService } from '../shared/menu/menu.service';
import { HostWindowService } from '../shared/host-window.service';
import { ThemeConfig } from '../../config/theme.config';
import { Angulartics2DSpace } from '../statistics/angulartics/dspace-provider';
import { environment } from '../../environments/environment';
import { MenuID } from '../shared/menu/menu-id.model';
import { getPageInternalServerErrorRoute } from '../app-routing-paths';
import { hasValueOperator } from '../shared/empty.util';

@Component({
  selector: 'ds-root',
  templateUrl: './root.component.html',
  styleUrls: ['./root.component.scss'],
})
export class RootComponent implements OnInit, AfterViewInit {
  sidebarVisible: Observable<boolean>;
  slideSidebarOver: Observable<boolean>;
  collapsedSidebarWidth: Observable<string>;
  totalSidebarWidth: Observable<string>;

  /**
   * The admin-sidebar padding state ('hidden' | 'unpinned' | 'pinned') used to drive the
   * outer-wrapper's left gutter via CSS classes (see root.component.scss) instead of an Angular
   * animation. CSS resolves the gutter width from the sidebar-width custom properties, so it is
   * rendered identically on the server (the anti-flicker SSR snapshot) and the browser (the live
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
  theme: Observable<ThemeConfig> = of({} as any);
  notificationOptions;
  models;

  /**
   * Whether or not to show a full screen loader
   */
  @Input() shouldShowFullscreenLoader: boolean;

  /**
   * Whether or not to show a loader across the router outlet
   */
  @Input() shouldShowRouteLoader: boolean;

  constructor(
    @Inject(NativeWindowService) private _window: NativeWindowRef,
    private translate: TranslateService,
    private store: Store<HostWindowState>,
    private metadata: MetadataService,
    private angulartics2DSpace: Angulartics2DSpace,
    private authService: AuthService,
    private router: Router,
    private cssService: CSSVariableService,
    private menuService: MenuService,
    private windowService: HostWindowService
  ) {
    this.notificationOptions = environment.notifications;
  }

  ngOnInit() {
    this.sidebarVisible = this.menuService.isMenuVisibleWithVisibleSections(MenuID.ADMIN);

    this.collapsedSidebarWidth = this.cssService.getVariable('--ds-collapsed-sidebar-width').pipe(hasValueOperator());
    this.totalSidebarWidth = this.cssService.getVariable('--ds-total-sidebar-width').pipe(hasValueOperator());

    const sidebarCollapsed = this.menuService.isMenuCollapsed(MenuID.ADMIN);
    this.slideSidebarOver = combineLatestObservable([sidebarCollapsed, this.windowService.isXsOrSm()])
      .pipe(
        map(([collapsed, mobile]) => collapsed || mobile),
        startWith(true),
      );

    // Drive the outer-wrapper gutter via a CSS class instead of the @slideSidebarPadding animation: the
    // animation needs a concrete width from the browser-only CSS-variable store, so on the server it
    // rendered padding-left:0 and the authenticated page jumped right when the SSR snapshot was removed.
    // The CSS class resolves the gutter from the sidebar-width custom properties (see root.component.scss),
    // identically on server and browser — fixing the jump without any hardcoded width.
    this.sidebarPaddingState$ = combineLatestObservable([this.sidebarVisible, this.slideSidebarOver]).pipe(
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
