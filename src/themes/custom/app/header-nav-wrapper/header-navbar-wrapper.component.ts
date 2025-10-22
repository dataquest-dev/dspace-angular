import {
  AsyncPipe,
  NgClass,
} from '@angular/common';
import { Component } from '@angular/core';

import { TranslateModule } from '@ngx-translate/core';
import { slideMobileNav } from 'src/app/shared/animations/slide';
import { HeaderNavbarWrapperComponent as BaseComponent } from '../../../../app/header-nav-wrapper/header-navbar-wrapper.component';
import { ThemedHeaderComponent } from '../../../../app/header/themed-header.component';
import { ThemedNavbarComponent } from '../../../../app/navbar/themed-navbar.component';

@Component({
  selector: 'ds-themed-header-navbar-wrapper',
  styleUrls: ['./header-navbar-wrapper.component.scss'],
  // styleUrls: ['../../../../app/header-nav-wrapper/header-navbar-wrapper.component.scss'],
  templateUrl: './header-navbar-wrapper.component.html',
  // templateUrl: '../../../../app/header-nav-wrapper/header-navbar-wrapper.component.html',
  standalone: true,
  imports: [
    AsyncPipe,
    NgClass,
    ThemedHeaderComponent,
    ThemedNavbarComponent,
    TranslateModule,
  ],
  animations: [slideMobileNav],
})
export class HeaderNavbarWrapperComponent extends BaseComponent {
}
