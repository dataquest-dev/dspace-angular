import {Component, Injectable, OnInit} from '@angular/core';
import {NestedTreeControl} from '@angular/cdk/tree';
import {MatTreeNestedDataSource} from '@angular/material/tree';
import {BehaviorSubject} from 'rxjs';

import doc from './dev-progress.json';

import {MatTableModule} from '@angular/material/table';

export interface PeriodicElement {
  name: string;
  position: number;
  weight: number;
  symbol: string;
}

/**
 * Json node data with nested structure. Each node has a filename and a value or a list of children
 */
export class FileNode {
  children: FileNode[];
  taskName: string;
  donePercentage: any;
  status: any = "unspecified";

  getParsedPercentage() {
    let ret: string = "";
    if (this.donePercentage != null) {
      ret = ": " + this.donePercentage + "%";
    }
    return ret;
  }
}

/**
 * The Json tree data in string. The data could be parsed into Json object
 */
const TREE_DATA = JSON.stringify(doc);

/**
 * File database, it can build a tree structured Json object from string.
 * Each node in Json object represents a file or a directory. For a file, it has filename and type.
 * For a directory, it has filename and children (a list of files or directories).
 * The input will be a json object string, and the output is a list of `FileNode` with nested
 * structure.
 */
@Injectable()
export class FileDatabase {
  dataChange = new BehaviorSubject<FileNode[]>([]);

  get data(): FileNode[] {
    return this.dataChange.value;
  }

  constructor() {
    this.initialize();
  }

  initialize() {
    // Parse the string to json object.
    const dataObject = JSON.parse(TREE_DATA);

    // Build the tree nodes from Json object. The result is a list of `FileNode` with nested
    //     file node as children.
    const data = this.buildFileTree(dataObject);

    // Notify the change.
    this.dataChange.next(data);
  }

  reserved = ["name", "percentage", "status"]

  /**
   * Build the file structure tree. The `value` is the Json object, or a sub-tree of a Json object.
   * The return value is the list of `FileNode`.
   */
  buildFileTree(obj: { [key: string]: any }, level: number = 0): FileNode[] {
    return Object.keys(obj).reduce<FileNode[]>((accumulator, key) => {
      const value = obj[key];
      const node = new FileNode();
      node.taskName = key;
      if (this.reserved.includes(key))
        return accumulator;


      if (value != null) {
        if (typeof value === 'object') {
          node.children = this.buildFileTree(value, level + 1);
          if (value.name != null) {
            node.taskName = value.name;
          }
          if (value.status != null) {
            node.status = value.status;
          }
          if (value.percentage != null) {
            node.donePercentage = value.percentage;
          }
        } else {
          node.donePercentage = value;
        }
      }

      return accumulator.concat(node);
    }, []);
  }
}


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
  }

}
