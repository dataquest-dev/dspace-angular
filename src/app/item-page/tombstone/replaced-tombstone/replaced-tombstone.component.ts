import {Component, Input, OnInit} from '@angular/core';

@Component({
  selector: 'ds-replaced-tombstone',
  templateUrl: './replaced-tombstone.component.html',
  styleUrls: ['./replaced-tombstone.component.scss']
})
export class ReplacedTombstoneComponent implements OnInit {

  /**
   * The Item to get reason or destination for Tombstone
   */
  @Input() newDestination: string;

  /**
   * The Item to get reason or destination for Tombstone
   */
  @Input() itemName: string;

  /**
   * The Item to get reason or destination for Tombstone
   */
  @Input() authors: string[];

  constructor() { }

  ngOnInit(): void {
    this.newDestination = 'some URL';
  }

}
