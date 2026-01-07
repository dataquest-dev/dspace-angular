import { AsyncPipe } from '@angular/common';
import { Component } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';

import { HomeNewsComponent as BaseComponent } from '../../../../../app/home-page/home-news/home-news.component';

@Component({
  selector: 'ds-themed-home-news',
  // styleUrls: ['./home-news.component.scss'],
  styleUrls: ['../../../../../app/home-page/home-news/home-news.component.scss'],
  // templateUrl: './home-news.component.html'
  templateUrl: '../../../../../app/home-page/home-news/home-news.component.html',
  standalone: true,
  imports: [
    AsyncPipe,
    TranslateModule,
  ],
})
export class HomeNewsComponent extends BaseComponent {
}
