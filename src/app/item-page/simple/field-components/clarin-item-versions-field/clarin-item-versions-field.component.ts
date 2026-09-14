import {
  AsyncPipe,
  NgClass,
} from '@angular/common';
import {
  Component,
  inject,
  Input,
  OnInit,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  TranslateModule,
  TranslateService,
} from '@ngx-translate/core';
import {
  combineLatest,
  Observable,
  of,
} from 'rxjs';
import {
  map,
  shareReplay,
  switchMap,
} from 'rxjs/operators';

import { MAX_PAGE_SIZE } from '../../../../core/data/find-list-options.model';
import { RemoteData } from '../../../../core/data/remote-data';
import { Item } from '../../../../core/shared/item.model';
import {
  getFirstCompletedRemoteData,
  getFirstSucceededRemoteDataPayload,
} from '../../../../core/shared/operators';
import { Version } from '../../../../core/shared/version.model';
import { WorkflowItem } from '../../../../core/submission/models/workflowitem.model';
import { WorkspaceItem } from '../../../../core/submission/models/workspaceitem.model';
import { WorkflowItemDataService } from '../../../../core/submission/workflowitem-data.service';
import { WorkspaceitemDataService } from '../../../../core/submission/workspaceitem-data.service';
import { getItemVersionRoute } from '../../../item-page-routing-paths';
import { ItemVersionsComponent } from '../../../versions/item-versions.component';

/**
 * Local type definition matching the parent component's VersionsDTO structure
 */
interface VersionsDTO {
  totalElements: number;
  versionDTOs: VersionDTO[];
}

interface VersionDTO {
  version: Version;
  canEditVersion: Observable<boolean>;
  canDeleteVersion: Observable<boolean>;
}

/**
 * Enhanced VersionDTO with pre-computed workspace/workflow IDs for template optimization
 */
interface EnhancedVersionDTO extends VersionDTO {
  versionItem$: Observable<RemoteData<Item>>;
  workspaceId$: Observable<string | undefined>;
  workflowId$: Observable<string | undefined>;
  isCurrentVersion: boolean;
}

/**
 * Clarin-specific field component for User/Anonymous view of item version history that extends ItemVersionsComponent
 */
@Component({
  imports: [
    AsyncPipe,
    NgClass,
    RouterLink,
    TranslateModule,
  ],
  selector: 'ds-clarin-item-versions-field',
  templateUrl: './clarin-item-versions-field.component.html',
  styleUrls: ['./clarin-item-versions-field.component.scss'],
})
export class ClarinItemVersionsFieldComponent extends ItemVersionsComponent implements OnInit {

  private readonly workspaceItemDataService = inject(WorkspaceitemDataService);

  private readonly workflowItemDataService = inject(WorkflowItemDataService);

  private readonly translate = inject(TranslateService);

  /**
   * Maximum number of versions to fetch at once for the dropdown display.
   */
  private readonly MAX_VERSIONS_TO_DISPLAY = MAX_PAGE_SIZE;

  /**
   * Icon name for the clarin field
   */
  @Input() iconName?: string;

  /**
   * Toggle state for version history display
   */
  showVersionHistory = false;

  /**
   * Observable to check if metadata field should be shown - clarin-specific implementation
   * Returns true if there are multiple versions to display
   */
  showMetadataValue: Observable<boolean>;

  /**
   * Enhanced versions with pre-computed workspace/workflow IDs
   */
  enhancedVersions$: Observable<EnhancedVersionDTO[]>;

  ngOnInit(): void {
    // Override the parent's pageSize to fetch all versions at once for the dropdown display
    this.pageSize = this.MAX_VERSIONS_TO_DISPLAY;
    this.options = Object.assign(this.options, {
      pageSize: this.pageSize,
    });

    super.ngOnInit();

    // Set up clarin-specific showMetadataValue logic
    if (this.versionsDTO$) {
      this.showMetadataValue = this.versionsDTO$.pipe(
        map((versionsDTO: VersionsDTO) => versionsDTO && versionsDTO.totalElements > 1),
      );

      // Pre-compute workspace/workflow IDs to optimize template performance
      this.enhancedVersions$ = combineLatest([
        this.versionsDTO$,
        this.versionRD$,
      ]).pipe(
        map(([versionsDTO, versionRD]) => {
          const currentVersionId = versionRD?.payload?.id;
          return versionsDTO.versionDTOs.map(versionDTO => {
            const versionItem$ = versionDTO.version.item;
            const workspaceId$ = (this.hasDraftVersion$ ?? of(false)).pipe(
              switchMap(hasDraftVersion =>
                hasDraftVersion ? this.getWorkspaceId(versionItem$) : of(undefined),
              ),
            );
            const workflowId$ = workspaceId$.pipe(
              switchMap((workspaceId) =>
                workspaceId ? of(undefined) : this.getWorkflowId(versionItem$),
              ),
            );
            return {
              ...versionDTO,
              versionItem$,
              workspaceId$,
              workflowId$,
              isCurrentVersion: versionDTO.version.id === currentVersionId,
            } as EnhancedVersionDTO;
          });
        }),
        shareReplay({ bufferSize: 1, refCount: true }), // Cache the result to prevent duplicate requests
      );
    } else {
      // The item has no version, so there is no history to show
      this.showMetadataValue = of(false);
    }
  }

  /**
   * Toggle the visibility of version history
   */
  toggleVersionHistory(): void {
    this.showVersionHistory = !this.showVersionHistory;
  }

  /**
   * Get the display name for a version item
   * @param versionItem the item to get the name for
   */
  getVersionItemDisplayName(versionItem: Item): string {
    return versionItem?.firstMetadataValue('dc.title') || versionItem?.name || 'Untitled';
  }

  /**
   * Get the appropriate aria-label for the toggle button
   * @returns The aria-label text for accessibility
   */
  getToggleAriaLabel(): string {
    const action = this.showVersionHistory
      ? this.translate.instant('item.version.history.collapse')
      : this.translate.instant('item.version.history.expand');
    const history = this.translate.instant('item.version.history.label');
    return `${action} ${history}`;
  }

  /**
   * Get the route to the item page of the given version
   * @param versionId the ID of the version for which the route will be retrieved
   */
  getVersionRoute(versionId: string): string {
    return getItemVersionRoute(versionId);
  }

  /**
   * Get the ID of the workspace item the version item belongs to, or undefined when it is not in submission
   * @param versionItem the version item's observable
   */
  getWorkspaceId(versionItem: Observable<RemoteData<Item>>): Observable<string> {
    return versionItem.pipe(
      getFirstSucceededRemoteDataPayload(),
      map((item: Item) => item.uuid),
      switchMap((itemUuid: string) => this.workspaceItemDataService.findByItem(itemUuid, true)),
      getFirstCompletedRemoteData<WorkspaceItem>(),
      map((res: RemoteData<WorkspaceItem>) => res?.payload?.id),
    );
  }

  /**
   * Get the ID of the workflow item the version item belongs to, or undefined when it is not in workflow
   * @param versionItem the version item's observable
   */
  getWorkflowId(versionItem: Observable<RemoteData<Item>>): Observable<string> {
    return versionItem.pipe(
      getFirstSucceededRemoteDataPayload(),
      map((item: Item) => item.uuid),
      switchMap((itemUuid: string) => this.workflowItemDataService.findByItem(itemUuid, true)),
      getFirstCompletedRemoteData<WorkflowItem>(),
      map((res: RemoteData<WorkflowItem>) => res?.payload?.id),
    );
  }

  /**
   * Get workspace ID for a version item if there's a draft version, otherwise return undefined
   * This method optimizes the template logic by pre-computing the conditional check
   * @param versionItem the version item's observable
   */
  getVersionWorkspaceId(versionItem: Observable<RemoteData<Item>>): Observable<string | undefined> {
    return (this.hasDraftVersion$ ?? of(false)).pipe(
      switchMap(hasDraftVersion =>
        hasDraftVersion ? this.getWorkspaceId(versionItem) : of(undefined),
      ),
    );
  }

  /**
   * Get workflow ID for a version item if workspace ID is not available
   * This method optimizes the template logic by handling the conditional workflow ID logic
   * @param versionItem the version item's observable
   * @param workspaceId$ the workspace ID observable
   */
  getVersionWorkflowId(versionItem: Observable<RemoteData<Item>>, workspaceId$: Observable<string | undefined>): Observable<string | undefined> {
    return workspaceId$.pipe(
      switchMap((workspaceId) =>
        workspaceId ? of(undefined) : this.getWorkflowId(versionItem),
      ),
    );
  }

  /**
   * TrackBy function for version list to optimize *ngFor performance
   * @param index the index of the item
   * @param versionDTO the version DTO to track
   */
  trackByVersionId(index: number, versionDTO: EnhancedVersionDTO): string {
    return versionDTO.version.id;
  }
}
