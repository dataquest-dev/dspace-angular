import {
  Component,
  DestroyRef,
  inject,
  OnInit,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TranslateModule } from '@ngx-translate/core';

import { ConfigurationDataService } from '../../core/data/configuration-data.service';

@Component({
  selector: 'ds-base-home-news',
  styleUrls: ['./home-news.component.scss'],
  templateUrl: './home-news.component.html',
  standalone: true,
  imports: [
    TranslateModule,
  ],
})

/**
 * Component to render the news section on the home page
 */
export class HomeNewsComponent implements OnInit {
  private destroyRef = inject(DestroyRef);
  emailToContact = '';

  constructor(
      private configService: ConfigurationDataService,
  ) {}

  ngOnInit(): void {
    this.configService.findByPropertyName('mail.helpdesk')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(remoteData => {
        this.emailToContact = remoteData?.payload?.values?.[0] || '';
      });
  }
}

