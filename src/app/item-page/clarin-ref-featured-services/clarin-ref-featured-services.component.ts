import {Component, Input, OnInit} from '@angular/core';
import {Item} from '../../core/shared/item.model';

@Component({
  selector: 'ds-clarin-ref-featured-services',
  templateUrl: './clarin-ref-featured-services.component.html',
  styleUrls: ['./clarin-ref-featured-services.component.scss']
})
export class ClarinRefFeaturedServicesComponent implements OnInit {

  @Input() item: Item;

  constructor() { }

  ngOnInit(): void {
  }

}
