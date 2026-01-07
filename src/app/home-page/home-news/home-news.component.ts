import { AsyncPipe } from '@angular/common';
import { Component } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { map } from 'rxjs/operators';

import { ConfigurationDataService } from '../../core/data/configuration-data.service';

@Component({
  selector: 'ds-base-home-news',
  styleUrls: ['./home-news.component.scss'],
  templateUrl: './home-news.component.html',
  standalone: true,
  imports: [
    AsyncPipe,
    TranslateModule,
  ],
})

/**
 * Component to render the news section on the home page
 */
export class HomeNewsComponent {
  emailToContact$ = this.configService.findByPropertyName('mail.helpdesk')
    .pipe(map(remoteData => remoteData?.payload?.values?.[0] || ''));

  constructor(
      private configService: ConfigurationDataService,
  ) {}
}

