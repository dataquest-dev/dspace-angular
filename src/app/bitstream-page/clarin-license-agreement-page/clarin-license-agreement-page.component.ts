import {Component, Input, OnInit} from '@angular/core';
import {Bitstream} from '../../core/shared/bitstream.model';
import {Observable} from 'rxjs';
import {ClarinLicenseDataService} from '../../core/data/clarin/clarin-license-data.service';
import {filter} from 'rxjs/operators';
import {hasCompleted} from '../../core/data/request.reducer';

@Component({
  selector: 'ds-clarin-license-agreement-page',
  templateUrl: './clarin-license-agreement-page.component.html',
  styleUrls: ['./clarin-license-agreement-page.component.scss']
})
export class ClarinLicenseAgreementPageComponent implements OnInit {

  @Input()
  bitstream: Observable<Bitstream>;

  constructor(protected clarinLicenseService: ClarinLicenseDataService) { }

  ngOnInit(): void {
    console.log('bitstream is: ', this.bitstream);
    this.clarinLicenseService.findAll()
      .pipe(
        filter(res => hasCompleted(res.state))
      ).subscribe(res => {
        console.log('res', res);
    });
    // ziskat licenciu s required info a s user registration - ak uz uzivate lzadal nejake data, tak sa to ulozi k licencii
    // ak je user registration prazdne, tak zobraz prazne polia
    // na zaklade user registra

    // get record from user_registration based on the license_definition
    // get record from user_metadata based on the user_registration
    // generovat token - ziskaj user-resource allowance na zaklade bitstream_id a upravit tabulku

    // TO DO
    // - vytvorit repozitar pre tabulku license_resource_user_allowance, ktoru updatnem nobym tokenom
    // - vytvorit endpoint na user_registration tabulku, doliadnut, aby sa license_definition updatla aj s novym user_regisration
    // - vytvorit endpoint pre user_metadata, vytvorit user_metadata REST

    // nacitat/ulozit do tabulky user_metadata
    // nacitat/ulozit do tabulky user_registration
  }

}
