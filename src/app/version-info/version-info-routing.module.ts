import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { VersionInfoComponent } from './version-info.component';

const routes: Routes = [
    {
      path: '',
      component: VersionInfoComponent,
    }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class VersionInfoRoutingModule { }
