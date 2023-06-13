import { Component, Input, OnInit } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { ConfigurationDataService } from 'src/app/core/data/configuration-data.service';
@Component({
  selector: 'ds-item-page-citation-field',
  templateUrl: './item-page-citation.component.html',
})
export class ItemPageCitationFieldComponent implements OnInit {
  @Input() handle: string;

  citaceProStatus = true;
  private citaceProURL: SafeResourceUrl | null;

  constructor(
    private sanitizer: DomSanitizer,
    private configService: ConfigurationDataService
  ) {}

  ngOnInit() {
    this.configService.findByPropertyName('citace.pro.url').subscribe((remoteData) => {
        const citaceProBaseUrl = remoteData.payload.values[0];
        const universityUsingDspace = remoteData.payload.values[1];
        this.citaceProURL = this.makeCitaceProURL(
          citaceProBaseUrl,
          universityUsingDspace
        );
    });

    this.configService.findByPropertyName('citace.pro.status').subscribe((remoteData) => {
      const citaceProBaseUrl = remoteData.payload.values[0];
      this.citaceProStatus = citaceProBaseUrl === 'true';
  });

  }

  makeCitaceProURL(
    citaceProBaseUrl: string,
    universityUsingDspace: string
  ): SafeResourceUrl | null {
    const url = `${citaceProBaseUrl}:${universityUsingDspace}:15240/151406`;
    return this.sanitizer.bypassSecurityTrustResourceUrl(url);
  }

  get iframeSrc(): SafeResourceUrl | null {
    return this.citaceProURL;
  }
}
