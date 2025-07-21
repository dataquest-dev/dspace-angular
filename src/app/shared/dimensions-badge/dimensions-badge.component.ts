import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'ds-dimensions-badge',
  //data-doi="10.1001/jama.2016.9797"
  template: `<span class="__dimensions_badge_embed__" [attr.data-doi]="doi" data-style="small_circle"></span>`,
  styles: []
})
export class DimensionsBadgeComponent implements OnInit {
  @Input() doi: string;

  constructor() { }

  ngOnInit(): void {
    // Add the script dynamically when component is initialized
    this.loadDimensionsScript();
  }

  private loadDimensionsScript(): void {
    // Don't add script if it already exists
    if (document.querySelector('script[src*="badge.dimensions.ai"]')) {
      // If script exists but badges not showing, try to refresh them
      if (window['__dimensions_embed']) {
        setTimeout(() => window['__dimensions_embed'].addBadges(), 500);
      }
      return;
    }

    // Create and add the script to the document
    const script = document.createElement('script');
    script.async = true;
    script.src = 'https://badge.dimensions.ai/badge.js';
    document.body.appendChild(script);
  }
}
