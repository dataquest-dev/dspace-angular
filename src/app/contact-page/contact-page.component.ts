import {
  Component,
  OnInit,
} from '@angular/core';
import { RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';

import { ConfigurationDataService } from '../core/data/configuration-data.service';

@Component({
  imports: [
    RouterModule,
    TranslateModule,
  ],
  selector: 'ds-base-contact-page',
  styleUrls: ['./contact-page.component.scss'],
  templateUrl: './contact-page.component.html',
})
export class ContactPageComponent implements OnInit {
  emailToContact: string;
  constructor(
    private configService: ConfigurationDataService,
  ) {}

  ngOnInit(): void {
    this.configService.findByPropertyName('lr.help.mail').subscribe(remoteData => {
      this.emailToContact = remoteData.payload.values[0];
    });
  }
}
