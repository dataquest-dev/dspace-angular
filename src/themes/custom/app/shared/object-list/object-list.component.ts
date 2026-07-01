import { NgClass } from '@angular/common';
import { Component } from '@angular/core';

import { ClarinItemBoxViewComponent } from '../../../../../app/shared/clarin-item-box-view/clarin-item-box-view.component';
import { ImportableListItemControlComponent } from '../../../../../app/shared/object-collection/shared/importable-list-item-control/importable-list-item-control.component';
import { ListableObjectComponentLoaderComponent } from '../../../../../app/shared/object-collection/shared/listable-object/listable-object-component-loader.component';
import { SelectableListItemControlComponent } from '../../../../../app/shared/object-collection/shared/selectable-list-item-control/selectable-list-item-control.component';
import { ObjectListComponent as BaseComponent } from '../../../../../app/shared/object-list/object-list.component';
import { PaginationComponent } from '../../../../../app/shared/pagination/pagination.component';
import { BrowserOnlyPipe } from '../../../../../app/shared/utils/browser-only.pipe';

@Component({
  selector: 'ds-themed-object-list',
  // styleUrls: ['./object-list.component.scss'],
  styleUrls: ['../../../../../app/shared/object-list/object-list.component.scss'],
  // templateUrl: './object-list.component.html'
  templateUrl: '../../../../../app/shared/object-list/object-list.component.html',
  imports: [
    BrowserOnlyPipe,
    ClarinItemBoxViewComponent,
    ImportableListItemControlComponent,
    ListableObjectComponentLoaderComponent,
    NgClass,
    PaginationComponent,
    SelectableListItemControlComponent,
  ],
})
export class ObjectListComponent extends BaseComponent {
}
