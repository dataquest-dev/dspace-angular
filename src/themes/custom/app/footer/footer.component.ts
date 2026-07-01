import { Component } from '@angular/core';

import { FooterComponent as BaseComponent } from '../../../../app/footer/footer.component';

@Component({
  selector: 'ds-themed-footer',
  // styleUrls: ['./footer.component.scss'],
  styleUrls: ['../../../../app/footer/footer.component.scss'],
  // templateUrl: './footer.component.html'
  templateUrl: '../../../../app/footer/footer.component.html',
  imports: [],
})
export class FooterComponent extends BaseComponent {
}
