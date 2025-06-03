import { Component, OnInit } from '@angular/core';
import { AuthService } from '../core/auth/auth.service';
import { ServerResponseService } from '../core/services/server-response.service';
import { Observable } from 'rxjs';
import { ConfigurationDataService } from '../core/data/configuration-data.service';
import { map } from 'rxjs';

/**
 * This component representing the `Forbidden` DSpace page.
 */
@Component({
  selector: 'ds-forbidden',
  templateUrl: './forbidden.component.html',
  styleUrls: ['./forbidden.component.scss']
})
export class ForbiddenComponent implements OnInit {

  emailToContact$: Observable<string>;

  /**
   * Initialize instance variables
   *
   * @param {AuthService} authService
   * @param {ServerResponseService} responseService
   */
  constructor(private authService: AuthService, private responseService: ServerResponseService, private configService: ConfigurationDataService) {
    this.responseService.setForbidden();
  }

  /**
   * Remove redirect url from the state
   */
  ngOnInit(): void {
    this.authService.clearRedirectUrl();
    this.emailToContact$ = this.configService.findByPropertyName('lr.help.mail').pipe(
      map(remoteData => remoteData.payload?.values[0])
    );
  }

}
