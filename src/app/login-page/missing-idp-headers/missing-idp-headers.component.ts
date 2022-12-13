import { Component, OnInit } from '@angular/core';
import {Observable} from 'rxjs';
import {RemoteData} from '../../core/data/remote-data';
import {ConfigurationProperty} from '../../core/shared/configuration-property.model';
import {HELP_DESK_PROPERTY} from '../../item-page/tombstone/tombstone.component';
import {ConfigurationDataService} from '../../core/data/configuration-data.service';

@Component({
  selector: 'ds-missing-idp-headers',
  templateUrl: './missing-idp-headers.component.html',
  styleUrls: ['./missing-idp-headers.component.scss']
})
export class MissingIdpHeadersComponent implements OnInit {

  /**
   * The mail for the help desk is loaded from the server.
   */
  helpDesk$: Observable<RemoteData<ConfigurationProperty>>;

  constructor(protected configurationDataService: ConfigurationDataService) { }

  ngOnInit(): void {
    this.loadHelpDeskEmail();
  }

  private loadHelpDeskEmail() {
    this.helpDesk$ = this.configurationDataService.findByPropertyName(HELP_DESK_PROPERTY);
  }
}
