import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import {StaticPageComponent} from './static-page.component';
import {STATIC_PAGE_PATH} from './static-page-routing-paths';

const routes: Routes = [
  {
    path: STATIC_PAGE_PATH,
    children: [
      { path: '', component: StaticPageComponent },
      { path: ':htmlFileName', component: StaticPageComponent },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class StaticPageRoutingModule { }
