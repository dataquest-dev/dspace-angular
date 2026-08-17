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

import { MenuItemType } from '../menu-item-type.model';
import {
  AbstractMenuProvider,
  PartialMenuSection,
} from '../menu-provider.model';

/**
 * CLARIN/LINDAT: "Submissions" entry in the admin sidebar (ported from the v7 fork's menu.resolver.ts).
 * Links to the user's MyDSpace page and is always visible, matching the original fork behaviour.
 */
@Injectable()
export class SubmissionsMenuProvider extends AbstractMenuProvider {

  public getSections(): Observable<PartialMenuSection[]> {
    return of([
      {
        visible: true,
        model: {
          type: MenuItemType.LINK,
          text: 'menu.section.submissions',
          link: '/mydspace',
        },
        icon: 'upload',
      },
    ] as PartialMenuSection[]);
  }
}
