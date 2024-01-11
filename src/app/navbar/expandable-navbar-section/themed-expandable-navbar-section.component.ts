import { Component } from '@angular/core';
import { ThemedComponent } from '../../shared/theme-support/themed.component';
import { ExpandableNavbarSectionComponent } from './expandable-navbar-section.component';
import { rendersSectionForMenu } from '../../shared/menu/menu-section.decorator';
import { MenuID } from '../../shared/menu/menu-id.model';

/**
 * Themed wrapper for ExpandableNavbarSectionComponent
 */
@Component({
<<<<<<< HEAD
  /* eslint-disable @angular-eslint/component-selector */
  selector: 'li[ds-themed-expandable-navbar-section]',
=======
  selector: 'ds-themed-expandable-navbar-section',
>>>>>>> dspace-7.6.1
  styleUrls: [],
  templateUrl: '../../shared/theme-support/themed.component.html',
})
@rendersSectionForMenu(MenuID.PUBLIC, true)
export class ThemedExpandableNavbarSectionComponent  extends ThemedComponent<ExpandableNavbarSectionComponent> {
  protected getComponentName(): string {
    return 'ExpandableNavbarSectionComponent';
  }

  protected importThemedComponent(themeName: string): Promise<any> {
    return import(`../../../themes/${themeName}/app/navbar/expandable-navbar-section/expandable-navbar-section.component`);
  }

  protected importUnthemedComponent(): Promise<any> {
    return import(`./expandable-navbar-section.component`);
  }
}
