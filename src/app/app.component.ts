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
   * real CSR content has actually been painted. This trigger has to thread a needle between the two
   * earlier approaches, each of which fixed one symptom and reintroduced the other:
   *
   *  - PR #1288 waited for `ApplicationRef.isStable`. That guaranteed the content was painted (no
   *    flicker) but isStable is held hostage by ANY ongoing zone async — after an admin login the
   *    app keeps the zone busy (authz/widgets, periodic polling, AAI/discojuice scripts) so isStable
   *    fires many seconds late (or never, hitting the 15s fallback). The inert snapshot then masks
   *    the live, already-rendered page -> "looks rendered but not interactive" (issue #725).
   *  - PR #1317 switched to the loader-swap gate `!isAuthenticationBlocking && !isThemeLoading` plus
   *    a single requestAnimationFrame. That fires promptly (fixing #725) but the gate only un-hides
   *    `<router-outlet>`; Angular has NOT yet rendered the routed page at that instant and one rAF
   *    runs before the browser paints, so the snapshot is dropped over an empty <ds-app> for a frame
   *    or two -> the flicker came back.
   *
   * We keep #1317's decoupling from isStable (so background async can never delay us) but, after the
   * gate opens, we wait across animation frames until the real <ds-app> is actually laid out before
   * removing the snapshot. See {@link removeSsrOverlayAfterContentPainted}.
   */
  private removeSsrOverlayWhenContentVisible(): void {
    const w: Window | undefined = this._window?.nativeWindow;
    if (!w || typeof w.__dspaceRemoveSsrOverlay !== 'function') {
      return;
    }
    // run outside Angular so the subscription does not keep change detection alive
    this.ngZone.runOutsideAngular(() => {
      combineLatest([
        this.store.pipe(select(isAuthenticationBlocking), distinctUntilChanged()),
        this.themeService.isThemeLoading$,
      ]).pipe(
        filter(([blocking, themeLoading]: [boolean, boolean]) => !blocking && !themeLoading),
        first(),
      ).subscribe(() => {
        this.removeSsrOverlayAfterContentPainted(w);
      });
    });
  }

  /**
   * Waits until the routed CSR view has been committed to the DOM and painted, then removes the SSR
   * snapshot overlay. "Painted" is approximated by the real <ds-app> reaching a non-trivial height
   * AND containing its `#main-content` host (i.e. it is no longer the empty shell the overlay script
   * left behind). We poll this cheap layout signal once per animation frame, capped at MAX_FRAMES so
   * that — unlike isStable in #1288 — nothing can hold the overlay open indefinitely; the 15s hard
   * fallback in index.html stays as the catastrophic-error safety net.
   */
  private removeSsrOverlayAfterContentPainted(w: Window): void {
    const doc: Document = this.document;
    const raf: ((cb: FrameRequestCallback) => number) | null =
      typeof w.requestAnimationFrame === 'function' ? w.requestAnimationFrame.bind(w) : null;
    const remove = () => {
      if (typeof w.__dspaceRemoveSsrOverlay === 'function') {
        w.__dspaceRemoveSsrOverlay();
      }
    };
    const MAX_FRAMES = 180; // ~3s @60fps safety cap; the routed shell normally paints within a few frames
    const MIN_CONTENT_HEIGHT = 200; // px: enough to prove the real <ds-app> is no longer the empty shell
    let frames = 0;
    const contentPainted = (): boolean => {
      const app: Element | null = doc.querySelector('ds-app');
      if (!app) {
        return false;
      }
      let height = 0;
      try {
        height = app.getBoundingClientRect().height;
      } catch (e) {
        height = 0;
      }
      return height >= MIN_CONTENT_HEIGHT && app.querySelector('#main-content') !== null;
    };
    const tick = () => {
      if (contentPainted() || ++frames >= MAX_FRAMES) {
        // one more frame so the painted content is committed to screen before the snapshot fades
        if (raf) {
          raf(remove);
        } else {
          remove();
        }
        return;
      }
      if (raf) {
        raf(tick);
      } else {
        setTimeout(tick, 16);
      }
    };
    if (raf) {
      raf(tick);
    } else {
      setTimeout(tick, 16);
    }
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
