import { Component } from '@angular/core';
import { HeaderComponent as BaseComponent } from '../../../../app/header/header.component';
import { HOME_URL } from '../navbar/navbar.component';
import { BehaviorSubject } from 'rxjs';
import { MenuService } from '../../../../app/shared/menu/menu.service';
import { HostWindowService } from '../../../../app/shared/host-window.service';
import { Router } from '@angular/router';

/**
 * Represents the header with the logo and simple navigation
 */
@Component({
  selector: 'ds-header',
  styleUrls: ['header.component.scss'],
  templateUrl: 'header.component.html',
})
export class HeaderComponent extends BaseComponent {
  constructor(protected menuService: MenuService,
              protected windowService: HostWindowService,
              protected router: Router) {
    super(menuService, windowService);
  }

  isHomePage: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);

  ngOnInit(): void {
    super.ngOnInit();

    // Redirect to home page if the user is already on the home page to activate router event to hide the zcu icon
    if (this.router.url === HOME_URL) {
      void this.router.navigate([HOME_URL]);
    }

    this.router.events.subscribe(() => {
      // Check if the current page is the home page. The `this.router.url === HOME_URL` check must be in this
      // subscription.
      this.isHomePage.next(this.router.url === HOME_URL);
    });
  }
}
