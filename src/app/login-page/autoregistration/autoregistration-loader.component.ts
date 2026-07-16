import { isPlatformBrowser } from '@angular/common';
import {
  Component,
  Inject,
  OnInit,
  PLATFORM_ID,
  ViewChild,
  ViewContainerRef,
} from '@angular/core';

/**
 * Component that dynamically loads the AutoregistrationComponent only in the browser.
 */
@Component({
  selector: 'ds-autoregistration-loader',
  template: '<ng-template #dynamicComponent></ng-template>',
})
export class AutoregistrationLoaderComponent implements OnInit {
  @ViewChild('dynamicComponent', { read: ViewContainerRef }) dynamicComponent: ViewContainerRef;

  isBrowser: boolean;

  constructor(
    @Inject(PLATFORM_ID) private platformId: object,
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId); // Check if running in the browser
  }

  ngOnInit(): void {
    if (this.isBrowser) {
      // Dynamically load the AutoregistrationComponent only in the browser.
      // v9: ViewContainerRef.createComponent takes the component type directly
      // (ComponentFactoryResolver was removed in Angular 17).
      void import('./autoregistration.component').then(({ AutoregistrationComponent }) => {
        const componentRef = this.dynamicComponent.createComponent(AutoregistrationComponent);
        componentRef.changeDetectorRef.detectChanges();
      });
    }
  }
}
