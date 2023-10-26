import { Component, Input, OnInit } from '@angular/core';
import {BehaviorSubject, combineLatest, firstValueFrom, lastValueFrom, Observable, of, Subscription} from 'rxjs';
import {
  getAllSucceededRemoteData,
  getAllSucceededRemoteDataPayload,
  getFirstCompletedRemoteData,
  getFirstSucceededRemoteData,
  getFirstSucceededRemoteDataPayload, getFirstSucceededRemoteListPayload,
  getRemoteDataPayload
} from '../../core/shared/operators';
import {filter, map, mergeMap, startWith, switchMap, take, tap} from 'rxjs/operators';
import {
  getItemEditVersionhistoryRoute,
  getItemPageRoute,
  getItemVersionRoute
} from '../item-page-routing-paths';
import { FormBuilder } from '@angular/forms';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ItemVersionsSummaryModalComponent } from './item-versions-summary-modal/item-versions-summary-modal.component';
import { NotificationsService } from '../../shared/notifications/notifications.service';
import { TranslateService } from '@ngx-translate/core';
import { ItemVersionsDeleteModalComponent } from './item-versions-delete-modal/item-versions-delete-modal.component';
import { VersionDataService } from '../../core/data/version-data.service';
import { ItemDataService } from '../../core/data/item-data.service';
import { Router } from '@angular/router';
import { AuthorizationDataService } from '../../core/data/feature-authorization/authorization-data.service';
import { FeatureID } from '../../core/data/feature-authorization/feature-id';
import { ItemVersionsSharedService } from './item-versions-shared.service';
import { WorkspaceItem } from '../../core/submission/models/workspaceitem.model';
import { WorkspaceitemDataService } from '../../core/submission/workspaceitem-data.service';
import { WorkflowItemDataService } from '../../core/submission/workflowitem-data.service';
import { ConfigurationDataService } from '../../core/data/configuration-data.service';
import { Item } from 'src/app/core/shared/item.model';
import { AlertType } from 'src/app/shared/alert/aletr-type';
import { RemoteData } from 'src/app/core/data/remote-data';
import { VersionHistory } from 'src/app/core/shared/version-history.model';
import { PaginatedList } from 'src/app/core/data/paginated-list.model';
import { PaginationComponentOptions } from 'src/app/shared/pagination/pagination-component-options.model';
import { VersionHistoryDataService } from 'src/app/core/data/version-history-data.service';
import { PaginationService } from 'src/app/core/pagination/pagination.service';
import { Version } from '../../core/shared/version.model';
import { PaginatedSearchOptions } from '../../shared/search/models/paginated-search-options.model';
import { followLink } from '../../shared/utils/follow-link-config.model';
import {hasValue, hasValueOperator, isEmpty, isNotEmpty, isNotNull} from '../../shared/empty.util';
import { DSONameService } from '../../core/breadcrumbs/dso-name.service';
import isEqual from 'lodash/isEqual';
// eslint-disable-next-line lodash/import-scope
import _ from 'lodash';
import {RequestParam} from '../../core/cache/models/request-param.model';
import {FindListOptions} from '../../core/data/find-list-options.model';

@Component({
  selector: 'ds-item-versions',
  templateUrl: './item-versions.component.html',
  styleUrls: ['./item-versions.component.scss']
})

/**
 * Component listing all available versions of the history the provided item is a part of
 */
export class ItemVersionsComponent implements OnInit {

  /**
   * The item to display a version history for
   */
  @Input() item: Item;

  /**
   * An option to display the list of versions, even when there aren't any.
   * Instead of the table, an alert will be displayed, notifying the user there are no other versions present
   * for the current item.
   */
  @Input() displayWhenEmpty = false;

  /**
   * Whether or not to display the title
   */
  @Input() displayTitle = true;

  /**
   * Whether or not to display the action buttons (delete/create/edit version)
   */
  @Input() displayActions: boolean;

  /**
   * Array of active subscriptions
   */
  subs: Subscription[] = [];

  /**
   * The AlertType enumeration
   * @type {AlertType}
   */
  AlertTypeEnum = AlertType;

  /**
   * The item's version
   */
  versionRD$: Observable<RemoteData<Version>>;

  /**
   * The item's full version history (remote data)
   */
  versionHistoryRD$: Observable<RemoteData<VersionHistory>>;

  /**
   * The item's full version history
   */
  versionHistory$: Observable<VersionHistory>;

  /**
   * The version history's list of versions
   */
  versionsRD$: BehaviorSubject<RemoteData<PaginatedList<Version>>> = new BehaviorSubject<RemoteData<PaginatedList<Version>>>(null);

  /**
   * Verify if the list of versions has at least one e-person to display
   * Used to hide the "Editor" column when no e-persons are present to display
   */
  hasEpersons$: Observable<boolean>;

  /**
   * Verify if there is an inprogress submission in the version history
   * Used to disable the "Create version" button
   */
  hasDraftVersion$: Observable<boolean>;

  /**
   * The amount of versions to display per page
   */
  pageSize = 10;

  /**
   * The page options to use for fetching the versions
   * Start at page 1 and always use the set page size
   */
  options = Object.assign(new PaginationComponentOptions(), {
    id: 'ivo',
    currentPage: 1,
    pageSize: this.pageSize
  });

  /**
   * The routes to the versions their item pages
   * Key: Item ID
   * Value: Route to item page
   */
  itemPageRoutes$: Observable<{
    [itemId: string]: string
  }>;

  /**
   * The number of the version whose summary is currently being edited
   */
  versionBeingEditedNumber: number;

  /**
   * The id of the version whose summary is currently being edited
   */
  versionBeingEditedId: string;

  /**
   * The summary currently being edited
   */
  versionBeingEditedSummary: string;

  canCreateVersion$: Observable<boolean>;
  createVersionTitle$: Observable<string>;

  relations: BehaviorSubject<string[]> = new BehaviorSubject<string[]>([]);

  /**
   * Show `Editor` column in the table.
   */
  showSubmitter$: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(null);

  // allVersions: BehaviorSubject<VersionWithRelations[]> = new BehaviorSubject<VersionWithRelations[]>([]);

  name: BehaviorSubject<string> = new BehaviorSubject<string>('');

  private nameCache: { [handle: string]: string } = {};

  constructor(private versionHistoryService: VersionHistoryDataService,
              private versionService: VersionDataService,
              private itemService: ItemDataService,
              private paginationService: PaginationService,
              private formBuilder: FormBuilder,
              private modalService: NgbModal,
              private notificationsService: NotificationsService,
              private translateService: TranslateService,
              private router: Router,
              private itemVersionShared: ItemVersionsSharedService,
              private authorizationService: AuthorizationDataService,
              private workspaceItemDataService: WorkspaceitemDataService,
              private workflowItemDataService: WorkflowItemDataService,
              private configurationService: ConfigurationDataService,
              private dsoNameService: DSONameService
  ) {
  }

  /**
   * True when a version is being edited
   * (used to disable buttons for other versions)
   */
  isAnyBeingEdited(): boolean {
    return this.versionBeingEditedNumber != null;
  }

  /**
   * True if the specified version is being edited
   * (used to show input field and to change buttons for specified version)
   */
  isThisBeingEdited(version: Version): boolean {
    return version?.version === this.versionBeingEditedNumber;
  }

  /**
   * Enables editing for the specified version
   */
  enableVersionEditing(version: Version): void {
    this.versionBeingEditedSummary = version?.summary;
    this.versionBeingEditedNumber = version?.version;
    this.versionBeingEditedId = version?.id;
  }

  /**
   * Disables editing for the specified version and discards all pending changes
   */
  disableVersionEditing(): void {
    this.versionBeingEditedSummary = undefined;
    this.versionBeingEditedNumber = undefined;
    this.versionBeingEditedId = undefined;
  }

  /**
   * Get the route to the specified version
   * @param versionId the ID of the version for which the route will be retrieved
   */
  getVersionRoute(versionId: string) {
    return getItemVersionRoute(versionId);
  }

  /**
   * Applies changes to version currently being edited
   */
  onSummarySubmit() {

    const successMessageKey = 'item.version.edit.notification.success';
    const failureMessageKey = 'item.version.edit.notification.failure';

    this.versionService.findById(this.versionBeingEditedId).pipe(
      getFirstSucceededRemoteData(),
      switchMap((findRes: RemoteData<Version>) => {
        const payload = findRes.payload;
        const summary = {summary: this.versionBeingEditedSummary,};
        const updatedVersion = Object.assign({}, payload, summary);
        return this.versionService.update(updatedVersion).pipe(getFirstCompletedRemoteData<Version>());
      }),
    ).subscribe((updatedVersionRD: RemoteData<Version>) => {
        if (updatedVersionRD.hasSucceeded) {
          this.notificationsService.success(null, this.translateService.get(successMessageKey, {'version': this.versionBeingEditedNumber}));
          this.getAllVersions(this.versionHistory$);
        } else {
          this.notificationsService.warning(null, this.translateService.get(failureMessageKey, {'version': this.versionBeingEditedNumber}));
        }
        this.disableVersionEditing();
      }
    );
  }

  /**
   * Delete the item and get the result of the operation
   * @param item
   */
  deleteItemAndGetResult$(item: Item): Observable<boolean> {
    return this.itemService.delete(item.id).pipe(
      getFirstCompletedRemoteData(),
      map((deleteItemRes) => deleteItemRes.hasSucceeded),
      take(1),
    );
  }

  /**
   * Deletes the specified version, notify the success/failure and redirect to latest version
   * @param version the version to be deleted
   * @param redirectToLatest force the redirect to the latest version in the history
   */
  deleteVersion(version: Version, redirectToLatest: boolean): void {
    const successMessageKey = 'item.version.delete.notification.success';
    const failureMessageKey = 'item.version.delete.notification.failure';
    const versionNumber = version.version;
    const versionItem$ = version.item;

    // Open modal
    const activeModal = this.modalService.open(ItemVersionsDeleteModalComponent);
    activeModal.componentInstance.versionNumber = version.version;
    activeModal.componentInstance.firstVersion = false;

    // On modal submit/dismiss
    activeModal.componentInstance.response.pipe(take(1)).subscribe((ok) => {
      if (ok) {
        versionItem$.pipe(
          getFirstSucceededRemoteDataPayload<Item>(),
          // Retrieve version history
          mergeMap((item: Item) => combineLatest([
            of(item),
            this.versionHistoryService.getVersionHistoryFromVersion$(version)
          ])),
          // Delete item
          mergeMap(([item, versionHistory]: [Item, VersionHistory]) => combineLatest([
            this.deleteItemAndGetResult$(item),
            of(versionHistory)
          ])),
          // Retrieve new latest version
          mergeMap(([deleteItemResult, versionHistory]: [boolean, VersionHistory]) => combineLatest([
            of(deleteItemResult),
            this.versionHistoryService.getLatestVersionItemFromHistory$(versionHistory).pipe(
              tap(() => {
                this.getAllVersions(of(versionHistory));
              }),
            )
          ])),
        ).subscribe(([deleteHasSucceeded, newLatestVersionItem]: [boolean, Item]) => {
          // Notify operation result and redirect to latest item
          if (deleteHasSucceeded) {
            this.notificationsService.success(null, this.translateService.get(successMessageKey, {'version': versionNumber}));
          } else {
            this.notificationsService.error(null, this.translateService.get(failureMessageKey, {'version': versionNumber}));
          }
          if (redirectToLatest) {
            const path = getItemEditVersionhistoryRoute(newLatestVersionItem);
            this.router.navigateByUrl(path);
          }
        });
      }
    });
  }

  /**
   * Creates a new version starting from the specified one
   * @param version the version from which a new one will be created
   */
  createNewVersion(version: Version) {
    const versionNumber = version.version;

    // Open modal and set current version number
    const activeModal = this.modalService.open(ItemVersionsSummaryModalComponent);
    activeModal.componentInstance.versionNumber = versionNumber;

    // On createVersionEvent emitted create new version and notify
    activeModal.componentInstance.createVersionEvent.pipe(
      mergeMap((summary: string) => combineLatest([
        of(summary),
        version.item.pipe(getFirstSucceededRemoteDataPayload())
      ])),
      mergeMap(([summary, item]: [string, Item]) => this.versionHistoryService.createVersion(item._links.self.href, summary)),
      getFirstCompletedRemoteData(),
      // close model (should be displaying loading/waiting indicator) when version creation failed/succeeded
      tap(() => activeModal.close()),
      // show success/failure notification
      tap((newVersionRD: RemoteData<Version>) => {
        this.itemVersionShared.notifyCreateNewVersion(newVersionRD);
        if (newVersionRD.hasSucceeded) {
          const versionHistory$ = this.versionService.getHistoryFromVersion(version).pipe(
            tap((versionHistory: VersionHistory) => {
              this.itemService.invalidateItemCache(this.item.uuid);
              this.versionHistoryService.invalidateVersionHistoryCache(versionHistory.id);
            }),
          );
          this.getAllVersions(versionHistory$);
        }
      }),
      // get workspace item
      getFirstSucceededRemoteDataPayload<Version>(),
      switchMap((newVersion: Version) => this.itemService.findByHref(newVersion._links.item.href)),
      getFirstSucceededRemoteDataPayload<Item>(),
      switchMap((newVersionItem: Item) => this.workspaceItemDataService.findByItem(newVersionItem.uuid, true, false)),
      getFirstSucceededRemoteDataPayload<WorkspaceItem>(),
    ).subscribe((wsItem) => {
      const wsiId = wsItem.id;
      const route = 'workspaceitems/' + wsiId + '/edit';
      this.router.navigateByUrl(route);
    });
  }

  /**
   * Check is the current user can edit the version summary
   * @param version
   */
  canEditVersion$(version: Version): Observable<boolean> {
    return this.authorizationService.isAuthorized(FeatureID.CanEditVersion, version.self);
  }

  /**
   * Show submitter in version history table
   */
  showSubmitter() {
    const includeSubmitter$ = this.configurationService.findByPropertyName('versioning.item.history.include.submitter').pipe(
      getFirstSucceededRemoteDataPayload(),
      map((configurationProperty) => configurationProperty.values[0]),
      startWith(false),
    );

    const isAdmin$ = combineLatest([
      this.authorizationService.isAuthorized(FeatureID.IsCollectionAdmin),
      this.authorizationService.isAuthorized(FeatureID.IsCommunityAdmin),
      this.authorizationService.isAuthorized(FeatureID.AdministratorOf),
    ]).pipe(
      map(([isCollectionAdmin, isCommunityAdmin, isSiteAdmin]) => {
        return isCollectionAdmin || isCommunityAdmin || isSiteAdmin;
      }),
      take(1),
    );

    const result$ = combineLatest([includeSubmitter$, isAdmin$]).pipe(
      map(([includeSubmitter, isAdmin]) => {
        return includeSubmitter && isAdmin;
      })
    );

    if (isNotNull(this.showSubmitter$.value)) {
      return;
    }

    result$.subscribe(res => {
      this.showSubmitter$.next(res);
    });
  }

  /**
   * Check if the current user can delete the version
   * @param version
   */
  canDeleteVersion$(version: Version): Observable<boolean> {
    return this.authorizationService.isAuthorized(FeatureID.CanDeleteVersion, version.self);
  }

  /**
   * Get all versions for the given version history and store them in versionRD$
   * @param versionHistory$
   */
  getAllVersions(versionHistory$: Observable<VersionHistory>): void {
    const currentPagination = this.paginationService.getCurrentPagination(this.options.id, this.options);
    combineLatest([versionHistory$, currentPagination]).pipe(
      switchMap(([versionHistory, options]: [VersionHistory, PaginationComponentOptions]) => {
        return this.versionHistoryService.getVersions(versionHistory.id,
          new PaginatedSearchOptions({pagination: Object.assign({}, options, {currentPage: options.currentPage})}),
          false, true, followLink('item'), followLink('eperson'));
      }),
      getFirstCompletedRemoteData(),
    ).subscribe((res: RemoteData<PaginatedList<Version>>) => {
      this.versionsRD$.next(res);
    });
  }

  /**
   * Updates the page
   */
  onPageChange() {
    this.getAllVersions(this.versionHistory$);
  }

  /**
   * Get the ID of the workspace item, if present, otherwise return undefined
   * @param versionItem the item for which retrieve the workspace item id
   */
  getWorkspaceId(versionItem): Observable<string> {
    return versionItem.pipe(
      getFirstSucceededRemoteDataPayload(),
      map((item: Item) => item.uuid),
      switchMap((itemUuid: string) => this.workspaceItemDataService.findByItem(itemUuid, true)),
      getFirstCompletedRemoteData<WorkspaceItem>(),
      map((res: RemoteData<WorkspaceItem>) => res?.payload?.id ),
    );
  }

  /**
   * Get the ID of the workflow item, if present, otherwise return undefined
   * @param versionItem the item for which retrieve the workspace item id
   */
  getWorkflowId(versionItem): Observable<string> {
    return versionItem.pipe(
      getFirstSucceededRemoteDataPayload(),
      map((item: Item) => item.uuid),
      switchMap((itemUuid: string) => this.workflowItemDataService.findByItem(itemUuid, true)),
      getFirstCompletedRemoteData<WorkspaceItem>(),
      map((res: RemoteData<WorkspaceItem>) => res?.payload?.id ),
    );
  }

  /**
   * redirect to the edit page of the workspace item
   * @param id$ the id of the workspace item
   */
  editWorkspaceItem(id$: Observable<string>) {
    id$.subscribe((id) => {
      this.router.navigateByUrl('workspaceitems/' + id + '/edit');
    });
  }

  /**
   * Initialize all observables
   */
  ngOnInit(): void {
    if (hasValue(this.item.version)) {
      this.versionRD$ = this.item.version;
      this.versionHistoryRD$ = this.versionRD$.pipe(
        getAllSucceededRemoteData(),
        getRemoteDataPayload(),
        hasValueOperator(),
        switchMap((version: Version) => version.versionhistory),
      );
      this.versionHistory$ = this.versionHistoryRD$.pipe(
        getFirstSucceededRemoteDataPayload(),
        hasValueOperator(),
      );

      this.canCreateVersion$ = this.authorizationService.isAuthorized(FeatureID.CanCreateVersion, this.item.self);

      // If there is a draft item in the version history the 'Create version' button is disabled and a different tooltip message is shown
      this.hasDraftVersion$ = this.versionHistoryRD$.pipe(
        getFirstSucceededRemoteDataPayload(),
        map((res) => Boolean(res?.draftVersion)),
      );

      this.createVersionTitle$ = this.hasDraftVersion$.pipe(
        take(1),
        switchMap((res) => of(res ? 'item.version.history.table.action.hasDraft' : 'item.version.history.table.action.newVersion'))
      );

      this.getAllVersions(this.versionHistory$);
      this.hasEpersons$ = this.versionsRD$.pipe(
        getAllSucceededRemoteData(),
        getRemoteDataPayload(),
        hasValueOperator(),
        map((versions: PaginatedList<Version>) => versions.page.filter((version: Version) => version.eperson !== undefined).length > 0),
        startWith(false)
      );
      this.itemPageRoutes$ = this.versionsRD$.pipe(
        getAllSucceededRemoteDataPayload(),
        switchMap((versions) => combineLatest(versions.page.map((version) => version.item.pipe(getAllSucceededRemoteDataPayload())))),
        map((versions) => {
          const itemPageRoutes = {};
          versions.forEach((item) => itemPageRoutes[item.uuid] = getItemPageRoute(item));
          return itemPageRoutes;
        })
      );

      this.showSubmitter();
    }
  }

  getItemNameFromVersion(version: Version) {
    return version.item
      .pipe(
        getFirstSucceededRemoteDataPayload(),
        map((item: Item) => this.dsoNameService.getName(item)));
  }

  getItemHandleFromVersion(version: Version) {
    return version.item
      .pipe(
        getFirstSucceededRemoteDataPayload(),
        map((item: Item) => item.firstMetadataValue('dc.identifier.uri')));
  }

  getVersionsFromMetadata(version: Version) {
    return '';
  }


  /**
   * Unsub all subscriptions
   */
  cleanupSubscribes() {
    this.subs.filter((sub) => hasValue(sub)).forEach((sub) => sub.unsubscribe());
  }

  getItemFromVersion(version: Version) {
    return version.item
      .pipe(
        getFirstSucceededRemoteDataPayload(),
        map((item: Item) => item)
      );
  }

  gelAllVersions(versions: Version[]) {
    let allVersions: BehaviorSubject<VersionWithRelations[]> = new BehaviorSubject<VersionWithRelations[]>([]);
    // allVersions.next([]);
    // Get item from current version and check `dc.relation.replaces` and `dc.relation.isreplacedby`
    console.log('len', versions.length);
    // let newVersionItem: Item;

    versions.forEach((version: Version) => {
      version.item
        .pipe(getFirstSucceededRemoteDataPayload())
        .subscribe((item: Item) => {
          let allReplaces = [];
          console.log('item', item);

          // Store version
          // Store replaces
          let relationReplaces: RelationNameHandle[] = [];
          for (const metadataValue of item.allMetadataValues('dc.relation.replaces')) {
            // Example
            // Example


            // if (isEqual(metadataValue, item.firstMetadataValue('dc.relation.replaces'))) {
            //   return;
            // }
            const newRelationReplaces: RelationNameHandle = {
              name: '',
              handle: metadataValue
            };
            // newRelationReplaces.handle = metadataValue;
            // Get name of the item with handle TODO
            relationReplaces.push(newRelationReplaces);
          }
          // Store isreplacedby
          let relationIsReplacedBy: RelationNameHandle[] = [];
          const allReplacedBy = [];
          // const isReplacedByMetadataValues
          item.allMetadataValues('dc.relation.isreplacedby').forEach((metadataValue: string) => {
            allReplacedBy.push(metadataValue);
            // if (isEqual(metadataValue, item.firstMetadataValue('dc.relation.isreplacedby'))) {
            //   return;
            // }
            const newRelationIsReplacedBy: RelationNameHandle = {
              name: '',
              handle: metadataValue
            };
            // Get name of the item with handle TODO
            relationIsReplacedBy.push(newRelationIsReplacedBy);
          });
          const newVersionWithRelations: VersionWithRelations = {
            version: version,
            replaces: relationReplaces,
            isreplacedby: relationIsReplacedBy,
            handle: item.firstMetadataValue('dc.identifier.uri')
          };
          if (allReplacedBy.includes(this.item.firstMetadataValue('dc.identifier.uri'))) {
            newVersionWithRelations.isreplacedby = [];
          }
          let updatedArray = allVersions.value;
          updatedArray.push(newVersionWithRelations);
          updatedArray = this.filterVersions(updatedArray);
          allVersions.next(updatedArray);
          console.log('allVersions', allVersions.value);
          // newVersionItem = item;
        });
    });


    // allVersions.next(filteredVersions);

    return allVersions;
  }

  filterVersions(allVersions: VersionWithRelations[]) {
    const filteredVersions: VersionWithRelations[] = [];
    // Filter all versions table: Remove record from the table where the item:
    // 1. has previous version handle the same as in the `dc.relation.replaces`
    // 2. has new version handle the same the as in the `dc.relation.isreplacedby`
    const allReplaces = [];
    const allIsReplacedBy = [];
    for (const currentVersion of allVersions) {
      const index = allVersions.indexOf(currentVersion);
      let previousVersion: VersionWithRelations;
      let newestVersion: VersionWithRelations;

      if (isNotNull(allVersions?.[index - 1])) {
        newestVersion = allVersions?.[index - 1];
      }
      if (isNotNull(allVersions?.[index + 1])) {
        previousVersion = allVersions?.[index + 1];
      }

      // Process previous versions
      if (isNotEmpty(previousVersion)) {
        const newReplaces = [];
        currentVersion.replaces.forEach((relationNameHandle: RelationNameHandle) => {
          if (isEqual(previousVersion.handle, relationNameHandle.handle)) {
            return;
          }
          // this.getName(currentVersion.handle)
          //   .pipe(take(1))
          //   .subscribe(value => {
          //     relationNameHandle.name = value;
          //     console.log('fwef', value);
          //   });
          newReplaces.push(relationNameHandle);
        });
        currentVersion.replaces = newReplaces;
      }

      // Process newest versions
      if (isNotEmpty(newestVersion)) {
        const newIsReplacedBy = [];
        currentVersion.isreplacedby.forEach((relationNameHandle: RelationNameHandle) => {
          if (isEqual(newestVersion.handle, relationNameHandle.handle)) {
            return;
          }
          // this.getName(currentVersion.handle)
          //   .pipe(take(1))
          //   .subscribe(value => {
          //     relationNameHandle.name = value;
          //     console.log('fwef', value);
          //   });
          newIsReplacedBy.push(relationNameHandle);
        });
        currentVersion.isreplacedby = newIsReplacedBy;
      }
      filteredVersions.push(currentVersion);

      // filteredVersions.forEach((blablaVersion: VersionWithRelations) => {
      //   blablaVersion.isreplacedby.forEach((isreplacedby: RelationNameHandle) => {
      //     this.getName(isreplacedby.handle)
      //       .pipe(take(1))
      //       .subscribe(value => {
      //         isreplacedby.name = value;
      //         console.log('isreplacedby', value);
      //       });
      //   });
      //   blablaVersion.replaces.forEach((replaces: RelationNameHandle) => {
      //     this.getName(replaces.handle)
      //       .pipe(take(1))
      //       .subscribe(value => {
      //         replaces.name = value;
      //         console.log('replaces', value);
      //       });
      //   });
      // });
      // this.getName(currentVersion.handle).then((r: Item[]) => {
      //   console.log('itemResponse', r);
      //   currentVersion.handle = r[0].id;
      //   filteredVersions.push(currentVersion);
      // });

      // Update name for the relations


      // .subscribe(value => {
      //   console.log('value', value);
      // });
      // console.log('current', currentVersion);
      // console.log('getName', );
      // console.log('newestVersion', newestVersion);
      // console.log('previousVersion', previousVersion);
      // if (isEqual(metadataValue, item.firstMetadataValue('dc.relation.replaces'))) {}
    }
    return filteredVersions;
  }

  getName(handle) {
    console.log('getName called with, ', handle);
    if (!this.nameCache[handle]) {
      const params = [new RequestParam('handle', handle)];
      const paramOptions = Object.assign(new FindListOptions(), {
        searchParams: [...params]
      });

      this.itemService
        .searchBy('byHandle', paramOptions, false, true)
        .pipe(
          getFirstSucceededRemoteListPayload())
        .subscribe((itemList: Item[]) => {
          console.log('itemList', itemList);
          this.nameCache[handle] = this.dsoNameService.getName(itemList?.[0]);
        });
      // this.nameCache[handle].subscribe(value => {
      //   console.log('this.nameCache[handle]', value);
      // });
    }
    console.log('heeereeee', Object.keys(this.nameCache));
    // void firstValueFrom(this.nameCache[handle]).then(value => {
    //   console.log('vvwewe', value);
    // });
    // this.nameCache[handle].subscribe(value => {
    //   console.log('this.nameCache[handle]', value);
    // });


    return this.nameCache[handle];
  }

  ngOnDestroy(): void {
    this.cleanupSubscribes();
    this.paginationService.clearPagination(this.options.id);
  }

}

export interface VersionWithRelations {
  version: Version;
  handle: string,
  replaces: RelationNameHandle[];
  isreplacedby: RelationNameHandle[];
}

export interface RelationNameHandle {
  name: string,
  handle: string
}
