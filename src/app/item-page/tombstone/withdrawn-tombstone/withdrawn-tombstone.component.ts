import { AsyncPipe } from '@angular/common';
import {
  Component,
  Input,
  OnInit,
} from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { Observable } from 'rxjs';

import { ConfigurationDataService } from '../../../core/data/configuration-data.service';
import { RemoteData } from '../../../core/data/remote-data';
import { ConfigurationProperty } from '../../../core/shared/configuration-property.model';
import { HELP_DESK_PROPERTY } from '../tombstone.constants';

@Component({
  imports: [
    AsyncPipe,
    TranslateModule,
  ],
  selector: 'ds-withdrawn-tombstone',
  templateUrl: './withdrawn-tombstone.component.html',
  styleUrls: ['./withdrawn-tombstone.component.scss'],
})
export class WithdrawnTombstoneComponent implements OnInit {

  /**
   * The reason why the item was withdrawn
   */
  @Input() reasonOfWithdrawal: string;

  /**
   * The Item name of the Item
   */
  @Input() itemName: string;

  /**
   * The authors of the item is loaded from the metadata: `dc.contributor.author` and `dc.dontributor.others`
   */
  @Input() authors: string[];

  /**
   * The mail for the help desk is loaded from the server.
   */
  helpDesk$: Observable<RemoteData<ConfigurationProperty>>;

  constructor(private configurationDataService: ConfigurationDataService) { }

  ngOnInit(): void {
    this.helpDesk$ = this.configurationDataService.findByPropertyName(HELP_DESK_PROPERTY);
  }

}
