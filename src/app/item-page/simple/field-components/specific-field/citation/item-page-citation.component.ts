import { Component, Input } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

@Component({
  selector: 'ds-item-page-citation-field',
  templateUrl: './item-page-citation.component.html',
})
export class ItemPageCitationFieldComponent {
  @Input() handle: string;

  constructor(private sanitizer: DomSanitizer) {
  }

  get iframeSrc(): SafeResourceUrl {
    const url = `https://www.citacepro.com/api/dspace/citace/oai:dspace.tul.cz:${this.handle}`;
    return this.sanitizer.bypassSecurityTrustResourceUrl(url);
  }
}
