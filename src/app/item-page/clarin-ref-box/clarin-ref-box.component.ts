import {Component, Input, OnInit} from '@angular/core';
import {Item} from '../../core/shared/item.model';

@Component({
  selector: 'ds-clarin-ref-box',
  templateUrl: './clarin-ref-box.component.html',
  styleUrls: ['./clarin-ref-box.component.scss']
})
export class ClarinRefBoxComponent implements OnInit {

  @Input() item: Item;

  constructor() { }

  ngOnInit(): void {
  }

}
