import { debounceTime, distinctUntilChanged, filter, startWith, switchMap, take, takeUntil, withLatestFrom, delay } from 'rxjs/operators';
import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  HostListener,
  Inject,
  NgZone,
  OnDestroy,
  OnInit,
  PLATFORM_ID,
} from '@angular/core';
import {
  NavigationCancel,
  NavigationEnd,
  NavigationStart,
  Router,
} from '@angular/router';

import { BehaviorSubject, combineLatest, Observable, race, Subject, timer } from 'rxjs';
import { select, Store } from '@ngrx/store';
import { NgbModal, NgbModalConfig } from '@ng-bootstrap/ng-bootstrap';
import { TranslateService } from '@ngx-translate/core';
import { HostWindowResizeAction } from './shared/host-window.actions';
import { HostWindowState } from './shared/search/host-window.reducer';
import { NativeWindowRef, NativeWindowService } from './core/services/window.service';
import { isAuthenticationBlocking } from './core/auth/selectors';
import { AuthService } from './core/auth/auth.service';
import { CSSVariableService } from './shared/sass-helper/css-variable.service';
import { environment } from '../environments/environment';
import { models } from './core/core.module';
import { ThemeService } from './shared/theme-support/theme.service';
import { IdleModalComponent } from './shared/idle-modal/idle-modal.component';
import { distinctNext } from './core/shared/distinct-next';

@Component({
  selector: 'ds-app',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent implements OnInit, AfterViewInit, OnDestroy {
  notificationOptions;
  models;

  /**
   * Emits on destroy to tear down the SSR-overlay-removal pipeline (gate subscription, the
   * MutationObserver and its debounce/cap timers all unsubscribe via `takeUntil(destroyed$)`).
   * AppComponent is the root component so this is mostly defensive + test hygiene.
   */
  private destroyed$ = new Subject<void>();

  /** SSR anti-flicker overlay (see src/index.html) removal tuning. */
  private readonly ssrOverlaySettleQuietMs = 600;      // routed page is "done" after this long with no DOM change
  private readonly ssrOverlaySettleMaxMs = 10000;      // backstop reveal (below index.html's 15s catastrophic net)
  private readonly ssrOverlayMinContentHeightPx = 200; // proves <ds-app> is no longer the empty shell

  /**
   * Whether or not the authentication is currently blocking the UI
   */
  isAuthBlocking$: Observable<boolean>;

  /**
   * Whether or not the app is in the process of rerouting
   */
  isRouteLoading$: BehaviorSubject<boolean> = new BehaviorSubject(false);

  /**
   * Whether or not the theme is in the process of being swapped
   */
  isThemeLoading$: Observable<boolean>;

  /**
   * Whether or not the idle modal is is currently open
   */
  idleModalOpen: boolean;

  constructor(
    @Inject(NativeWindowService) private _window: NativeWindowRef,
    @Inject(DOCUMENT) private document: any,
    @Inject(PLATFORM_ID) private platformId: any,
    private themeService: ThemeService,
    private translate: TranslateService,
    private store: Store<HostWindowState>,
    private authService: AuthService,
    private router: Router,
    private cssService: CSSVariableService,
    private modalService: NgbModal,
    private modalConfig: NgbModalConfig,
    private ngZone: NgZone,
  ) {
    this.notificationOptions = environment.notifications;

    /* Use models object so all decorators are actually called */
    this.models = models;

    if (isPlatformBrowser(this.platformId)) {
      this.trackIdleModal();
      this.removeSsrOverlayWhenContentVisible();
    }

    this.isThemeLoading$ = this.themeService.isThemeLoading$;

    this.storeCSSVariables();
  }

  /**
   * Drops the SSR mask overlay installed by the inline bootstrap script in src/index.html once the
   * routed CSR page has actually finished rendering. Picking the right moment is the whole problem,
   * and the two earlier attempts each fixed one symptom and reintroduced the other:
   *
   *  - PR #1288 waited for `ApplicationRef.isStable`. No flicker, but isStable is held hostage by ANY
   *    ongoing zone async — after an admin login the app keeps the zone busy (authz/widgets, periodic
   *    polling, AAI/discojuice scripts) so isStable fires many seconds late (or hits the 15s
   *    fallback). The inert snapshot then masks the live page -> "looks rendered but not interactive"
   *    (issue #725).
   *  - PR #1317 switched to the loader-swap gate `!isAuthenticationBlocking && !isThemeLoading` plus a
   *    single requestAnimationFrame. Prompt, but that gate only un-hides `<router-outlet>`; the home
   *    page then renders piecewise (navbar, search box, community list, recent submissions) as each
   *    section's data arrives. Dropping the snapshot at the gate — or, as an earlier revision of this
   *    method did, as soon as *some* content exists — exposes a half-built page that visibly pops
   *    into place on a hard reload -> the flicker.
   *
   * The signal we actually need is "the routed page has stopped changing". So, after the gate opens,
   * we keep the snapshot until the live <ds-app> DOM has SETTLED (no element added/removed for a
   * short quiet window, with real content present). This stays decoupled from isStable (DOM-settle
   * ignores non-rendering background async, so admin reveals in a few seconds rather than ~15s).
   * See {@link routedPageReadyToReveal$}.
   */
  private removeSsrOverlayWhenContentVisible(): void {
    const win: Window | undefined = this._window?.nativeWindow;
    if (!win || typeof win.__dspaceRemoveSsrOverlay !== 'function') {
      return; // SSR was skipped for this route, so no overlay was installed — nothing to remove
    }
    // Run outside Angular: a MutationObserver watching the whole app must not trigger change
    // detection (it would also keep ApplicationRef.isStable permanently false).
    this.ngZone.runOutsideAngular(() => {
      this.routedPageReadyToReveal$().pipe(
        takeUntil(this.destroyed$),
      ).subscribe(() => {
        // one frame so the freshly rendered content is painted before the snapshot fades out
        this.runAfterNextFrame(win, () => win.__dspaceRemoveSsrOverlay?.());
      });
    });
  }

  /**
   * Emits once when it is safe to drop the SSR snapshot: the auth/theme loader gate has opened
   * (same condition root.component.html uses to swap its fullscreen loader for the routed content)
   * AND the routed page's DOM has settled. See {@link dsAppDomSettled$}.
   */
  private routedPageReadyToReveal$(): Observable<unknown> {
    const loaderGateOpen$ = combineLatest([
      this.store.pipe(select(isAuthenticationBlocking), distinctUntilChanged()),
      this.themeService.isThemeLoading$,
    ]).pipe(
      filter(([authBlocking, themeLoading]: [boolean, boolean]) => !authBlocking && !themeLoading),
      take(1),
    );
    return loaderGateOpen$.pipe(
      switchMap(() => this.dsAppDomSettled$()),
    );
  }

  /**
   * Emits once when the live <ds-app> subtree stops being mutated (elements added/removed) for
   * `ssrOverlaySettleQuietMs` AND it holds real content — or after `ssrOverlaySettleMaxMs`, whichever
   * comes first. The cap guarantees a page that never goes quiet (constant background DOM updates)
   * still reveals; the 15s fallback in index.html remains the ultimate net.
   */
  private dsAppDomSettled$(): Observable<unknown> {
    const dsApp: Element | null = this.document.querySelector('ds-app');
    if (!dsApp) {
      return timer(this.ssrOverlaySettleMaxMs);
    }
    const elementMutations$ = new Observable<void>((subscriber) => {
      const observer = new MutationObserver((records) => {
        if (records.some((record) => this.isElementChildListChange(record))) {
          subscriber.next();
        }
      });
      observer.observe(dsApp, { childList: true, subtree: true });
      return () => observer.disconnect();
    });
    const settled$ = elementMutations$.pipe(
      startWith(undefined),                              // start the quiet window immediately
      debounceTime(this.ssrOverlaySettleQuietMs),        // ... reset by each render, fires once quiet
      filter(() => this.dsAppHasRenderedContent(dsApp)), // ... but never on the empty shell
    );
    return race(settled$, timer(this.ssrOverlaySettleMaxMs)).pipe(take(1));
  }

  /** True once the live <ds-app> is no longer the empty shell the overlay script left behind. */
  private dsAppHasRenderedContent(dsApp: Element): boolean {
    const height = dsApp.getBoundingClientRect?.().height ?? 0;
    return height >= this.ssrOverlayMinContentHeightPx && dsApp.querySelector('#main-content') !== null;
  }

  /** A childList mutation that adds or removes at least one element node (ignores text/attr noise). */
  private isElementChildListChange(record: MutationRecord): boolean {
    if (record.type !== 'childList') {
      return false;
    }
    const changedNodes = [...Array.from(record.addedNodes), ...Array.from(record.removedNodes)];
    return changedNodes.some((node) => node.nodeType === Node.ELEMENT_NODE);
  }

  /** Runs `callback` after the next paint (or synchronously if requestAnimationFrame is unavailable). */
  private runAfterNextFrame(win: Window, callback: () => void): void {
    if (typeof win.requestAnimationFrame === 'function') {
      win.requestAnimationFrame(() => callback());
    } else {
      callback();
    }
  }

  ngOnDestroy(): void {
    this.destroyed$.next();
    this.destroyed$.complete();
  }

  ngOnInit() {
    /** Implement behavior for interface {@link ModalBeforeDismiss} */
    this.modalConfig.beforeDismiss = async function () {
      if (typeof this?.componentInstance?.beforeDismiss === 'function') {
        return this.componentInstance.beforeDismiss();
      }

      // fall back to default behavior
      return true;
    };

    this.isAuthBlocking$ = this.store.pipe(
      select(isAuthenticationBlocking),
      distinctUntilChanged()
    );

    this.dispatchWindowSize(this._window.nativeWindow.innerWidth, this._window.nativeWindow.innerHeight);
  }

  private storeCSSVariables() {
    this.cssService.clearCSSVariables();
    this.cssService.addCSSVariables(this.cssService.getCSSVariablesFromStylesheets(this.document));
  }

  ngAfterViewInit() {
    this.router.events.pipe(
      // delay(0) to prevent "Expression has changed after it was checked" errors
      delay(0)
    ).subscribe((event) => {
      if (event instanceof NavigationStart) {
        distinctNext(this.isRouteLoading$, true);
      } else if (
        event instanceof NavigationEnd ||
        event instanceof NavigationCancel
      ) {
        distinctNext(this.isRouteLoading$, false);
      }
    });
  }

  @HostListener('window:resize', ['$event'])
  public onResize(event): void {
    this.dispatchWindowSize(event.target.innerWidth, event.target.innerHeight);
  }

  private dispatchWindowSize(width, height): void {
    this.store.dispatch(
      new HostWindowResizeAction(width, height)
    );
  }

  private trackIdleModal() {
    const isIdle$ = this.authService.isUserIdle();
    const isAuthenticated$ = this.authService.isAuthenticated();
    isIdle$.pipe(withLatestFrom(isAuthenticated$))
      .subscribe(([userIdle, authenticated]) => {
        if (userIdle && authenticated) {
          if (!this.idleModalOpen) {
            const modalRef = this.modalService.open(IdleModalComponent, { ariaLabelledBy: 'idle-modal.header' });
            this.idleModalOpen = true;
            modalRef.componentInstance.response.pipe(take(1)).subscribe((closed: boolean) => {
              if (closed) {
                this.idleModalOpen = false;
              }
            });
          }
        }
      });
  }

}
