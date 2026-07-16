import {
  AsyncPipe,
  NgFor,
  NgIf,
} from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  NgbCarouselConfig,
  NgbCarouselModule,
} from '@ng-bootstrap/ng-bootstrap';
import { TranslateModule } from '@ngx-translate/core';

import { HomePageComponent as BaseComponent } from '../../../../app/home-page/home-page.component';
import { ClarinItemBoxViewComponent } from '../../../../app/shared/clarin-item-box-view/clarin-item-box-view.component';
import { RSSComponent } from '../../../../app/shared/rss-feed/rss.component';
import { ThemedSearchFormComponent } from '../../../../app/shared/search-form/themed-search-form.component';

@Component({
  selector: 'ds-themed-home-page',
  // styleUrls: ['./home-page.component.scss'],
  styleUrls: ['../../../../app/home-page/home-page.component.scss'],
  // templateUrl: './home-page.component.html'
  templateUrl: '../../../../app/home-page/home-page.component.html',
  providers: [NgbCarouselConfig],
  imports: [
    AsyncPipe,
    ClarinItemBoxViewComponent,
    NgbCarouselModule,
    NgFor,
    NgIf,
    RouterLink,
    RSSComponent,
    ThemedSearchFormComponent,
    TranslateModule,
  ],
})
export class HomePageComponent extends BaseComponent {
}
