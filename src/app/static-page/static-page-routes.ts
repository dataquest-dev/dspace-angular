import { Route } from '@angular/router';

import { StaticPageComponent } from './static-page.component';

export const ROUTES: Route[] = [
  {
    path: ':id',
    component: StaticPageComponent,
  },
];
