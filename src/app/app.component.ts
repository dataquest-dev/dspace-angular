import { distinctUntilChanged, filter, first, take, withLatestFrom, delay } from 'rxjs/operators';
import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  HostListener,
  Inject,
  NgZone,
  OnInit,
  PLATFORM_ID,
} from '@angular/core';
import {
  NavigationCancel,
  NavigationEnd,
  NavigationStart,
  Router,
} from '@angular/router';

import { BehaviorSubject, combineLatest, Observable } from 'rxjs';
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
export class AppComponent implements OnInit, AfterViewInit {
  notificationOptions;
  models;

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
   * we keep the snapshot until the real <ds-app> DOM has SETTLED: no element added or removed for a
   * short quiet window. This stays decoupled from isStable (DOM-settle ignores non-rendering
   * background async, so admin reveals in a few seconds rather than ~15s) while waiting for the page
   * the user is actually looking at to be fully built. See {@link removeSsrOverlayWhenDomSettles}.
   */
  private removeSsrOverlayWhenContentVisible(): void {
    const w: Window | undefined = this._window?.nativeWindow;
    if (!w || typeof w.__dspaceRemoveSsrOverlay !== 'function') {
      return;
    }
    // run outside Angular so the subscription/observer does not keep change detection alive
    this.ngZone.runOutsideAngular(() => {
      combineLatest([
        this.store.pipe(select(isAuthenticationBlocking), distinctUntilChanged()),
        this.themeService.isThemeLoading$,
      ]).pipe(
        filter(([blocking, themeLoading]: [boolean, boolean]) => !blocking && !themeLoading),
        first(),
      ).subscribe(() => {
        this.removeSsrOverlayWhenDomSettles(w);
      });
    });
  }

  /**
   * Removes the SSR snapshot overlay once the real <ds-app> subtree has stopped mutating for
   * SETTLE_QUIET_MS (the routed page finished rendering its sections), requiring a minimum amount of
   * content first so we never settle on the empty shell the overlay script left behind. A
   * MutationObserver tracks element add/remove inside <ds-app>; every such change rearms the quiet
   * timer. Capped at SETTLE_MAX_MS so a page that never goes quiet (e.g. constant background DOM
   * updates) still reveals; the 15s fallback in index.html remains the ultimate net.
   */
  private removeSsrOverlayWhenDomSettles(w: Window): void {
    const doc: Document = this.document;
    const SETTLE_QUIET_MS = 600;   // no DOM change for this long => the routed page has finished rendering
    const SETTLE_MAX_MS = 10000;   // hard cap so a never-quiet page still reveals (below index.html's 15s net)
    const MIN_CONTENT_HEIGHT = 200; // px: proves <ds-app> is no longer the empty shell

    const app: Element | null = doc.querySelector('ds-app');
    const remove = () => {
      if (typeof w.__dspaceRemoveSsrOverlay === 'function') {
        w.__dspaceRemoveSsrOverlay();
      }
    };
    const hasMinContent = (): boolean => {
      const el: Element | null = doc.querySelector('ds-app');
      if (!el) {
        return false;
      }
      let height = 0;
      try {
        height = el.getBoundingClientRect().height;
      } catch (e) {
        height = 0;
      }
      return height >= MIN_CONTENT_HEIGHT && el.querySelector('#main-content') !== null;
    };

    let done = false;
    let quietTimer: ReturnType<typeof setTimeout> | null = null;
    let capTimer: ReturnType<typeof setTimeout> | null = null;

    const finish = () => {
      if (done) {
        return;
      }
      done = true;
      if (quietTimer !== null) { clearTimeout(quietTimer); }
      if (capTimer !== null) { clearTimeout(capTimer); }
      try { observer.disconnect(); } catch (e) { /* noop */ }
      // one rAF so the final rendered frame is committed to screen before the snapshot fades
      if (typeof w.requestAnimationFrame === 'function') {
        w.requestAnimationFrame(remove);
      } else {
        remove();
      }
    };

    const armQuietTimer = () => {
      if (done) {
        return;
      }
      if (quietTimer !== null) { clearTimeout(quietTimer); }
      quietTimer = setTimeout(() => {
        // DOM has been quiet for SETTLE_QUIET_MS; reveal once real content is there, else keep waiting
        if (hasMinContent()) {
          finish();
        } else {
          armQuietTimer();
        }
      }, SETTLE_QUIET_MS);
    };

    const observer = new MutationObserver((mutations: MutationRecord[]) => {
      for (const m of mutations) {
        if (m.type === 'childList' && (m.addedNodes.length > 0 || m.removedNodes.length > 0)) {
          let elementChanged = false;
          m.addedNodes.forEach((n: Node) => { if (n.nodeType === 1) { elementChanged = true; } });
          m.removedNodes.forEach((n: Node) => { if (n.nodeType === 1) { elementChanged = true; } });
          if (elementChanged) {
            armQuietTimer(); // a section rendered -> reset the quiet window
            return;
          }
        }
      }
    });

    if (app) {
      observer.observe(app, { childList: true, subtree: true });
    }
    capTimer = setTimeout(finish, SETTLE_MAX_MS);
    armQuietTimer();
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
