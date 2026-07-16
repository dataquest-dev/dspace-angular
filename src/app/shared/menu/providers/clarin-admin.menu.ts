/**
 * The contents of this file are subject to the license and copyright
 * detailed in the LICENSE and NOTICE files at the root of the source
 * tree and available online at
 *
 * http://www.dspace.org/license/
 */

import { Injectable } from '@angular/core';
import {
  combineLatest,
  map,
  Observable,
} from 'rxjs';

import {
  getLicensesManageTablePath,
  getLicensesModulePath,
} from '../../../app-routing-paths';
import { AuthorizationDataService } from '../../../core/data/feature-authorization/authorization-data.service';
import { FeatureID } from '../../../core/data/feature-authorization/feature-id';
import { getHandleTableModulePath } from '../../../handle-page/handle-page-routing-paths';
import { MenuItemType } from '../menu-item-type.model';
import {
  AbstractMenuProvider,
  PartialMenuSection,
} from '../menu-provider.model';

/**
 * CLARIN/LINDAT admin sidebar entries (ported from the v7 fork's menu.resolver.ts):
 * the handle table, the ePIC handle table and the license administration.
 */
@Injectable()
export class ClarinAdminMenuProvider extends AbstractMenuProvider {
  constructor(
    protected authorizationService: AuthorizationDataService,
  ) {
    super();
  }

  public getSections(): Observable<PartialMenuSection[]> {
    return combineLatest([
      this.authorizationService.isAuthorized(FeatureID.AdministratorOf),
    ]).pipe(
      map(([isSiteAdmin]) => {
        return [
          {
            visible: isSiteAdmin,
            model: {
              type: MenuItemType.LINK,
              text: 'menu.section.handle',
              link: getHandleTableModulePath(),
            },
            icon: 'table',
          },
          {
            visible: isSiteAdmin,
            model: {
              type: MenuItemType.LINK,
              text: 'menu.section.epic-handle',
              link: '/epic-handle-table/prefix',
            },
            icon: 'grip-lines',
          },
          {
            visible: isSiteAdmin,
            model: {
              type: MenuItemType.LINK,
              text: 'menu.section.licenses',
              link: getLicensesModulePath() + getLicensesManageTablePath(),
            },
            icon: 'scroll',
          },
        ] as PartialMenuSection[];
      }),
    );
  }
}
