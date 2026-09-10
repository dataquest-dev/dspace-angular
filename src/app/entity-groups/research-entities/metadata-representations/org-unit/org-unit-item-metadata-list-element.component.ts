import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NgbTooltip } from '@ng-bootstrap/ng-bootstrap';

import { ItemMetadataRepresentationListElementComponent } from '../../../../shared/object-list/metadata-representation-list-element/item/item-metadata-representation-list-element.component';
import { TruncatableComponent } from '../../../../shared/truncatable/truncatable.component';
import { DsLangPipe } from '../../../../shared/utils/ds-lang.pipe';

@Component({
  selector: 'ds-org-unit-item-metadata-list-element',
  templateUrl: './org-unit-item-metadata-list-element.component.html',
  imports: [
    DsLangPipe,
    NgbTooltip,
    RouterLink,
    TruncatableComponent,
  ],
})
/**
 * The component for displaying an item of the type OrgUnit as a metadata field
 */
export class OrgUnitItemMetadataListElementComponent extends ItemMetadataRepresentationListElementComponent {
}
