import { Route } from '@angular/router';

import { ClarinWayfComponent } from './clarin-wayf.component';

export const CLARIN_WAYF_ROUTES: Route[] = [
  {
    path: '',
    pathMatch: 'full',
    component: ClarinWayfComponent,
    data: { title: 'Select Your Institution' },
  },
];

export const ROUTES = CLARIN_WAYF_ROUTES;
