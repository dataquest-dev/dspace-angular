import { Component, Inject, OnInit, PLATFORM_ID, ViewChild, ViewContainerRef, ComponentFactoryResolver } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

/**
 * Component that dynamically loads the AutoregistrationComponent only in the browser
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
    private componentFactoryResolver: ComponentFactoryResolver
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId); // Check if running in the browser
  }

  ngOnInit(): void {
    if (this.isBrowser) {
      // Dynamically load the AutoregistrationComponent only in the browser
      import('./autoregistration.component').then(({ AutoregistrationComponent }) => {
        const componentFactory =
          this.componentFactoryResolver.resolveComponentFactory(AutoregistrationComponent);
        const componentRef = this.dynamicComponent.createComponent(componentFactory);
        componentRef.changeDetectorRef.detectChanges();
      });
    }
  }
}
