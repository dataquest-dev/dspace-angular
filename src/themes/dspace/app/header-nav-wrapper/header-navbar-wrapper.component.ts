import { Component } from '@angular/core';

import { ThemedHeaderComponent } from '../../../../app/header/themed-header.component';
import { HeaderNavbarWrapperComponent as BaseComponent } from '../../../../app/header-nav-wrapper/header-navbar-wrapper.component';

/**
 * This component represents a wrapper for the LINDAT/CLARIAH-CZ header (which contains the
 * complete navigation, so no separate navbar is rendered - v7 production parity).
 */
@Component({
  selector: 'ds-themed-header-navbar-wrapper',
  styleUrls: ['header-navbar-wrapper.component.scss'],
  templateUrl: 'header-navbar-wrapper.component.html',
  imports: [
    ThemedHeaderComponent,
  ],
})
export class HeaderNavbarWrapperComponent extends BaseComponent {
}
