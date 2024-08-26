import { Component } from '@angular/core';
import { HomeNewsComponent as BaseComponent } from '../../../../../app/home-page/home-news/home-news.component';
import { LocaleService } from '../../../../../app/core/locale/locale.service';

const HOME_PAGE_IMAGE_PATH = 'assets/images/home-page-image-';

@Component({
  selector: 'ds-home-news',
  styleUrls: ['./home-news.component.scss'],
  templateUrl: './home-news.component.html'
})
/**
 * Component to render the news section on the home page
 */
export class HomeNewsComponent extends BaseComponent {


  constructor(private localeService: LocaleService) {
    super();
  }

  /**
   * Check if current czech or not
   */
  isCsLocale() {
    return this.localeService.getCurrentLanguageCode() === 'cs';
  }

  /**
   * Decide which image to show on the home page based on the current locale (cs, en)
   */
  getCorrectHomePageImage() {
    return this.isCsLocale() ? HOME_PAGE_IMAGE_PATH + 'cs.webp' : HOME_PAGE_IMAGE_PATH + 'en.webp';
  }
}
