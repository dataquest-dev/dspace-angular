import { Component, OnInit } from '@angular/core';
import {SubmissionSectionLicenseComponent} from '../license/section-license.component';
import {renderSectionFor} from '../sections-decorator';
import {SectionsType} from '../sections-type';

@Component({
  selector: 'ds-clarin-license-distribution',
  templateUrl: './clarin-license-distribution.component.html',
  styleUrls: ['./clarin-license-distribution.component.scss']
})
@renderSectionFor(SectionsType.License)
export class SubmissionSectionClarinLicenseDistributionComponent extends SubmissionSectionLicenseComponent {

  // @ts-ignore
  constructor() { }

  ngOnInit(): void {
  }

}
