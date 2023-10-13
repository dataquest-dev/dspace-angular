import { Component, OnInit } from '@angular/core';
import {BehaviorSubject} from 'rxjs';
import {RemoteData} from '../../core/data/remote-data';
import {PaginatedList} from '../../core/data/paginated-list.model';
import {ClarinLicense} from '../../core/shared/clarin/clarin-license.model';
import {ClarinLicenseDataService} from '../../core/data/clarin/clarin-license-data.service';
import {getFirstSucceededRemoteListPayload} from '../../core/shared/operators';
import {FindListOptions} from '../../core/data/find-list-options.model';

@Component({
  selector: 'ds-clarin-all-licenses-page',
  templateUrl: './clarin-all-licenses-page.component.html',
  styleUrls: ['./clarin-all-licenses-page.component.scss']
})
export class ClarinAllLicensesPageComponent implements OnInit {

  /**
   * The list of ClarinLicense object as BehaviorSubject object
   */
  licensesRD$: BehaviorSubject<ClarinLicense[]> = new BehaviorSubject<ClarinLicense[]>(null);

  constructor(private clarinLicenseService: ClarinLicenseDataService) { }

  ngOnInit(): void {
    this.loadAllLicenses();
  }

  loadAllLicenses() {
    const options = new FindListOptions();
    options.currentPage = 0;
    // Load all licenses
    options.elementsPerPage = 1000;
    return this.clarinLicenseService.findAll(options, false)
      .pipe(getFirstSucceededRemoteListPayload())
      .subscribe(res => {
        console.log('res', res);
        this.licensesRD$.next(res);
      });
  }

}
