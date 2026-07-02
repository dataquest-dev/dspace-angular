import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { ItemPageResolver } from './item-page.resolver';
import { AuthenticatedGuard } from '../core/auth/authenticated.guard';
import { ItemBreadcrumbResolver } from '../core/breadcrumbs/item-breadcrumb.resolver';
import { VersionResolver } from './version-page/version.resolver';
import { DSOBreadcrumbsService } from '../core/breadcrumbs/dso-breadcrumbs.service';
import { LinkService } from '../core/cache/builders/link.service';
import { UploadBitstreamComponent } from './bitstreams/upload/upload-bitstream.component';
import {
  ITEM_EDIT_PATH,
  ORCID_PATH,
  TOMBSTONE_ITEM_PATH,
  UPLOAD_BITSTREAM_PATH,
  VIEWS_DOWNLOADS_STATISTICS_PATH
} from './item-page-routing-paths';
import { ItemPageAdministratorGuard } from './item-page-administrator.guard';
import { LinkMenuItemModel } from '../shared/menu/menu-item/models/link.model';
import { ThemedItemPageComponent } from './simple/themed-item-page.component';
import { ThemedFullItemPageComponent } from './full/themed-full-item-page.component';
import { MenuItemType } from '../shared/menu/menu-item-type.model';
import { VersionPageComponent } from './version-page/version-page/version-page.component';
import { BitstreamRequestACopyPageComponent } from './bitstreams/request-a-copy/bitstream-request-a-copy-page.component';
import { TombstoneComponent } from './tombstone/tombstone.component';
import { REQUEST_COPY_MODULE_PATH } from '../app-routing-paths';
import { OrcidPageComponent } from './orcid-page/orcid-page.component';
import { OrcidPageGuard } from './orcid-page/orcid-page.guard';
import { DSOEditMenuResolver } from '../shared/dso-page/dso-edit-menu.resolver';
import { ViewTrackerResolverService } from '../statistics/angulartics/dspace/view-tracker-resolver.service';
import {
  ClarinZipDownloadPageComponent
} from '../bitstream-page/clarin-zip-download-page/clarin-zip-download-page.component';
import { ViewsDownloadsStatisticsComponent } from './views-downloads-statistics/views-downloads-statistics.component';

@NgModule({
  imports: [
    RouterModule.forChild([
      {
        path: ':id',
        resolve: {
          dso: ItemPageResolver,
          breadcrumb: ItemBreadcrumbResolver,
        },
        runGuardsAndResolvers: 'always',
        children: [
          {
            path: '',
            component: ThemedItemPageComponent,
            pathMatch: 'full',
            resolve: {
              menu: DSOEditMenuResolver,
              tracking: ViewTrackerResolverService,
            },
          },
          {
            path: 'full',
            component: ThemedFullItemPageComponent,
            resolve: {
              menu: DSOEditMenuResolver,
              tracking: ViewTrackerResolverService,
            },
          },
          {
            path: ITEM_EDIT_PATH,
            loadChildren: () => import('./edit-item-page/edit-item-page.module')
              .then((m) => m.EditItemPageModule),
          },
          {
            path: UPLOAD_BITSTREAM_PATH,
            component: UploadBitstreamComponent,
            canActivate: [AuthenticatedGuard]
          },
          {
            path: REQUEST_COPY_MODULE_PATH,
            component: BitstreamRequestACopyPageComponent,
          },
          {
            path: ORCID_PATH,
            component: OrcidPageComponent,
            canActivate: [AuthenticatedGuard, OrcidPageGuard]
          },
          {
            path: TOMBSTONE_ITEM_PATH,
            component: TombstoneComponent
          },
          {
            path: VIEWS_DOWNLOADS_STATISTICS_PATH,
            component: ViewsDownloadsStatisticsComponent,
            canActivate: [AuthenticatedGuard],
            resolve: {
              dso: ItemPageResolver,
            }
          },
          {
            path: ORCID_PATH,
            component: OrcidPageComponent,
            canActivate: [AuthenticatedGuard, OrcidPageGuard]
          },
          {
            path: 'download',
            children: [
              {
                path: '',
                component: ClarinZipDownloadPageComponent,
                resolve: {
                  dso: ItemPageResolver,
                },
                data: {
                  zipDownloadLink: 'This is download link'
                }
              },
              {
                path: 'zip',
                component: ClarinZipDownloadPageComponent,
                resolve: {
                  dso: ItemPageResolver,
                },
                data: {
                  zipDownloadLink: 'This is download link'
                }
              }
            ],
          },
        ],
        data: {
          menu: {
            public: [{
              id: 'statistics_item_:id',
              active: true,
              visible: true,
              index: 2,
              model: {
                type: MenuItemType.LINK,
                text: 'menu.section.statistics',
                link: 'statistics/items/:id/',
              } as LinkMenuItemModel,
            }],
          },
        },
      },
      {
        path: 'version',
        children: [
          {
            path: ':id',
            component: VersionPageComponent,
            resolve: {
              dso: VersionResolver,
            },
          }
        ],
      }
    ])
  ],
  providers: [
    ItemPageResolver,
    ItemBreadcrumbResolver,
    DSOBreadcrumbsService,
    LinkService,
    ItemPageAdministratorGuard,
    VersionResolver,
    OrcidPageGuard,
    ViewTrackerResolverService,
  ]

})
export class ItemPageRoutingModule {

}
