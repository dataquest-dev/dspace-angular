import { Component, OnInit, Optional } from '@angular/core';
import { hasValue } from '../shared/empty.util';
import { KlaroService } from '../shared/cookies/klaro.service';
import { environment } from '../../environments/environment';
import { filter, Observable } from 'rxjs';
import { AuthorizationDataService } from '../core/data/feature-authorization/authorization-data.service';
import { FeatureID } from '../core/data/feature-authorization/feature-id';
import { RemoteData } from '../core/data/remote-data';
import { ConfigurationProperty } from '../core/shared/configuration-property.model';
import { ConfigurationDataService } from '../core/data/configuration-data.service';

import { Angulartics2Matomo } from 'angulartics2';
import { NavigationEnd } from '@angular/router';

@Component({
  selector: 'ds-footer',
  styleUrls: ['footer.component.scss'],
  templateUrl: 'footer.component.html'
})
export class FooterComponent implements OnInit {
  dateObj: number = Date.now();

  /**
   * A boolean representing if to show or not the top footer container
   */
  showTopFooter = false;
  showPrivacyPolicy = environment.info.enablePrivacyStatement;
  showEndUserAgreement = environment.info.enableEndUserAgreement;
  showSendFeedback$: Observable<boolean>;

  /**
   * The company url which customized this DSpace with redirection to the DSpace section
   */
  themedByUrl$: Observable<RemoteData<ConfigurationProperty>>;

  /**
   * The company name which customized this DSpace with redirection to the DSpace section
   */
  themedByCompanyName$: Observable<RemoteData<ConfigurationProperty>>;
  router: any;

  constructor(
    @Optional() private cookies: KlaroService,
    private authorizationService: AuthorizationDataService,
    protected configurationDataService: ConfigurationDataService
  ) {
    this.showSendFeedback$ = this.authorizationService.isAuthorized(FeatureID.CanSendFeedback);
  }

  ngOnInit(): void {
    this.loadThemedByProps();
    this.initializeMatomoTracker();

    this.router.events.subscribe(() => {
      this.initializeMatomoTracker();
    });
  }
  showCookieSettings() {
    if (hasValue(this.cookies)) {
      this.cookies.showSettings();
    }
    return false;
  }

  private loadThemedByProps() {
    this.themedByUrl$ = this.configurationDataService.findByPropertyName('themed.by.url');
    this.themedByCompanyName$ = this.configurationDataService.findByPropertyName('themed.by.company.name');
  }

  private initializeMatomoTracker() {
    const _paq = (window as any)._paq || [];
    _paq.push(["setDocumentTitle", location.hostname + "/" + document.title]);
    _paq.push(["setCookieDomain", "*.mff.cuni.cz"]);
    _paq.push(["setDomains", ["*.mff.cuni.cz"]]);
    _paq.push(['setUserId', this.getUserId()]);
    _paq.push(['setCustomVariable', 1, 'lang', 'en', 'visit']);
    _paq.push(['trackPageView']);
    _paq.push(['enableLinkTracking']);
    const u = '//dev-5.pc:8135/';
    _paq.push(['setTrackerUrl', u + 'matomo.php']);
    _paq.push(['setSiteId', 1]);

    const d = document;
    const g = d.createElement('script');
    const s = d.getElementsByTagName('script')[0];
    g.type = 'text/javascript';
    g.async = true;
    g.defer = true;
    g.src = u + 'piwik.js';
    s.parentNode?.insertBefore(g, s);
  }

  private getUserId() {
    return 'user123'; // change later as well as other above
  }
}
