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

import { DSpaceObject } from '../../../core/shared/dspace-object.model';
import { LinkMenuItemModel } from '../menu-item/models/link.model';
import { MenuItemType } from '../menu-item-type.model';
import { PartialMenuSection } from '../menu-provider.model';
import { DSpaceObjectPageMenuProvider } from './helper-providers/dso.menu';

/**
 * CLARIN/LINDAT: menu provider to create the scoped-search option in the DSO edit menu of a
 * Community or Collection. It opens /search restricted to that container, on the first page.
 *
 * The section is visible unconditionally - a scoped search is a public action, exactly as it was on
 * 7.x, where the same entry was added by DSOEditMenuResolver without an authorization check.
 */
@Injectable()
export class ComColSearchMenuProvider extends DSpaceObjectPageMenuProvider {

  public getSectionsForContext(dso: DSpaceObject): Observable<PartialMenuSection[]> {
    return of([
      {
        visible: true,
        model: {
          type: MenuItemType.LINK,
          disabled: false,
          text: 'search.title',
          link: '/search',
          queryParams: {
            'spc.page': '1',
            scope: dso.uuid,
          },
        } as LinkMenuItemModel,
        icon: 'search',
      },
    ] as PartialMenuSection[]);
  }
}
