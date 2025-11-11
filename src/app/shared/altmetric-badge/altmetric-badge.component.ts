import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'ds-altmetric-badge',
  template: `<div data-badge-type="donut" class="altmetric-embed" [attr.data-doi]="doi" data-badge-popover="right"></div>`,
  styles: [`
    :host {
      display: inline-block;
    }
    .altmetric-embed:hover {
      transform: scale(1.05);
      transition: transform 0.2s ease;
    }
  `]
})
export class AltmetricBadgeComponent implements OnInit {
  @Input() doi: string;

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  constructor() { }

  ngOnInit(): void {
    this.loadAltmetricScript();
  }

  private loadAltmetricScript(): void {
    if (document.querySelector('script[src*="altmetric.com/embed"]')) {
      if ((window as any)._altmetric_embed_init) {
        setTimeout(() => (window as any)._altmetric_embed_init(), 500);
      }
      return;
    }

    const script = document.createElement('script');
    script.async = true;
    script.src = 'https://d1bxh8uas1mnw7.cloudfront.net/assets/embed.js';
    document.body.appendChild(script);
  }
}
