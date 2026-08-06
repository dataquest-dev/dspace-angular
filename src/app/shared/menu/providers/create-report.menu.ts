/**
 * The contents of this file are subject to the license and copyright
 * detailed in the LICENSE and NOTICE files at the root of the source
 * tree and available online at
 *
 * http://www.dspace.org/license/
 */

import { Injectable } from '@angular/core';
import {
  Observable,
  of,
} from 'rxjs';
import {
  map,
  switchMap,
} from 'rxjs/operators';

import { ConfigurationDataService } from '../../../core/data/configuration-data.service';
import { AuthorizationDataService } from '../../../core/data/feature-authorization/authorization-data.service';
import { FeatureID } from '../../../core/data/feature-authorization/feature-id';
import { RemoteData } from '../../../core/data/remote-data';
import { ConfigurationProperty } from '../../../core/shared/configuration-property.model';
import { getFirstCompletedRemoteData } from '../../../core/shared/operators';
import { LinkMenuItemModel } from '../menu-item/models/link.model';
import { TextMenuItemModel } from '../menu-item/models/text.model';
import { MenuItemType } from '../menu-item-type.model';
import { PartialMenuSection } from '../menu-provider.model';
import { AbstractExpandableMenuProvider } from './helper-providers/expandable-menu-provider';

/**
 * Menu provider to create the "Reports" menu (and subsections) in the admin sidebar
 */
@Injectable()
export class CreateReportMenuProvider extends AbstractExpandableMenuProvider {
  constructor(
    protected authorizationService: AuthorizationDataService,
    protected configurationDataService: ConfigurationDataService,
  ) {
    super();
  }

  /**
   * Whether the Reports menu should be shown at all: the user is a site administrator *and* the
   * content report feature is switched on in the backend.
   *
   * The order matters. The authorization is checked first and the configuration is only fetched for
   * an administrator, because /api/config/properties/contentreport.enable answers 404 whenever the
   * property is not set — which is the default — and that request used to be fired on every page
   * load for every visitor, including anonymous ones who can never see this menu.
   */
  private isReportMenuAvailable(): Observable<boolean> {
    return this.authorizationService.isAuthorized(FeatureID.AdministratorOf).pipe(
      switchMap((isSiteAdmin: boolean) => isSiteAdmin
        ? this.configurationDataService.findByPropertyName('contentreport.enable').pipe(
          getFirstCompletedRemoteData(),
          map((res: RemoteData<ConfigurationProperty>) => res.hasSucceeded && res.payload && res.payload.values[0] === 'true'),
        )
        : of(false)),
    );
  }

  getSubSections(): Observable<PartialMenuSection[]> {
    return this.isReportMenuAvailable().pipe(
      map((available: boolean) => {
        return [
          /* Collections Report */
          {
            visible: available,
            model: {
              type: MenuItemType.LINK,
              text: 'menu.section.reports.collections',
              link: '/admin/reports/collections',
            } as LinkMenuItemModel,
            icon: 'user-check',
          },
          /* Queries Report */
          {
            visible: available,
            model: {
              type: MenuItemType.LINK,
              text: 'menu.section.reports.queries',
              link: '/admin/reports/queries',
            } as LinkMenuItemModel,
            icon: 'user-check',
          },
        ];
      }));
  }

  getTopSection(): Observable<PartialMenuSection> {
    return this.isReportMenuAvailable().pipe(
      map((available: boolean) => {
        return {
          visible: available,
          model: {
            type: MenuItemType.TEXT,
            text: 'menu.section.reports',
          } as TextMenuItemModel,
          icon: 'file-alt',
        };
      }));
  }
}
