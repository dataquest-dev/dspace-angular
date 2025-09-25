import { Component, Input, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ItemVersionsComponent } from '../../../versions/item-versions.component';
import { Item } from '../../../../core/shared/item.model';
import { Version } from '../../../../core/shared/version.model';

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
 * Clarin-specific field component for User/Anonymous view of item version history that extends ItemVersionsComponent
 */
@Component({
  selector: 'ds-clarin-item-versions-field',
  templateUrl: './clarin-item-versions-field.component.html',
  styleUrls: ['./clarin-item-versions-field.component.scss']
})
export class ClarinItemVersionsFieldComponent extends ItemVersionsComponent implements OnInit {

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

  ngOnInit(): void {
    // Call parent's ngOnInit first to set up all the observables
    super.ngOnInit();

    // Set up clarin-specific showMetadataValue logic
    if (this.versionsDTO$) {
      this.showMetadataValue = this.versionsDTO$.pipe(
        map((versionsDTO: VersionsDTO) => versionsDTO && versionsDTO.totalElements > 1)
      );
    } else {
      // Fallback: always show if user is admin
      this.showMetadataValue = this.isAdmin$;
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
}
