import {
  Component,
  OnInit,
} from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';

import { LocaleService } from '../core/locale/locale.service';
import { LogOutComponent } from '../shared/log-out/log-out.component';

@Component({
  selector: 'ds-base-logout-page',
  styleUrls: ['./logout-page.component.scss'],
  templateUrl: './logout-page.component.html',
  standalone: true,
  imports: [
    LogOutComponent,
    TranslateModule,
  ],
})
export class LogoutPageComponent implements OnInit {

  logoSrc: string;

  constructor(private localeService: LocaleService) {}

  ngOnInit() {
    this.setLogo();
  }

  setLogo() {
    this.logoSrc = this.localeService.getCurrentLanguageCode() === 'cs'
      ? '/assets/images/mendel-uni-logo-cs.svg'
      : '/assets/images/mendel-uni-logo-en.svg';
  }

}
