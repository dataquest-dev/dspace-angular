import { Component } from '@angular/core';
import { IdpDiscoveryComponent } from '@dspace/idp-discovery';
import { TranslateModule } from '@ngx-translate/core';
import { ThemedLogInComponent } from 'src/app/shared/log-in/themed-log-in.component';

import { LoginPageComponent as BaseComponent } from '../../../../app/login-page/login-page.component';

@Component({
  selector: 'ds-themed-login-page',
  // styleUrls: ['./login-page.component.scss'],
  styleUrls: ['../../../../app/login-page/login-page.component.scss'],
  // templateUrl: './login-page.component.html'
  templateUrl: '../../../../app/login-page/login-page.component.html',
  imports: [
    ThemedLogInComponent,
    TranslateModule,
    IdpDiscoveryComponent,
  ],
})
export class LoginPageComponent extends BaseComponent {
}
