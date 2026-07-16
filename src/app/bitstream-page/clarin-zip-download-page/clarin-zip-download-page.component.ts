import { AsyncPipe } from '@angular/common';
import {
  Component,
  OnInit,
} from '@angular/core';
import {
  ActivatedRoute,
  Router,
} from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import {
  BehaviorSubject,
  Observable,
} from 'rxjs';
import { map } from 'rxjs/operators';

import { AuthService } from '../../core/auth/auth.service';
import { RemoteDataBuildService } from '../../core/cache/builders/remote-data-build.service';
import { BitstreamDataService } from '../../core/data/bitstream-data.service';
import { AuthorizationDataService } from '../../core/data/feature-authorization/authorization-data.service';
import { PaginatedList } from '../../core/data/paginated-list.model';
import { RemoteData } from '../../core/data/remote-data';
import { RequestService } from '../../core/data/request.service';
import { HardRedirectService } from '../../core/services/hard-redirect.service';
import { Bitstream } from '../../core/shared/bitstream.model';
import { FileService } from '../../core/shared/file.service';
import { HALEndpointService } from '../../core/shared/hal-endpoint.service';
import { Item } from '../../core/shared/item.model';
import { getFirstCompletedRemoteData } from '../../core/shared/operators';
import {
  hasValue,
  isUndefined,
} from '../../shared/empty.util';
import { NotificationsService } from '../../shared/notifications/notifications.service';
import { createSuccessfulRemoteDataObject$ } from '../../shared/remote-data.utils';
import { ClarinBitstreamAuthorizationDeniedComponent } from '../clarin-bitstream-authorization-denied/clarin-bitstream-authorization-denied.component';
import { ClarinBitstreamDownloadPageComponent } from '../clarin-bitstream-download-page/clarin-bitstream-download-page.component';
import { ClarinBitstreamTokenExpiredComponent } from '../clarin-bitstream-token-expired/clarin-bitstream-token-expired.component';
import { ClarinLicenseAgreementPageComponent } from '../clarin-license-agreement-page/clarin-license-agreement-page.component';

/**
 * Fetch ZIP file from the server as a single file into `bitstreamRD$` property which is extended and then call
 * `super.ngOnInit()` to continue the parent process.
 */
@Component({
  imports: [
    AsyncPipe,
    ClarinBitstreamAuthorizationDeniedComponent,
    ClarinBitstreamTokenExpiredComponent,
    ClarinLicenseAgreementPageComponent,
    TranslateModule,
  ],
  selector: 'ds-clarin-zip-download-page',
  templateUrl: '../clarin-bitstream-download-page/clarin-bitstream-download-page.component.html',
  styleUrls: ['../clarin-bitstream-download-page/clarin-bitstream-download-page.component.scss'],
})
export class ClarinZipDownloadPageComponent extends ClarinBitstreamDownloadPageComponent implements OnInit {
  itemRD$: Observable<RemoteData<Item>>;
  bitstreams$: BehaviorSubject<Bitstream[]> = new BehaviorSubject<Bitstream[]>([]);

  constructor(
    protected route: ActivatedRoute,
    protected router: Router,
    protected auth: AuthService,
    protected authorizationService: AuthorizationDataService,
    protected hardRedirectService: HardRedirectService,
    protected requestService: RequestService,
    protected rdbService: RemoteDataBuildService,
    protected halService: HALEndpointService,
    protected fileService: FileService,
    protected bitstreamDataService: BitstreamDataService,
    protected translateService: TranslateService,
    protected notificationsService: NotificationsService,
  ) {
    super(route, router, auth, authorizationService, hardRedirectService, requestService, rdbService, halService,
      fileService);
  }

  ngOnInit(): void {
    this.itemRD$ = this.route.data.pipe(
      map((data) => data.dso));

    this.itemRD$.subscribe((itemRD: RemoteData<Item>)  => {
      this.bitstreamDataService.findAllByItemAndBundleName(itemRD?.payload, 'ORIGINAL', {
        currentPage: 1,
        elementsPerPage: 9999,
      }).pipe(
        getFirstCompletedRemoteData(),
      ).subscribe((bitstreamsRD: RemoteData<PaginatedList<Bitstream>>) => {
        if (bitstreamsRD.errorMessage) {
          this.notificationsService.error(this.translateService.get('file-section.error.header'),
            `${bitstreamsRD.statusCode} ${bitstreamsRD.errorMessage}`);
        } else if (hasValue(bitstreamsRD.payload)) {
          const current: Bitstream[] = this.bitstreams$.getValue();
          this.bitstreams$.next([...current, ...bitstreamsRD.payload.page]);
          this.bitstreamRD$ = createSuccessfulRemoteDataObject$(this.bitstreams$.getValue()[0]);
          this.dtoken = isUndefined(this.route.snapshot.queryParams.dtoken) ? null : this.route.snapshot.queryParams.dtoken;
          const baseUrl = this.halService.getRootHref() +
            `/core/items/${itemRD.payload.uuid}/allzip?handleId=${itemRD?.payload?.handle}`;
          // Do not add `dtoken` into the URL if it is null
          const dtokenParam = this.dtoken ? `&dtoken=${this.dtoken}` : '';
          this.zipDownloadLink.next(baseUrl + dtokenParam);
          super.ngOnInit();
        }
      });
    });
  }
}
