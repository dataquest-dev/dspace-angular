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

import { AuthService } from '../../../core/auth/auth.service';
import { PaginatedList } from '../../../core/data/paginated-list.model';
import { Item } from '../../../core/shared/item.model';
import {
  getFirstCompletedRemoteData,
  getRemoteDataPayload,
} from '../../../core/shared/operators';
import { CorrectionTypeDataService } from '../../../core/submission/correctiontype-data.service';
import { CorrectionType } from '../../../core/submission/models/correctiontype.model';
import {
  DsoWithdrawnReinstateModalService,
  REQUEST_REINSTATE,
  REQUEST_WITHDRAWN,
} from '../../dso-page/dso-withdrawn-reinstate-service/dso-withdrawn-reinstate-modal.service';
import { OnClickMenuItemModel } from '../menu-item/models/onclick.model';
import { MenuItemType } from '../menu-item-type.model';
import { PartialMenuSection } from '../menu-provider.model';
import { DSpaceObjectPageMenuProvider } from './helper-providers/dso.menu';

/**
 * Menu provider to create the Orcid settings related option in the DSO edit menu on person entity pages
 */
@Injectable()
export class WithdrawnReinstateItemMenuProvider extends DSpaceObjectPageMenuProvider {
  constructor(
    protected dsoWithdrawnReinstateModalService: DsoWithdrawnReinstateModalService,
    protected correctionTypeDataService: CorrectionTypeDataService,
    protected authService: AuthService,
  ) {
    super();
  }

  public getSectionsForContext(item: Item): Observable<PartialMenuSection[]> {
    // /api/config/correctiontypes/search/findByItem answers 401 to anonymous users, so this was a
    // guaranteed error on every item page. Requesting a withdrawal or a reinstatement is only
    // possible while logged in, so there is nothing to ask about before then.
    return this.authService.isAuthenticated().pipe(
      switchMap((authenticated: boolean) => authenticated
        ? this.correctionTypeDataService.findByItem(item.uuid, true).pipe(
          getFirstCompletedRemoteData(),
          getRemoteDataPayload())
        : of(null as PaginatedList<CorrectionType>)),
      map((correction: PaginatedList<CorrectionType>) => {
        return [
          {
            visible: item.isArchived && correction?.page.some((c) => c.topic === REQUEST_WITHDRAWN),
            model: {
              type: MenuItemType.ONCLICK,
              text: 'item.page.withdrawn',
              function: () => {
                this.dsoWithdrawnReinstateModalService.openCreateWithdrawnReinstateModal(item, 'request-withdrawn', item.isArchived);
              },
            } as OnClickMenuItemModel,
            icon: 'eye-slash',
          },
          {
            visible: item.isWithdrawn && correction?.page.some((c) => c.topic === REQUEST_REINSTATE),
            model: {
              type: MenuItemType.ONCLICK,
              text: 'item.page.reinstate',
              function: () => {
                this.dsoWithdrawnReinstateModalService.openCreateWithdrawnReinstateModal(item, 'request-reinstate', item.isArchived);
              },
            } as OnClickMenuItemModel,
            icon: 'eye',
          },
        ] as PartialMenuSection[];
      }),
    );
  }
}
