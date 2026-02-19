import { Component, Input, OnInit } from '@angular/core';
import { Observable, of, combineLatest } from 'rxjs';
import { map, switchMap, shareReplay } from 'rxjs/operators';
import { ItemVersionsComponent } from '../../../versions/item-versions.component';
import { Item } from '../../../../core/shared/item.model';
import { Version } from '../../../../core/shared/version.model';
import { RemoteData } from '../../../../core/data/remote-data';

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
  selector: 'ds-clarin-item-versions-field',
  templateUrl: './clarin-item-versions-field.component.html',
  styleUrls: ['./clarin-item-versions-field.component.scss']
})
export class ClarinItemVersionsFieldComponent extends ItemVersionsComponent implements OnInit {

  /**
   * Maximum number of versions to fetch at once for the dropdown display.
   */
  private readonly MAX_VERSIONS_TO_DISPLAY = 9999;

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
      pageSize: this.pageSize
    });

    super.ngOnInit();

    // Set up clarin-specific showMetadataValue logic
    if (this.versionsDTO$) {
      this.showMetadataValue = this.versionsDTO$.pipe(
        map((versionsDTO: VersionsDTO) => versionsDTO && versionsDTO.totalElements > 1)
      );

      // Pre-compute workspace/workflow IDs to optimize template performance
      this.enhancedVersions$ = combineLatest([
        this.versionsDTO$,
        this.versionRD$
      ]).pipe(
        map(([versionsDTO, versionRD]) => {
          const currentVersionId = versionRD?.payload?.id;
          return versionsDTO.versionDTOs.map(versionDTO => {
            const versionItem$ = versionDTO.version.item;
            const workspaceId$ = (this.hasDraftVersion$ ?? of(false)).pipe(
              switchMap(hasDraftVersion =>
                hasDraftVersion ? this.getWorkspaceId(versionItem$) : of(undefined)
              )
            );
            const workflowId$ = workspaceId$.pipe(
              switchMap((workspaceId) =>
                workspaceId ? of(undefined) : this.getWorkflowId(versionItem$)
              )
            );
            return {
              ...versionDTO,
              versionItem$,
              workspaceId$,
              workflowId$,
              isCurrentVersion: versionDTO.version.id === currentVersionId
            } as EnhancedVersionDTO;
          });
        }),
        shareReplay(1) // Cache the result to prevent duplicate requests
      );
    } else {
      // Fallback: check if isAdmin$ is available, otherwise hide the component
      this.showMetadataValue = this.isAdmin$ ? this.isAdmin$ : of(false);
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
      ? this.translateService.instant('item.version.history.collapse')
      : this.translateService.instant('item.version.history.expand');
    const history = this.translateService.instant('item.version.history.label');
    return `${action} ${history}`;
  }

  /**
   * Get workspace ID for a version item if there's a draft version, otherwise return undefined
   * This method optimizes the template logic by pre-computing the conditional check
   * @param versionItem the version item's observable
   */
  getVersionWorkspaceId(versionItem: Observable<Item>): Observable<string | undefined> {
    return (this.hasDraftVersion$ ?? of(false)).pipe(
      switchMap(hasDraftVersion =>
        hasDraftVersion ? this.getWorkspaceId(versionItem) : of(undefined)
      )
    );
  }

  /**
   * Get workflow ID for a version item if workspace ID is not available
   * This method optimizes the template logic by handling the conditional workflow ID logic
   * @param versionItem the version item's observable
   * @param workspaceId$ the workspace ID observable
   */
  getVersionWorkflowId(versionItem: Observable<Item>, workspaceId$: Observable<string | undefined>): Observable<string | undefined> {
    return workspaceId$.pipe(
      switchMap((workspaceId) =>
        workspaceId ? of(undefined) : this.getWorkflowId(versionItem)
      )
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
