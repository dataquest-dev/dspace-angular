import { NgModule } from '@angular/core';
import { BrowseByComponent } from './browse-by.component';
<<<<<<< HEAD
=======
import { ThemedBrowseByComponent } from './themed-browse-by.component';
>>>>>>> dspace-7.6.1
import { CommonModule } from '@angular/common';
import { SharedModule } from '../shared.module';
import { ResultsBackButtonModule } from '../results-back-button/results-back-button.module';
import { BrowseByRoutingModule } from '../../browse-by/browse-by-routing.module';
import { AccessControlRoutingModule } from '../../access-control/access-control-routing.module';

<<<<<<< HEAD
@NgModule({
  declarations: [
    BrowseByComponent,
],
=======
const DECLARATIONS = [
  BrowseByComponent,
  ThemedBrowseByComponent,
];

@NgModule({
  declarations: [
    ...DECLARATIONS,
  ],
>>>>>>> dspace-7.6.1
  imports: [
    ResultsBackButtonModule,
    BrowseByRoutingModule,
    AccessControlRoutingModule,
    CommonModule,
    SharedModule,
  ],
  exports: [
<<<<<<< HEAD
    BrowseByComponent,
    SharedModule,
=======
    ...DECLARATIONS,
>>>>>>> dspace-7.6.1
  ]
})
export class SharedBrowseByModule { }
