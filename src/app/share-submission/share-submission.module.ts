import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ShareSubmissionPageComponent } from './share-submission-page/share-submission-page.component';
import { SharedModule } from '../shared/shared.module';
import { ShareSubmissionPageModule } from './share-submission-page/share-submission-routing.module';



@NgModule({
  declarations: [
    ShareSubmissionPageComponent
  ],
  imports: [
    CommonModule,
    ShareSubmissionPageModule,
    SharedModule,
  ]
})
export class ShareSubmissionModule { }
