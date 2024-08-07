import { Component, Injector, OnInit } from '@angular/core';
import { NavbarComponent as BaseComponent } from '../../../../app/navbar/navbar.component';
import { slideMobileNav } from '../../../../app/shared/animations/slide';
import { MenuService } from '../../../../app/shared/menu/menu.service';
import { HostWindowService } from '../../../../app/shared/host-window.service';
import { BrowseService } from '../../../../app/core/browse/browse.service';
import { AuthorizationDataService } from '../../../../app/core/data/feature-authorization/authorization-data.service';
import { ActivatedRoute, Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { AppState } from '../../../../app/app.reducer';
import { ThemeService } from '../../../../app/shared/theme-support/theme.service';
import { BehaviorSubject } from 'rxjs';

export const HOME_URL = '/home';

/**
 * Component representing the public navbar
 */
@Component({
  selector: 'ds-navbar',
  styleUrls: ['./navbar.component.scss'],
  templateUrl: './navbar.component.html',
  animations: [slideMobileNav]
})
export class NavbarComponent extends BaseComponent implements OnInit {

  isHomePage: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);

  constructor(protected menuService: MenuService,
              protected injector: Injector,
              public windowService: HostWindowService,
              public browseService: BrowseService,
              public authorizationService: AuthorizationDataService,
              public route: ActivatedRoute,
              protected themeService: ThemeService,
              protected store: Store<AppState>,
              private router: Router) {
    super(menuService, injector, windowService, browseService, authorizationService, route, themeService, store);
  }

  ngOnInit(): void {
    super.ngOnInit();
    this.router.events.subscribe(() => {
      this.isHomePage.next(this.router.url === HOME_URL);
    });
  }
}
