import {
  AsyncPipe,
  DOCUMENT,
  isPlatformBrowser,
} from '@angular/common';
import {
  AfterViewInit,
  ApplicationRef,
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
import {
  NgbModal,
  NgbModalConfig,
} from '@ng-bootstrap/ng-bootstrap';
import {
  select,
  Store,
} from '@ngrx/store';
import { TranslateService } from '@ngx-translate/core';
import {
  BehaviorSubject,
  Observable,
} from 'rxjs';
import {
  delay,
  distinctUntilChanged,
  filter,
  first,
  take,
  withLatestFrom,
} from 'rxjs/operators';

import { environment } from '../environments/environment';
import { AuthService } from './core/auth/auth.service';
import { isAuthenticationBlocking } from './core/auth/selectors';
import {
  NativeWindowRef,
  NativeWindowService,
} from './core/services/window.service';
import { distinctNext } from './core/shared/distinct-next';
import { ThemedRootComponent } from './root/themed-root.component';
import { HostWindowResizeAction } from './shared/host-window.actions';
import { IdleModalComponent } from './shared/idle-modal/idle-modal.component';
import { CSSVariableService } from './shared/sass-helper/css-variable.service';
import { HostWindowState } from './shared/search/host-window.reducer';
import { ThemeService } from './shared/theme-support/theme.service';

@Component({
  selector: 'ds-app',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    AsyncPipe,
    ThemedRootComponent,
  ],
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
    private appRef: ApplicationRef,
    private ngZone: NgZone,
  ) {
    this.notificationOptions = environment.notifications;

    if (isPlatformBrowser(this.platformId)) {
      this.trackIdleModal();
      this.removeSsrOverlayWhenStable();
    }

    this.isThemeLoading$ = this.themeService.isThemeLoading$;

    this.storeCSSVariables();
  }

  /**
   * Drops the hydration-safe SSR freeze-frame installed by the inline bootstrap script in
   * src/index.html once Angular reaches its first stable state. On DSpace 9 (Angular 18) the
   * page DOES hydrate, but the theme system re-creates every `ds-themed-*` wrapper imperatively
   * on the client (see ThemedComponent), so the SSR view is briefly rebuilt; the overlay clone
   * masks that rebuild. We wait for the first stable paint, add a short pad, then fade it out.
   * A 15s hard fallback lives inside the script itself in case isStable never fires.
   */
  private removeSsrOverlayWhenStable(): void {
    const w: Window | undefined = this._window?.nativeWindow;
    if (!w || typeof w.__dspaceRemoveSsrOverlay !== 'function') {
      return;
    }
    // run outside Angular so we don't keep changeDetection ticking on the overlay timer
    this.ngZone.runOutsideAngular(() => {
      this.appRef.isStable.pipe(
        filter((stable: boolean) => stable),
        first(),
      ).subscribe(() => {
        // one rAF + small pad to let the first stable paint commit before fading the overlay
        const remove = () => {
          if (typeof w.__dspaceRemoveSsrOverlay === 'function') {
            w.__dspaceRemoveSsrOverlay();
          }
        };
        if (typeof w.requestAnimationFrame === 'function') {
          w.requestAnimationFrame(() => setTimeout(remove, 50));
        } else {
          setTimeout(remove, 50);
        }
      });
    });
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
      distinctUntilChanged(),
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
      delay(0),
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
      new HostWindowResizeAction(width, height),
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
