import { CommonModule } from '@angular/common';
import {
  Component,
  Input,
  OnInit,
} from '@angular/core';
import {
  DomSanitizer,
  SafeResourceUrl,
} from '@angular/platform-browser';
import {
  BehaviorSubject,
  combineLatest,
  of,
} from 'rxjs';
import {
  catchError,
  take,
} from 'rxjs/operators';

import { ConfigurationDataService } from '../../../../../core/data/configuration-data.service';
import { getFirstCompletedRemoteData } from '../../../../../core/shared/operators';

@Component({
  selector: 'ds-item-page-citation-field',
  templateUrl: './item-page-citation.component.html',
  standalone: true,
  imports: [
    CommonModule,
  ],
})
export class ItemPageCitationFieldComponent implements OnInit {
  @Input() handle: string;

  citaceProStatus$ = new BehaviorSubject<boolean>(false);
  citaceProURL$ = new BehaviorSubject<SafeResourceUrl | null>(null);

  constructor(
    private sanitizer: DomSanitizer,
    private configService: ConfigurationDataService,
  ) {}


  ngOnInit() {
    const citaceProUrl$ = this.configService.findByPropertyName('citace.pro.url').pipe(
      getFirstCompletedRemoteData(),
      catchError(() => of(null)),
    );
    const universityUsingDspace$ = this.configService.findByPropertyName('citace.pro.university').pipe(
      getFirstCompletedRemoteData(),
      catchError(() => of(null)),
    );
    const citaceProAllowed$ = this.configService.findByPropertyName('citace.pro.allowed').pipe(
      getFirstCompletedRemoteData(),
      catchError(() => of(null)),
    );

    combineLatest([citaceProUrl$, universityUsingDspace$, citaceProAllowed$]).pipe(
      take(1),
    ).subscribe(([citaceProUrlData, universityData, citaceProAllowedData]) => {
      const citaceProBaseUrl = citaceProUrlData?.payload?.values?.[0];
      const universityUsingDspace = universityData?.payload?.values?.[0];
      this.citaceProURL$.next(this.makeCitaceProURL(citaceProBaseUrl, universityUsingDspace));

      const citaceProAllowed = citaceProAllowedData?.payload?.values?.[0];
      this.citaceProStatus$.next(citaceProAllowed === 'true');
    });
  }


  makeCitaceProURL(
    citaceProBaseUrl: string,
    universityUsingDspace: string,
  ): SafeResourceUrl | null {
    if (!citaceProBaseUrl || !universityUsingDspace || !this.handle) {
      return null;
    }
    const url = `${citaceProBaseUrl}:${universityUsingDspace}:${this.handle}`;
    return this.sanitizer.bypassSecurityTrustResourceUrl(url);
  }
}
