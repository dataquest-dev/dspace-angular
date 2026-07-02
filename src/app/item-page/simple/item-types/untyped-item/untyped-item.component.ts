import { AsyncPipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';

import { Item } from '../../../../core/shared/item.model';
import { ViewMode } from '../../../../core/shared/view-mode.model';
import { DsoEditMenuComponent } from '../../../../shared/dso-page/dso-edit-menu/dso-edit-menu.component';
import { listableObjectComponent } from '../../../../shared/object-collection/shared/listable-object/listable-object.decorator';
import { ThemedResultsBackButtonComponent } from '../../../../shared/results-back-button/themed-results-back-button.component';
import { ClarinRefBoxComponent } from '../../../clarin-ref-box/clarin-ref-box.component';
import { ThemedMediaViewerComponent } from '../../../media-viewer/themed-media-viewer.component';
import { MiradorViewerComponent } from '../../../mirador-viewer/mirador-viewer.component';
import { ViewsDownloadsStatisticsButtonComponent } from '../../../views-downloads-statistics-button/views-downloads-statistics-button.component';
import { ClarinCollectionsItemFieldComponent } from '../../field-components/clarin-collections-item-field/clarin-collections-item-field.component';
import { ClarinGenericItemFieldComponent } from '../../field-components/clarin-generic-item-field/clarin-generic-item-field.component';
import { ThemedItemPageTitleFieldComponent } from '../../field-components/specific-field/title/themed-item-page-field.component';
import { ItemComponent } from '../shared/item.component';

/**
 * Component that represents an untyped Item page with the CLARIN/LINDAT layout
 * (citation ref-box + icon-labelled metadata fields), ported from the v7 production theme.
 */

@listableObjectComponent(Item, ViewMode.StandalonePage)
@Component({
  selector: 'ds-untyped-item',
  styleUrls: ['./untyped-item.component.scss'],
  templateUrl: './untyped-item.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    AsyncPipe,
    ClarinCollectionsItemFieldComponent,
    ClarinGenericItemFieldComponent,
    ClarinRefBoxComponent,
    DsoEditMenuComponent,
    MiradorViewerComponent,
    RouterLink,
    ThemedItemPageTitleFieldComponent,
    ThemedMediaViewerComponent,
    ThemedResultsBackButtonComponent,
    TranslateModule,
    ViewsDownloadsStatisticsButtonComponent,
  ],
})
export class UntypedItemComponent extends ItemComponent {}
