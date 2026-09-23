import { AsyncPipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';

import { ViewMode } from '../../../../core/shared/view-mode.model';
import { DsoEditMenuComponent } from '../../../../shared/dso-page/dso-edit-menu/dso-edit-menu.component';
import { listableObjectComponent } from '../../../../shared/object-collection/shared/listable-object/listable-object.decorator';
import { ThemedResultsBackButtonComponent } from '../../../../shared/results-back-button/themed-results-back-button.component';
import { ClarinRefBoxComponent } from '../../../clarin-ref-box/clarin-ref-box.component';
import { ThemedMediaViewerComponent } from '../../../media-viewer/themed-media-viewer.component';
import { MiradorViewerComponent } from '../../../mirador-viewer/mirador-viewer.component';
import { ClarinCollectionsItemFieldComponent } from '../../field-components/clarin-collections-item-field/clarin-collections-item-field.component';
import { ClarinGenericItemFieldComponent } from '../../field-components/clarin-generic-item-field/clarin-generic-item-field.component';
import { ClarinItemVersionsFieldComponent } from '../../field-components/clarin-item-versions-field/clarin-item-versions-field.component';
import { ThemedItemPageTitleFieldComponent } from '../../field-components/specific-field/title/themed-item-page-field.component';
import { ItemComponent } from '../shared/item.component';

/**
 * Component that represents a publication Item page with the CLARIN/LINDAT layout
 * (citation ref-box + icon-labelled metadata fields), ported from the v7 production theme.
 */

@listableObjectComponent('Publication', ViewMode.StandalonePage)
@Component({
  selector: 'ds-publication',
  styleUrls: ['./publication.component.scss'],
  templateUrl: './publication.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    AsyncPipe,
    ClarinCollectionsItemFieldComponent,
    ClarinGenericItemFieldComponent,
    ClarinItemVersionsFieldComponent,
    ClarinRefBoxComponent,
    DsoEditMenuComponent,
    MiradorViewerComponent,
    RouterLink,
    ThemedItemPageTitleFieldComponent,
    ThemedMediaViewerComponent,
    ThemedResultsBackButtonComponent,
    TranslateModule,
  ],
})
export class PublicationComponent extends ItemComponent {

}
