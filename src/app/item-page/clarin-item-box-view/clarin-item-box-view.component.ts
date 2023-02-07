import {Component, Input, OnInit} from '@angular/core';
import {Item} from '../../core/shared/item.model';

@Component({
  selector: 'ds-clarin-item-box-view',
  templateUrl: './clarin-item-box-view.component.html',
  styleUrls: ['./clarin-item-box-view.component.scss']
})
export class ClarinItemBoxViewComponent implements OnInit {

  @Input() item$: Item = null;

  constructor() { }

  ngOnInit(): void {
  }

}
