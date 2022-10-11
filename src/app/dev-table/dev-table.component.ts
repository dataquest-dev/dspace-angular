import {Component, Injectable, OnInit} from '@angular/core';
import {NestedTreeControl} from '@angular/cdk/tree';
import {MatTreeNestedDataSource} from '@angular/material/tree';
import {BehaviorSubject} from 'rxjs';

import doc from './dev-progress.json';
import { FileNode } from './file-node';
import { FileDatabase } from './file-database';



@Component({
  selector: 'ds-dev-table',
  templateUrl: './dev-table.component.html',
  styleUrls: ['./dev-table.component.scss'],
  providers: [FileDatabase]
})

export class DevTableComponent implements OnInit {
  nestedTreeControl: NestedTreeControl<FileNode>;
  nestedDataSource: MatTreeNestedDataSource<FileNode>;

  constructor(database: FileDatabase) {
    this.nestedTreeControl = new NestedTreeControl<FileNode>(this._getChildren);
    this.nestedDataSource = new MatTreeNestedDataSource();

    database.dataChange.subscribe(data => this.nestedDataSource.data = data);
  }

  hasNestedChild = (_: number, nodeData: FileNode) => nodeData.children != null && nodeData.children.length > 0;

  private _getChildren = (node: FileNode) => node.children;

  ngOnInit(): void {
    // nop
  }

}
