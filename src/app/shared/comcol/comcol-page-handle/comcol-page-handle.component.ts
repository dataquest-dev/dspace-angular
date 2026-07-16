
import {
  Component,
  Input,
} from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';

/**
 * This component builds a URL from the value of "handle"
 */

@Component({
  selector: 'ds-base-comcol-page-handle',
  styleUrls: ['./comcol-page-handle.component.scss'],
  templateUrl: './comcol-page-handle.component.html',
  imports: [
    TranslateModule,
  ],
})
export class ComcolPageHandleComponent {

  // Optional title
  @Input() title: string;

  // The value of "handle"
  @Input() content: string;

  public getHandle(): string {
    // CLARIN-era comcols carry no dc.identifier.uri metadata, so the REST handle field
    // (a bare handle) gets here - render the canonical resolver URL like production
    if (this.content && !this.content.startsWith('http')) {
      return 'http://hdl.handle.net/' + this.content;
    }
    return this.content;
  }
}
