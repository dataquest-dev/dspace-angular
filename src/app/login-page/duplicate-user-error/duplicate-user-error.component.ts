import { AsyncPipe } from '@angular/common';
import {
  Component,
  OnInit,
} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { Observable } from 'rxjs';

import { ConfigurationDataService } from '../../core/data/configuration-data.service';
import { RemoteData } from '../../core/data/remote-data';
import { ConfigurationProperty } from '../../core/shared/configuration-property.model';
import { HELP_DESK_PROPERTY } from '../../item-page/tombstone/tombstone.component';

@Component({
  imports: [
    AsyncPipe,
    TranslateModule,
  ],
  selector: 'ds-duplicate-user-error',
  templateUrl: './duplicate-user-error.component.html',
  styleUrls: ['./duplicate-user-error.component.scss'],
})
export class DuplicateUserErrorComponent implements OnInit {

  /**
   * The mail for the help desk is loaded from the server. The user could contact the administrator.
   */
  helpDesk$: Observable<RemoteData<ConfigurationProperty>>;

  /**
   * The email of the duplicate user.
   */
  email = '';

  constructor(protected configurationDataService: ConfigurationDataService,
              public route: ActivatedRoute) { }

  ngOnInit(): void {
    this.loadHelpDeskEmail();

    // Load the netid from the URL.
    this.email = this.route.snapshot.queryParams.email;
  }

  private loadHelpDeskEmail() {
    this.helpDesk$ = this.configurationDataService.findByPropertyName(HELP_DESK_PROPERTY);
  }

}
