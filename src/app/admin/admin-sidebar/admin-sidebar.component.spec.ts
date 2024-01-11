<<<<<<< HEAD
import { Component, HostListener, Injector, OnInit } from '@angular/core';
import { BehaviorSubject, combineLatest, Observable } from 'rxjs';
import { debounceTime, distinctUntilChanged, first, map, withLatestFrom } from 'rxjs/operators';
=======
import { ComponentFixture, fakeAsync, TestBed, tick, waitForAsync } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { TranslateModule } from '@ngx-translate/core';
import { ChangeDetectionStrategy, Injector, NO_ERRORS_SCHEMA } from '@angular/core';
import { ScriptDataService } from '../../core/data/processes/script-data.service';
import { AdminSidebarComponent } from './admin-sidebar.component';
import { MenuService } from '../../shared/menu/menu.service';
import { MenuServiceStub } from '../../shared/testing/menu-service.stub';
import { CSSVariableService } from '../../shared/sass-helper/css-variable.service';
import { CSSVariableServiceStub } from '../../shared/testing/css-variable-service.stub';
import { AuthServiceStub } from '../../shared/testing/auth-service.stub';
>>>>>>> dspace-7.6.1
import { AuthService } from '../../core/auth/auth.service';
import { slideSidebar } from '../../shared/animations/slide';
import { MenuComponent } from '../../shared/menu/menu.component';
import { MenuService } from '../../shared/menu/menu.service';
import { CSSVariableService } from '../../shared/sass-helper/css-variable.service';
import { AuthorizationDataService } from '../../core/data/feature-authorization/authorization-data.service';
<<<<<<< HEAD
import { MenuID } from '../../shared/menu/menu-id.model';
import { ActivatedRoute } from '@angular/router';
import { ThemeService } from '../../shared/theme-support/theme.service';

/**
 * Component representing the admin sidebar
 */
@Component({
  selector: 'ds-admin-sidebar',
  templateUrl: './admin-sidebar.component.html',
  styleUrls: ['./admin-sidebar.component.scss'],
  animations: [slideSidebar]
})
export class AdminSidebarComponent extends MenuComponent implements OnInit {
  /**
   * The menu ID of the Navbar is PUBLIC
   * @type {MenuID.ADMIN}
   */
  menuID = MenuID.ADMIN;

  /**
   * Observable that emits the width of the collapsible menu sections
   */
  sidebarWidth: Observable<string>;

  /**
   * Is true when the sidebar is open, is false when the sidebar is animating or closed
   * @type {boolean}
   */
  sidebarOpen = true; // Open in UI, animation finished

  /**
   * Is true when the sidebar is closed, is false when the sidebar is animating or open
   * @type {boolean}
   */
  sidebarClosed = !this.sidebarOpen; // Closed in UI, animation finished

  /**
   * Emits true when either the menu OR the menu's preview is expanded, else emits false
   */
  sidebarExpanded: Observable<boolean>;

  inFocus$: BehaviorSubject<boolean>;

  constructor(
    protected menuService: MenuService,
    protected injector: Injector,
    private variableService: CSSVariableService,
    private authService: AuthService,
    public authorizationService: AuthorizationDataService,
    public route: ActivatedRoute,
    protected themeService: ThemeService
  ) {
    super(menuService, injector, authorizationService, route, themeService);
    this.inFocus$ = new BehaviorSubject(false);
  }

  /**
   * Set and calculate all initial values of the instance variables
   */
  ngOnInit(): void {
    super.ngOnInit();
    this.sidebarWidth = this.variableService.getVariable('--ds-sidebar-items-width');
    this.authService.isAuthenticated()
      .subscribe((loggedIn: boolean) => {
        if (loggedIn) {
          this.menuService.showMenu(this.menuID);
=======
import createSpy = jasmine.createSpy;
import { createSuccessfulRemoteDataObject } from '../../shared/remote-data.utils';
import { Item } from '../../core/shared/item.model';
import { ThemeService } from '../../shared/theme-support/theme.service';
import { getMockThemeService } from '../../shared/mocks/theme-service.mock';

describe('AdminSidebarComponent', () => {
  let comp: AdminSidebarComponent;
  let fixture: ComponentFixture<AdminSidebarComponent>;
  const menuService = new MenuServiceStub();
  let authorizationService: AuthorizationDataService;
  let scriptService;


  const mockItem = Object.assign(new Item(), {
    id: 'fake-id',
    uuid: 'fake-id',
    handle: 'fake/handle',
    lastModified: '2018',
    _links: {
      self: {
        href: 'https://localhost:8000/items/fake-id'
      }
    }
  });


  const routeStub = {
    data: observableOf({
      dso: createSuccessfulRemoteDataObject(mockItem)
    }),
    children: []
  };


  beforeEach(waitForAsync(() => {
    authorizationService = jasmine.createSpyObj('authorizationService', {
      isAuthorized: observableOf(true)
    });
    scriptService = jasmine.createSpyObj('scriptService', { scriptWithNameExistsAndCanExecute: observableOf(true) });
    TestBed.configureTestingModule({
      imports: [TranslateModule.forRoot(), NoopAnimationsModule, RouterTestingModule],
      declarations: [AdminSidebarComponent],
      providers: [
        Injector,
        { provide: ThemeService, useValue: getMockThemeService() },
        { provide: MenuService, useValue: menuService },
        { provide: CSSVariableService, useClass: CSSVariableServiceStub },
        { provide: AuthService, useClass: AuthServiceStub },
        { provide: ActivatedRoute, useValue: {} },
        { provide: AuthorizationDataService, useValue: authorizationService },
        { provide: ScriptDataService, useValue: scriptService },
        { provide: ActivatedRoute, useValue: routeStub },
        {
          provide: NgbModal, useValue: {
            open: () => {/*comment*/
            }
          }
        }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).overrideComponent(AdminSidebarComponent, {
      set: {
        changeDetection: ChangeDetectionStrategy.Default,
      }
    }).compileComponents();
  }));

  beforeEach(() => {
    spyOn(menuService, 'getMenuTopSections').and.returnValue(observableOf([]));
    fixture = TestBed.createComponent(AdminSidebarComponent);
    comp = fixture.componentInstance; // SearchPageComponent test instance
    comp.sections = observableOf([]);
    fixture.detectChanges();
  });

  describe('startSlide', () => {
    describe('when expanding', () => {
      beforeEach(() => {
        comp.sidebarClosed = true;
        comp.startSlide({ toState: 'expanded' } as any);
      });

      it('should set the sidebarClosed to false', () => {
        expect(comp.sidebarClosed).toBeFalsy();
      });
    });

    describe('when collapsing', () => {
      beforeEach(() => {
        comp.sidebarClosed = false;
        comp.startSlide({ toState: 'collapsed' } as any);
      });

      it('should set the sidebarOpen to false', () => {
        expect(comp.sidebarOpen).toBeFalsy();
      });
    });
  });

  describe('finishSlide', () => {
    describe('when expanding', () => {
      beforeEach(() => {
        comp.sidebarClosed = true;
        comp.startSlide({ fromState: 'expanded' } as any);
      });

      it('should set the sidebarClosed to true', () => {
        expect(comp.sidebarClosed).toBeTruthy();
      });
    });

    describe('when collapsing', () => {
      beforeEach(() => {
        comp.sidebarClosed = false;
        comp.startSlide({ fromState: 'collapsed' } as any);
      });

      it('should set the sidebarOpen to true', () => {
        expect(comp.sidebarOpen).toBeTruthy();
      });
    });
  });

  describe('when the collapse link is clicked', () => {
    beforeEach(() => {
      spyOn(menuService, 'toggleMenu');
      const sidebarToggler = fixture.debugElement.query(By.css('#sidebar-collapse-toggle > a'));
      sidebarToggler.triggerEventHandler('click', {
        preventDefault: () => {/**/
        }
      });
    });

    it('should call toggleMenu on the menuService', () => {
      expect(menuService.toggleMenu).toHaveBeenCalled();
    });
  });

  describe('when the the mouse enters the nav tag', () => {
    it('should call expandPreview on the menuService after 100ms', fakeAsync(() => {
      spyOn(menuService, 'expandMenuPreview');
      const sidebarToggler = fixture.debugElement.query(By.css('nav.navbar'));
      sidebarToggler.triggerEventHandler('mouseenter', {
        preventDefault: () => {/**/
>>>>>>> dspace-7.6.1
        }
      });
    this.menuCollapsed.pipe(first())
      .subscribe((collapsed: boolean) => {
        this.sidebarOpen = !collapsed;
        this.sidebarClosed = collapsed;
      });
    this.sidebarExpanded = combineLatest([this.menuCollapsed, this.menuPreviewCollapsed])
      .pipe(
        map(([collapsed, previewCollapsed]) => (!collapsed || !previewCollapsed))
      );
    this.inFocus$.pipe(
      debounceTime(50),
      distinctUntilChanged(),  // disregard focusout in situations like --(focusout)-(focusin)--
      withLatestFrom(
        combineLatest([this.menuCollapsed, this.menuPreviewCollapsed])
      ),
    ).subscribe(([inFocus, [collapsed, previewCollapsed]]) => {
      if (collapsed) {
        if (inFocus && previewCollapsed) {
          this.expandPreview(new Event('focusin → expand'));
        } else if (!inFocus && !previewCollapsed) {
          this.collapsePreview(new Event('focusout → collapse'));
        }
<<<<<<< HEAD
      }
    });
    this.menuVisible = this.menuService.isMenuVisibleWithVisibleSections(this.menuID);
  }

  @HostListener('focusin')
  public handleFocusIn() {
    this.inFocus$.next(true);
  }

  @HostListener('focusout')
  public handleFocusOut() {
    this.inFocus$.next(false);
  }

  public handleMouseEnter(event: any) {
    if (!this.inFocus$.getValue()) {
      this.expandPreview(event);
    } else {
      event.preventDefault();
    }
  }

  public handleMouseLeave(event: any) {
    if (!this.inFocus$.getValue()) {
      this.collapsePreview(event);
    } else {
      event.preventDefault();
    }
  }

  /**
   * Method to change this.collapsed to false when the slide animation ends and is sliding open
   * @param event The animation event
   */
  startSlide(event: any): void {
    if (event.toState === 'expanded') {
      this.sidebarClosed = false;
    } else if (event.toState === 'collapsed') {
      this.sidebarOpen = false;
    }
  }

  /**
   * Method to change this.collapsed to false when the slide animation ends and is sliding open
   * @param event The animation event
   */
  finishSlide(event: any): void {
    if (event.fromState === 'expanded') {
      this.sidebarClosed = true;
    } else if (event.fromState === 'collapsed') {
      this.sidebarOpen = true;
    }
  }
}
=======
      });
      tick(399);
      expect(menuService.collapseMenuPreview).not.toHaveBeenCalled();
      tick(1);
      expect(menuService.collapseMenuPreview).toHaveBeenCalled();
    }));
  });
});
>>>>>>> dspace-7.6.1
