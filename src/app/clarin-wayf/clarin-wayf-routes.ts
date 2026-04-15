import { Route } from '@angular/router';

import { ClarinWayfComponent } from './clarin-wayf.component';

export const ROUTES: Route[] = [
  {
    path: '',
    pathMatch: 'full',
    component: ClarinWayfComponent,
    data: { title: 'Select Your Institution' },
  },
];
