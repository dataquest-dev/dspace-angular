import { Component, OnInit } from '@angular/core';
import { getFirstSucceededRemoteDataPayload } from '../core/shared/operators';
import { VersionInfo } from '../core/shared/clarin/version-info.model';
import { VersionInfoDataService } from '../core/data/clarin/version-info-data.service';
import { BehaviorSubject } from 'rxjs';

@Component({
  selector: 'ds-version-info',
  templateUrl: './version-info.component.html',
  styleUrls: ['./version-info.component.scss']
})
export class VersionInfoComponent implements OnInit {
  versioninfo: BehaviorSubject<VersionInfo> = new BehaviorSubject<VersionInfo>(null);

  constructor(private versionInfoService: VersionInfoDataService) { }

  ngOnInit(): void {
    this.versionInfoService.getVersions()
      .pipe(
        getFirstSucceededRemoteDataPayload())
      .subscribe((versionInfo: VersionInfo) => {
        this.versioninfo.next(versionInfo);
      });
  }
}
