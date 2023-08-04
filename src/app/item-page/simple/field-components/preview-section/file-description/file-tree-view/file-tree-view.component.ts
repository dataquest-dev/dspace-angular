import { Component, Input, OnInit } from '@angular/core';
import { FileInfo } from 'src/app/core/metadata/metadata-bitstream.model';

@Component({
  selector: 'ds-file-tree-view',
  templateUrl: './file-tree-view.component.html',
  styleUrls: ['./file-tree-view.component.scss'],
})
export class FileTreeViewComponent implements OnInit {
  @Input()
  node: FileInfo;

  getKeys(obj: any): string[] {
    return Object.keys(obj);
  }

  ngOnInit(): void {
    console.log(this.node);
  }
}
