import {Component, Input, OnInit} from '@angular/core';
import {Bitstream} from '../../core/shared/bitstream.model';
import {Observable} from 'rxjs';

@Component({
  selector: 'ds-clarin-license-agreement-page',
  templateUrl: './clarin-license-agreement-page.component.html',
  styleUrls: ['./clarin-license-agreement-page.component.scss']
})
export class ClarinLicenseAgreementPageComponent implements OnInit {

  @Input()
  bitstream: Observable<Bitstream>;

  constructor() { }

  ngOnInit(): void {
    console.log('bitstream is: ', this.bitstream);
  }

}
