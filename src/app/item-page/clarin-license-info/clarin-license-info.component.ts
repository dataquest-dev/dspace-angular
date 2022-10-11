import {Component, Input, OnInit} from '@angular/core';
import {Item} from '../../core/shared/item.model';

@Component({
  selector: 'ds-clarin-license-info',
  templateUrl: './clarin-license-info.component.html',
  styleUrls: ['./clarin-license-info.component.scss']
})
export class ClarinLicenseInfoComponent implements OnInit {

  constructor() { }

  /**
   * The item to display a version history for
   */
  @Input() item: Item;

  ngOnInit(): void {
  }

}
