import { Component, Input } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import {
  CITACE_PRO_BASE_URL,
  UNIVERSITY_USING_DSPACE,
} from '../../../../../core/shared/tul/constants';
@Component({
  selector: 'ds-item-page-citation-field',
  templateUrl: './item-page-citation.component.html',
})
export class ItemPageCitationFieldComponent {
  @Input() handle: string;

  constructor(private sanitizer: DomSanitizer) {}

  get iframeSrc(): SafeResourceUrl {
    const url = `${CITACE_PRO_BASE_URL}:${UNIVERSITY_USING_DSPACE}:${this.handle}`;
    return this.sanitizer.bypassSecurityTrustResourceUrl(url);
  }
}
