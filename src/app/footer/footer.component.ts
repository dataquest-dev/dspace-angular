import {
  AsyncPipe,
  DatePipe,
} from '@angular/common';
import {
  Component,
  Inject,
  OnInit,
  Optional,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import {
  Observable,
  of,
} from 'rxjs';

import {
  APP_CONFIG,
  AppConfig,
} from '../../config/app-config.interface';
import { NotifyInfoService } from '../core/coar-notify/notify-info/notify-info.service';
import { ConfigurationDataService } from '../core/data/configuration-data.service';
import { AuthorizationDataService } from '../core/data/feature-authorization/authorization-data.service';
import { FeatureID } from '../core/data/feature-authorization/feature-id';
import { RemoteData } from '../core/data/remote-data';
import { ConfigurationProperty } from '../core/shared/configuration-property.model';
import { OrejimeService } from '../shared/cookies/orejime.service';
import { hasValue } from '../shared/empty.util';

@Component({
  selector: 'ds-base-footer',
  styleUrls: ['footer.component.scss'],
  templateUrl: 'footer.component.html',
  imports: [
    AsyncPipe,
    DatePipe,
    RouterLink,
    TranslateModule,
  ],
})
export class FooterComponent implements OnInit {
  dateObj: number = Date.now();

  /**
   * A boolean representing if to show or not the top footer container
   */
  showTopFooter = false;
  showCookieSettings = false;
  showPrivacyPolicy: boolean;
  showEndUserAgreement: boolean;
  showSendFeedback$: Observable<boolean>;
  coarLdnEnabled$: Observable<boolean>;

  /**
   * The company URL which customised this DSpace (backend property themed.by.url)
   */
  themedByUrl$: Observable<RemoteData<ConfigurationProperty>>;

  /**
   * The company name which customised this DSpace (backend property themed.by.company.name)
   */
  themedByCompanyName$: Observable<RemoteData<ConfigurationProperty>>;

  constructor(
    @Optional() public cookies: OrejimeService,
    protected authorizationService: AuthorizationDataService,
    protected notifyInfoService: NotifyInfoService,
    protected configurationDataService: ConfigurationDataService,
    @Inject(APP_CONFIG) protected appConfig: AppConfig,
  ) {
  }

  ngOnInit(): void {
    this.showCookieSettings = this.appConfig.info.enableCookieConsentPopup;
    this.showPrivacyPolicy = this.appConfig.info.enablePrivacyStatement;
    this.showEndUserAgreement = this.appConfig.info.enableEndUserAgreement;
    this.coarLdnEnabled$ = this.appConfig.info.enableCOARNotifySupport ? this.notifyInfoService.isCoarConfigEnabled() : of(false);
    this.showSendFeedback$ = this.authorizationService.isAuthorized(FeatureID.CanSendFeedback);
    this.loadThemedByProps();
  }

  openCookieSettings() {
    if (hasValue(this.cookies) && this.cookies.showSettings instanceof Function) {
      this.cookies.showSettings();
    }
    return false;
  }

  private loadThemedByProps() {
    this.themedByUrl$ = this.configurationDataService.findByPropertyName('themed.by.url');
    this.themedByCompanyName$ = this.configurationDataService.findByPropertyName('themed.by.company.name');
  }
}
