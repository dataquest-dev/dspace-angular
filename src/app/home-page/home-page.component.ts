import { Component, OnInit } from '@angular/core';
import { map } from 'rxjs/operators';
import { ActivatedRoute } from '@angular/router';
import { Observable } from 'rxjs';
import { Site } from '../core/shared/site.model';
import {NgbCarouselConfig} from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'ds-home-page',
  styleUrls: ['./home-page.component.scss'],
  templateUrl: './home-page.component.html',
  providers: [NgbCarouselConfig]
})
export class HomePageComponent implements OnInit {

  slides = [
    {name: 'Citation', short: 'Citation'},
    {name: 'Deposit Free And Save', short: 'Free Deposit'},
    {name: 'Linguistic Data', short: 'LData'}
  ];

  site$: Observable<Site>;

  constructor(
    private route: ActivatedRoute, config: NgbCarouselConfig
  ) {
    config.interval = 500000;
    config.keyboard = false;
    config.showNavigationArrows = false;
    config.showNavigationIndicators = false;
    config.pauseOnHover = false;
  }

  ngOnInit(): void {
    this.site$ = this.route.data.pipe(
      map((data) => data.site as Site),
    );
  }

}
