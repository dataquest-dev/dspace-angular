import { Component, Inject, Input, OnDestroy, OnInit } from '@angular/core';
import { combineLatest, Observable, of as observableOf } from 'rxjs';
import { BitstreamDataService } from '../../../../core/data/bitstream-data.service';

import { Bitstream } from '../../../../core/shared/bitstream.model';
import { Item } from '../../../../core/shared/item.model';
import { followLink } from '../../../../shared/utils/follow-link-config.model';
import { FileSectionComponent } from '../../../simple/field-components/file-section/file-section.component';
import { PaginationComponentOptions } from '../../../../shared/pagination/pagination-component-options.model';
import { PaginatedList } from '../../../../core/data/paginated-list.model';
import { RemoteData } from '../../../../core/data/remote-data';
import { distinctUntilChanged, filter, map, startWith, switchMap, take, tap } from 'rxjs/operators';
import { NotificationsService } from '../../../../shared/notifications/notifications.service';
import { TranslateService } from '@ngx-translate/core';
import { hasValue, isEmpty } from '../../../../shared/empty.util';
import { PaginationService } from '../../../../core/pagination/pagination.service';
import { DSONameService } from '../../../../core/breadcrumbs/dso-name.service';
import { AppConfig, APP_CONFIG } from 'src/config/app-config.interface';

/**
 * This component renders the file section of the item
 * inside a 'ds-metadata-field-wrapper' component.
 */

@Component({
  selector: 'ds-item-page-full-file-section',
  styleUrls: ['./full-file-section.component.scss'],
  templateUrl: './full-file-section.component.html'
})
export class FullFileSectionComponent extends FileSectionComponent implements OnDestroy, OnInit {

  @Input() item: Item;

  label: string;

  originals$: Observable<RemoteData<PaginatedList<Bitstream>>>;
  licenses$: Observable<RemoteData<PaginatedList<Bitstream>>>;

  originalsHaveThumbnail$: Observable<boolean>;
  licensesHaveThumbnail$: Observable<boolean>;

  originalOptions = Object.assign(new PaginationComponentOptions(), {
    id: 'obo',
    currentPage: 1,
    pageSize: this.appConfig.item.bitstream.pageSize
  });

  licenseOptions = Object.assign(new PaginationComponentOptions(), {
    id: 'lbo',
    currentPage: 1,
    pageSize: this.appConfig.item.bitstream.pageSize
  });

  constructor(
    bitstreamDataService: BitstreamDataService,
    protected notificationsService: NotificationsService,
    protected translateService: TranslateService,
    protected paginationService: PaginationService,
    public dsoNameService: DSONameService,
    @Inject(APP_CONFIG) protected appConfig: AppConfig
  ) {
    super(bitstreamDataService, notificationsService, translateService, dsoNameService, appConfig);
  }

  ngOnInit(): void {
    this.initialize();
  }

  initialize(): void {
    this.originals$ = this.paginationService.getCurrentPagination(this.originalOptions.id, this.originalOptions).pipe(
      switchMap((options: PaginationComponentOptions) => this.bitstreamDataService.findAllByItemAndBundleName(
        this.item,
        'ORIGINAL',
        {elementsPerPage: options.pageSize, currentPage: options.currentPage},
        true,
        true,
        followLink('format'),
        followLink('thumbnail'),
      )),
      tap((rd: RemoteData<PaginatedList<Bitstream>>) => {
          if (hasValue(rd.errorMessage)) {
            this.notificationsService.error(this.translateService.get('file-section.error.header'), `${rd.statusCode} ${rd.errorMessage}`);
          }
        }
      )
    );

    this.licenses$ = this.paginationService.getCurrentPagination(this.licenseOptions.id, this.licenseOptions).pipe(
      switchMap((options: PaginationComponentOptions) => this.bitstreamDataService.findAllByItemAndBundleName(
        this.item,
        'LICENSE',
        {elementsPerPage: options.pageSize, currentPage: options.currentPage},
        true,
        true,
        followLink('format'),
        followLink('thumbnail'),
      )),
      tap((rd: RemoteData<PaginatedList<Bitstream>>) => {
          if (hasValue(rd.errorMessage)) {
            this.notificationsService.error(this.translateService.get('file-section.error.header'), `${rd.statusCode} ${rd.errorMessage}`);
          }
        }
      )
    );

    this.originalsHaveThumbnail$ = this.bundleHasThumbnail(this.originals$);
    this.licensesHaveThumbnail$ = this.bundleHasThumbnail(this.licenses$);

  }

  hasValuesInBundle(bundle: PaginatedList<Bitstream>) {
    return hasValue(bundle) && !isEmpty(bundle.page);
  }

  /**
   * Emits true when at least one bitstream in the bundle has a resolved thumbnail.
   */
  bundleHasThumbnail(bundle$: Observable<RemoteData<PaginatedList<Bitstream>>>): Observable<boolean> {
    return bundle$.pipe(
      filter((rd: RemoteData<PaginatedList<Bitstream>>) => rd.hasSucceeded || rd.hasFailed),
      switchMap((rd: RemoteData<PaginatedList<Bitstream>>) => {
        const files: Bitstream[] = rd?.payload?.page;
        if (isEmpty(files)) {
          return observableOf(false);
        }
        return combineLatest(files.map((file: Bitstream) =>
          (file.thumbnail ?? observableOf(null)).pipe(
            filter((thumbnail: RemoteData<Bitstream>) => thumbnail == null || thumbnail.hasSucceeded || thumbnail.hasFailed),
            take(1),
            map((thumbnail: RemoteData<Bitstream>) => hasValue(thumbnail?.payload)),
          ),
        )).pipe(
          map((present: boolean[]) => present.some(Boolean)),
        );
      }),
      startWith(false),
      distinctUntilChanged(),
    );
  }

  ngOnDestroy(): void {
    this.paginationService.clearPagination(this.originalOptions.id);
    this.paginationService.clearPagination(this.licenseOptions.id);
  }

}
