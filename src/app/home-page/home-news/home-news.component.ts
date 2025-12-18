import { AsyncPipe } from '@angular/common';
import {
  Component,
  OnInit,
} from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { BehaviorSubject } from 'rxjs';

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
export class HomeNewsComponent implements OnInit {
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

