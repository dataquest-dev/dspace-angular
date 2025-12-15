import {
  Component,
  OnInit,
} from '@angular/core';
import { BehaviorSubject } from 'rxjs';

import { ConfigurationDataService } from '../core/data/configuration-data.service';

@Component({
  selector: 'ds-base-contact-page',
  styleUrls: ['./contact-page.component.scss'],
  templateUrl: './contact-page.component.html'
})
export class ContactPageComponent implements OnInit {
  emailToContact$: BehaviorSubject<string> = new BehaviorSubject<string>('');

  constructor(
    private configService: ConfigurationDataService,
  ) {}

  ngOnInit(): void {
    this.configService.findByPropertyName('mail.helpdesk').subscribe(remoteData => {
      this.emailToContact$.next(remoteData?.payload?.values?.[0] || '');
    });
  }
}
