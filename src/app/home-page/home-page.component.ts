import { Component, OnInit } from '@angular/core';
import { map } from 'rxjs/operators';
import { ActivatedRoute } from '@angular/router';
import { Observable } from 'rxjs';
import { Site } from '../core/shared/site.model';
import {getAllSucceededRemoteDataPayload} from '../core/shared/operators';
import {ClarinLicenseDataService} from '../core/data/clarin/clarin-license-data.service';

@Component({
  selector: 'ds-home-page',
  styleUrls: ['./home-page.component.scss'],
  templateUrl: './home-page.component.html'
})
export class HomePageComponent implements OnInit {

  site$: Observable<Site>;

  constructor(
    private route: ActivatedRoute,
    private clarinLicenseService: ClarinLicenseDataService
  ) {
  }

  ngOnInit(): void {
    this.site$ = this.route.data.pipe(
      map((data) => data.site as Site),
    );

    this.loadLicenses();
  }

  loadLicenses() {
    this.clarinLicenseService.findAll().pipe(
      getAllSucceededRemoteDataPayload()
    ).subscribe(value => {
      console.log('license', value);
    });
  }
}
