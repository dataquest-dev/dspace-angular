import { Component } from '@angular/core';

// noinspection AngularMissingOrInvalidDeclarationInModule
@Component({
  selector: 'ds-test-component',
  template: '<ng-content></ng-content>',
})
export class TestComponent {
  type = 'themed';
  testInput = 'unset';
}
