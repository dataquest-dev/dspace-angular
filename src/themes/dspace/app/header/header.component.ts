import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { ClarinNavbarTopComponent } from 'src/app/clarin-navbar-top/clarin-navbar-top.component';

import { HeaderComponent as BaseComponent } from '../../../../app/header/header.component';

/**
 * Represents the LINDAT/CLARIAH-CZ header: the CLARIN top bar (language flags + AAI/DiscoJuice
 * sign-on) followed by the dark lindat-common navigation bar with the LINDAT/CLARIAH-CZ branding
 * and the main site menu. Ported from the LINDAT v7 production theme
 * (lindat-merge-dtq-dev-2025-03-07).
 */
@Component({
  selector: 'ds-themed-header',
  styleUrls: ['header.component.scss'],
  templateUrl: 'header.component.html',
  imports: [
    ClarinNavbarTopComponent,
    RouterLink,
    TranslateModule,
  ],
})
export class HeaderComponent extends BaseComponent {
}
