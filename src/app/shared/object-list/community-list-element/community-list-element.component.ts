import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs';

import { Community } from '../../../core/shared/community.model';
import { AbstractListableElementComponent } from '../../object-collection/shared/object-collection-element/abstract-listable-element.component';
import { ViewMode } from '../../../core/shared/view-mode.model';
import { listableObjectComponent } from '../../object-collection/shared/listable-object/listable-object.decorator';
import { DSONameService } from '../../../core/breadcrumbs/dso-name.service';
import { CommunityPathService } from '../../../core/services/community-path.service';

@Component({
  selector: 'ds-community-list-element',
  styleUrls: ['./community-list-element.component.scss'],
  templateUrl: './community-list-element.component.html'
})
/**
 * Component representing a list element for a community
 */
@listableObjectComponent(Community, ViewMode.ListElement)
export class CommunityListElementComponent extends AbstractListableElementComponent<Community> implements OnInit {

  /**
   * Observable for the full path of the community (including all parent communities)
   */
  fullPath$: Observable<string>;

  /**
   * Observable to check if the community has parent communities
   */
  hasParents$: Observable<boolean>;

  constructor(
    public dsoNameService: DSONameService,
    private communityPathService: CommunityPathService,
  ) {
    super(dsoNameService);
  }

  ngOnInit(): void {
    this.fullPath$ = this.communityPathService.getFullPath(this.object);
    this.hasParents$ = this.communityPathService.hasParents(this.object);
  }

}
