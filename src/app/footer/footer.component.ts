import { Component } from '@angular/core';

/**
 * The footer customized for CLARIN-DSpace (LINDAT/CLARIAH-CZ common footer).
 * The template is fully static, so no additional imports or services are required.
 */
@Component({
  selector: 'ds-base-footer',
  styleUrls: ['footer.component.scss'],
  templateUrl: 'footer.component.html',
  imports: [],
})
export class FooterComponent {
  dateObj: number = Date.now();
}
