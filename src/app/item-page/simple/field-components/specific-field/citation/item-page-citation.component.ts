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
  combineLatest,
  of,
} from 'rxjs';
import {
  catchError,
  take,
} from 'rxjs/operators';
import { ConfigurationDataService } from 'src/app/core/data/configuration-data.service';

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

  citaceProStatus = true;
  private citaceProURL: SafeResourceUrl | null;

  constructor(
    private sanitizer: DomSanitizer,
    private configService: ConfigurationDataService,
  ) {}


  ngOnInit() {
    const citaceProUrl$ = this.configService.findByPropertyName('citace.pro.url').pipe(
      catchError(() => of(null)),
    );
    const universityUsingDspace$ = this.configService.findByPropertyName('citace.pro.university').pipe(
      catchError(() => of(null)),
    );
    const citaceProAllowed$ = this.configService.findByPropertyName('citace.pro.allowed').pipe(
      catchError(() => of(null)),
    );

    combineLatest([citaceProUrl$, universityUsingDspace$, citaceProAllowed$]).pipe(
      take(1),
    ).subscribe(([citaceProUrlData, universityData, citaceProAllowedData]) => {
      const citaceProBaseUrl = citaceProUrlData?.payload?.values?.[0];
      const universityUsingDspace = universityData?.payload?.values?.[0];
      this.citaceProURL = this.makeCitaceProURL(citaceProBaseUrl, universityUsingDspace);

      const citaceProAllowed = citaceProAllowedData?.payload?.values?.[0];
      this.citaceProStatus = citaceProAllowed === 'true';
    });
  }


  makeCitaceProURL(
    citaceProBaseUrl: string,
    universityUsingDspace: string,
  ): SafeResourceUrl | null {
    const url = `${citaceProBaseUrl}:${universityUsingDspace}:${this.handle}`;
    return this.sanitizer.bypassSecurityTrustResourceUrl(url);
  }

  get iframeSrc(): SafeResourceUrl | null {
    return this.citaceProURL;
  }
}
