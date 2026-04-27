import { Component, Injector, Input, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { Observable, of as observableOf } from 'rxjs';
import { map, shareReplay } from 'rxjs/operators';
import { MyDSpaceActionsComponent } from '../mydspace-actions';
import { ItemDataService } from '../../../core/data/item-data.service';
import { Item } from '../../../core/shared/item.model';
import { NotificationsService } from '../../notifications/notifications.service';
import { RequestService } from '../../../core/data/request.service';
import { SearchService } from '../../../core/shared/search/search.service';
import { getItemPageRoute } from '../../../item-page/item-page-routing-paths';
import { AuthorizationDataService } from '../../../core/data/feature-authorization/authorization-data.service';
import { FeatureID } from '../../../core/data/feature-authorization/feature-id';
import { DsoVersioningModalService } from '../../dso-page/dso-versioning-modal-service/dso-versioning-modal.service';
import { hasValue } from '../../empty.util';

/**
 * This component represents mydspace actions related to Item object.
 */
@Component({
  selector: 'ds-item-actions',
  styleUrls: ['./item-actions.component.scss'],
  templateUrl: './item-actions.component.html',
})

export class ItemActionsComponent extends MyDSpaceActionsComponent<Item, ItemDataService> implements OnInit {

  /**
   * The Item object
   */
  @Input() object: Item;

  /**
   * Route to the item's page
   */
  itemPageRoute: string;

  /**
   * Whether the current user can create a new version for this item.
   */
  canCreateVersion$: Observable<boolean>;

  /**
   * Whether the New version button should be disabled.
   */
  disableNewVersion$: Observable<boolean>;

  /**
   * Tooltip key for the New version button.
   */
  newVersionTooltip$: Observable<string>;

  /**
   * Initialize instance variables
   *
   * @param {Injector} injector
   * @param {Router} router
   * @param {NotificationsService} notificationsService
   * @param {TranslateService} translate
   * @param {SearchService} searchService
   * @param {RequestService} requestService
   */
  constructor(protected injector: Injector,
              protected router: Router,
              protected notificationsService: NotificationsService,
              protected translate: TranslateService,
              protected searchService: SearchService,
              protected requestService: RequestService,
              protected authorizationService: AuthorizationDataService,
              protected dsoVersioningModalService: DsoVersioningModalService) {
    super(Item.type, injector, router, notificationsService, translate, searchService, requestService);
  }

  ngOnInit(): void {
    this.initPageRoute();
    this.initVersioningControls();
  }

  /**
   * Init the target object
   *
   * @param {Item} object
   */
  initObjects(object: Item) {
    this.object = object;
    this.initPageRoute();
    this.initVersioningControls();
  }

  /**
   * Initialise the route to the item's page
   */
  initPageRoute() {
    this.itemPageRoute = getItemPageRoute(this.object);
  }

  /**
   * Initialize authorization and button state for version creation.
   */
  initVersioningControls(): void {
    this.canCreateVersion$ = observableOf(false);
    this.disableNewVersion$ = observableOf(false);
    this.newVersionTooltip$ = observableOf('item.page.version.create');

    if (!hasValue(this.object?.self) || !hasValue(this.object?._links?.version?.href)) {
      return;
    }

    this.canCreateVersion$ = this.authorizationService.isAuthorized(
      FeatureID.CanCreateVersion,
      this.object.self,
    );
    this.disableNewVersion$ = this.dsoVersioningModalService.isNewVersionButtonDisabled(this.object).pipe(shareReplay(1));
    this.newVersionTooltip$ = this.disableNewVersion$.pipe(
      map((isDisabled: boolean) => (isDisabled ? 'item.page.version.hasDraft' : 'item.page.version.create')),
    );
  }

  /**
   * Open the existing Create version modal for the current item.
   */
  openCreateVersionModal(): void {
    this.dsoVersioningModalService.openCreateVersionModal(this.object);
  }

}
