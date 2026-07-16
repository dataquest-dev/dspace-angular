import {
  Component,
  OnInit,
} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  imports: [
    TranslateModule,
  ],
  selector: 'ds-share-submission-page',
  templateUrl: './share-submission-page.component.html',
  styleUrls: ['./share-submission-page.component.scss'],
})
export class ShareSubmissionPageComponent implements OnInit {

  /**
   * Share token from the url. This token is used to retrieve the WorkspaceItem.
   * With this link, the submitter can be changed.
   */
  changeSubmitterLink: string;

  constructor(private route: ActivatedRoute) {}

  ngOnInit(): void {
    // Load `share-token` param value from the url
    this.changeSubmitterLink = this.route.snapshot.queryParams.changeSubmitterLink;
  }
}
