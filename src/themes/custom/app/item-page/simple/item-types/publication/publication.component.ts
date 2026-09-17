import { AsyncPipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';

import { Context } from '../../../../../../../app/core/shared/context.model';
import { ViewMode } from '../../../../../../../app/core/shared/view-mode.model';
import { ClarinRefBoxComponent } from '../../../../../../../app/item-page/clarin-ref-box/clarin-ref-box.component';
import { ThemedMediaViewerComponent } from '../../../../../../../app/item-page/media-viewer/themed-media-viewer.component';
import { MiradorViewerComponent } from '../../../../../../../app/item-page/mirador-viewer/mirador-viewer.component';
import { ClarinCollectionsItemFieldComponent } from '../../../../../../../app/item-page/simple/field-components/clarin-collections-item-field/clarin-collections-item-field.component';
import { ClarinGenericItemFieldComponent } from '../../../../../../../app/item-page/simple/field-components/clarin-generic-item-field/clarin-generic-item-field.component';
import { ClarinItemVersionsFieldComponent } from '../../../../../../../app/item-page/simple/field-components/clarin-item-versions-field/clarin-item-versions-field.component';
import { ThemedItemPageTitleFieldComponent } from '../../../../../../../app/item-page/simple/field-components/specific-field/title/themed-item-page-field.component';
import { PublicationComponent as BaseComponent } from '../../../../../../../app/item-page/simple/item-types/publication/publication.component';
import { DsoEditMenuComponent } from '../../../../../../../app/shared/dso-page/dso-edit-menu/dso-edit-menu.component';
import { listableObjectComponent } from '../../../../../../../app/shared/object-collection/shared/listable-object/listable-object.decorator';
import { ThemedResultsBackButtonComponent } from '../../../../../../../app/shared/results-back-button/themed-results-back-button.component';

/**
 * Themed wrapper for the CLARIN/LINDAT publication item page. Reuses the base template, so it must
 * import the same standalone components the base template uses.
 */
@listableObjectComponent('Publication', ViewMode.StandalonePage, Context.Any, 'custom')
@Component({
  selector: 'ds-publication',
  // styleUrls: ['./publication.component.scss'],
  styleUrls: ['../../../../../../../app/item-page/simple/item-types/publication/publication.component.scss'],
  // templateUrl: './publication.component.html',
  templateUrl: '../../../../../../../app/item-page/simple/item-types/publication/publication.component.html',
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
export class PublicationComponent extends BaseComponent {
}
