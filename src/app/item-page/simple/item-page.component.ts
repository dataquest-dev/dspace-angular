import {map, take} from 'rxjs/operators';
import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import { BehaviorSubject, Observable} from 'rxjs';
import { ItemDataService } from '../../core/data/item-data.service';
import { RemoteData } from '../../core/data/remote-data';

import { Item } from '../../core/shared/item.model';

import { fadeInOut } from '../../shared/animations/fade';
import { getAllSucceededRemoteDataPayload, getAllSucceededRemoteListPayload, redirectOn4xx } from '../../core/shared/operators';
import { ViewMode } from '../../core/shared/view-mode.model';
import { AuthService } from '../../core/auth/auth.service';
import { getItemPageRoute } from '../item-page-routing-paths';
import { isNotEmpty } from '../../shared/empty.util';
import { FeatureID } from '../../core/data/feature-authorization/feature-id';
import { AuthorizationDataService } from '../../core/data/feature-authorization/authorization-data.service';
import { RegistryService } from 'src/app/core/registry/registry.service';
import { MetadataBitstream } from 'src/app/core/metadata/metadata-bitstream.model';

/**
 * This component renders a simple item page.
 * The route parameter 'id' is used to request the item it represents.
 * All fields of the item that should be displayed, are defined in its template.
 */
@Component({
  selector: 'ds-item-page',
  styleUrls: ['./item-page.component.scss'],
  templateUrl: './item-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [fadeInOut]
})
export class ItemPageComponent implements OnInit {

  /**
   * The item's id
   */
  id: number;

  /**
   * The item wrapped in a remote-data object
   */
  itemRD$: Observable<RemoteData<Item>>;

  /**
   * The view-mode we're currently on
   */
  viewMode = ViewMode.StandalonePage;

  /**
   * Route to the item's page
   */
  itemPageRoute$: Observable<string>;
   /**
   * handle of the specific item 
   */
  itemHandle: string;
   /**
   * handle of the specific item 
   */
  fileName: string;
  command: string;

  /**
   * Whether the current user is an admin or not
   */
  isAdmin$: Observable<boolean>;

  /**
   * If item is withdrawn and has new destination in the metadata: `dc.relation.isreplacedby`
   */
  replacedTombstone = false;

  /**
   * If item is withdrawn and has/doesn't has reason of withdrawal
   */
  withdrawnTombstone = false;

  /**
   * If download by command button is click, the command line will be shown
   */
  isCommandLineVisible = false
  listOfFiles: any;



  constructor(
    protected route: ActivatedRoute,
    private router: Router,
    private items: ItemDataService,
    private authService: AuthService,
    private authorizationService: AuthorizationDataService,
    protected registryService: RegistryService
  ) { }

  /**
   * Initialize instance variables
   */
  ngOnInit(): void {
    this.itemRD$ = this.route.data.pipe(
      map((data) => data.dso as RemoteData<Item>),
      redirectOn4xx(this.router, this.authService)
    );
    this.itemPageRoute$ = this.itemRD$.pipe(
      getAllSucceededRemoteDataPayload(),
      map((item) => getItemPageRoute(item))
    );

    this.showTombstone();

    this.registryService
.getMetadataBitstream(this.itemHandle, 'ORIGINAL,TEXT,THUMBNAIL')
      .pipe(getAllSucceededRemoteListPayload())
      .subscribe((data: MetadataBitstream[]) => {
        this.listOfFiles = data;
        this.generateCurlCommand();
      });
  }

  showTombstone() {
    // if the item is withdrawn
    let isWithdrawn = false;
    // metadata value from `dc.relation.isreplacedby`
    let isReplaced = '';

    // load values from item
    this.itemRD$.pipe(
      take(1),
      getAllSucceededRemoteDataPayload())
      .subscribe((item: Item) => {
        this.itemHandle = item.handle;
        isWithdrawn = item.isWithdrawn;
        isReplaced = item.metadata['dc.relation.isreplacedby']?.[0]?.value;
      });

    // do not show tombstone for non withdrawn items
    if (!isWithdrawn) {
      return;
    }

    // for users navigate to the custom tombstone
    // for admin stay on the item page with tombstone flag
    this.isAdmin$ = this.authorizationService.isAuthorized(FeatureID.AdministratorOf);
    this.isAdmin$.subscribe(isAdmin => {
      // do not show tombstone for admin but show it for users
      if (!isAdmin) {
        if (isNotEmpty(isReplaced)) {
          this.replacedTombstone = true;
        } else {
          this.withdrawnTombstone = true;
        }
      }
    });
  }

  setCommandline() {
    this.isCommandLineVisible = !this.isCommandLineVisible;
  }

  generateCurlCommand() {
    let fileNames = this.listOfFiles
    .filter((file: MetadataBitstream) => file.format === 'application/octet-stream' || file.format === 'application/pdf')
    .map((file: MetadataBitstream) => file.name);

    this.command =`curl --remote-name-all http://localhost:8080/server/bitstream/handle/${this.itemHandle}/{${fileNames.join(',')}}`;
  }

  downloadFiles() {
    window.location.href = `http://localhost:8080/server/bitstream/allzip?handleId=${this.itemHandle}`;
  }
}
