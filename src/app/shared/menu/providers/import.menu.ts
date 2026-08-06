/**
 * The contents of this file are subject to the license and copyright
 * detailed in the LICENSE and NOTICE files at the root of the source
 * tree and available online at
 *
 * http://www.dspace.org/license/
 */

import { Injectable } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import {
  map,
  Observable,
  of,
  switchMap,
} from 'rxjs';

import { AuthorizationDataService } from '../../../core/data/feature-authorization/authorization-data.service';
import { FeatureID } from '../../../core/data/feature-authorization/feature-id';
import {
  METADATA_IMPORT_SCRIPT_NAME,
  ScriptDataService,
} from '../../../core/data/processes/script-data.service';
import { MenuItemType } from '../menu-item-type.model';
import { PartialMenuSection } from '../menu-provider.model';
import { AbstractExpandableMenuProvider } from './helper-providers/expandable-menu-provider';

/**
 * Menu provider to create the "Import" menu (and subsections) in the admin sidebar
 */
@Injectable()
export class ImportMenuProvider extends AbstractExpandableMenuProvider {
  constructor(
    protected authorizationService: AuthorizationDataService,
    protected scriptDataService: ScriptDataService,
    protected modalService: NgbModal,
  ) {
    super();
  }

  public getTopSection(): Observable<PartialMenuSection> {
    return of(
      {
        model: {
          type: MenuItemType.TEXT,
          text: 'menu.section.import',
        },
        icon: 'file-import',
        visible: true,
      },
    );
  }

  public getSubSections(): Observable<PartialMenuSection[]> {
    return this.authorizationService.isAuthorized(FeatureID.AdministratorOf).pipe(
      // Ask about the script only once we know the user may run it. /api/system/scripts/<name>
      // answers 401 to anyone who cannot execute it, so for an anonymous visitor this request was
      // a guaranteed error on every single page load.
      switchMap((authorized: boolean) => authorized
        ? this.scriptDataService.scriptWithNameExistsAndCanExecute(METADATA_IMPORT_SCRIPT_NAME)
        : of(false)),
      map((canImportMetadata: boolean) => {
        return [
          {
            visible: canImportMetadata,
            model: {
              type: MenuItemType.LINK,
              text: 'menu.section.import_metadata',
              link: '/admin/metadata-import',
            },
          },
          {
            visible: canImportMetadata,
            model: {
              type: MenuItemType.LINK,
              text: 'menu.section.import_batch',
              link: '/admin/batch-import',
            },
          },
        ];
      }),
    );
  }
}
