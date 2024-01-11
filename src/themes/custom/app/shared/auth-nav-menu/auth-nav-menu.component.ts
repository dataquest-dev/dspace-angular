import { Component } from '@angular/core';
import {
  AuthNavMenuComponent as BaseComponent,
} from '../../../../../app/shared/auth-nav-menu/auth-nav-menu.component';
import { fadeInOut, fadeOut } from '../../../../../app/shared/animations/fade';

/**
 * Component representing the {@link AuthNavMenuComponent} of a page
 */
@Component({
  selector: 'ds-auth-nav-menu',
<<<<<<< HEAD
  // templateUrl: 'auth-nav-menu.component.html',
  templateUrl: '../../../../../app/shared/auth-nav-menu/auth-nav-menu.component.html',
  // styleUrls: ['auth-nav-menu.component.scss'],
=======
  // templateUrl: './auth-nav-menu.component.html',
  templateUrl: '../../../../../app/shared/auth-nav-menu/auth-nav-menu.component.html',
  // styleUrls: ['./auth-nav-menu.component.scss'],
>>>>>>> dspace-7.6.1
  styleUrls: ['../../../../../app/shared/auth-nav-menu/auth-nav-menu.component.scss'],
  animations: [fadeInOut, fadeOut]
})
export class AuthNavMenuComponent extends BaseComponent {
}
