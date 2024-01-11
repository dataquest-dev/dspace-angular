import { Component } from '@angular/core';
import { Community } from '../../core/shared/community.model';
import { CommunityDataService } from '../../core/data/community-data.service';
import { ActivatedRoute, Router } from '@angular/router';
import { DeleteComColPageComponent } from '../../shared/comcol/comcol-forms/delete-comcol-page/delete-comcol-page.component';
import { NotificationsService } from '../../shared/notifications/notifications.service';
import { TranslateService } from '@ngx-translate/core';
<<<<<<< HEAD
=======
import { DSONameService } from '../../core/breadcrumbs/dso-name.service';
>>>>>>> dspace-7.6.1

/**
 * Component that represents the page where a user can delete an existing Community
 */
@Component({
  selector: 'ds-delete-community',
  styleUrls: ['./delete-community-page.component.scss'],
  templateUrl: './delete-community-page.component.html'
})
export class DeleteCommunityPageComponent extends DeleteComColPageComponent<Community> {
  protected frontendURL = '/communities/';

  public constructor(
    protected dsoDataService: CommunityDataService,
    public dsoNameService: DSONameService,
    protected router: Router,
    protected route: ActivatedRoute,
    protected notifications: NotificationsService,
    protected translate: TranslateService,
  ) {
<<<<<<< HEAD
    super(dsoDataService, router, route, notifications, translate);
=======
    super(dsoDataService, dsoNameService, router, route, notifications, translate);
>>>>>>> dspace-7.6.1
  }

}
