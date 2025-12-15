import { Component } from '@angular/core';

import { ContactPageComponent } from './contact-page.component';
import { ThemedComponent } from '../shared/theme-support/themed.component';

/**
 * Themed wrapper for CollectionPageComponent
 */
@Component({
  selector: 'ds-contact-page',
  styleUrls: [],
  templateUrl: '../shared/theme-support/themed.component.html',
  standalone: true,
  imports: [ContactPageComponent],
})
export class ThemedContactPageComponent extends ThemedComponent<ContactPageComponent> {
  protected getComponentName(): string {
    return 'ContactPageComponent';
  }

  protected importThemedComponent(themeName: string): Promise<any> {
    return import(`../../themes/${themeName}/app/contact-page/contact-page.component`);
  }

  protected importUnthemedComponent(): Promise<any> {
    return import(`./contact-page.component`);
  }

}
