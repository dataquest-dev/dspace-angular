import { CommonModule } from '@angular/common';
import {
  Component,
  Input,
} from '@angular/core';
import { NgbCollapseModule } from '@ng-bootstrap/ng-bootstrap';

import { FileInfo } from '../../../../../../core/metadata/metadata-bitstream.model';

@Component({
  selector: 'ds-file-tree-view',
  imports: [
    CommonModule,
    FileTreeViewComponent,
    NgbCollapseModule,
  ],
  templateUrl: './file-tree-view.component.html',
  styleUrls: ['./file-tree-view.component.scss'],
})
export class FileTreeViewComponent {
  @Input()
  node: FileInfo;

  isCollapsed = false;

  getKeys(obj: any): string[] {
    return Object.keys(obj);
  }
}
