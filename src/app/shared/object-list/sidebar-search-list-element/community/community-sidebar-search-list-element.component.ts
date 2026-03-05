import { Component } from '@angular/core';
import { listableObjectComponent } from '../../../object-collection/shared/listable-object/listable-object.decorator';
import { Context } from '../../../../core/shared/context.model';
import { ViewMode } from '../../../../core/shared/view-mode.model';
import { SidebarSearchListElementComponent } from '../sidebar-search-list-element.component';
import { CommunitySearchResult } from '../../../object-collection/shared/community-search-result.model';
import { Community } from '../../../../core/shared/community.model';
import { TruncatableService } from '../../../truncatable/truncatable.service';
import { LinkService } from '../../../../core/cache/builders/link.service';
import { DSONameService } from '../../../../core/breadcrumbs/dso-name.service';
import { DSOBreadcrumbsService } from '../../../../core/breadcrumbs/dso-breadcrumbs.service';

@listableObjectComponent(CommunitySearchResult, ViewMode.ListElement, Context.SideBarSearchModal)
@listableObjectComponent(CommunitySearchResult, ViewMode.ListElement, Context.SideBarSearchModalCurrent)
@Component({
  selector: 'ds-community-sidebar-search-list-element',
  templateUrl: '../sidebar-search-list-element.component.html'
})
/**
 * Component displaying a list element for a {@link CommunitySearchResult} within the context of a sidebar search modal
 */
export class CommunitySidebarSearchListElementComponent extends SidebarSearchListElementComponent<CommunitySearchResult, Community> {

  constructor(
    protected truncatableService: TruncatableService,
    protected linkService: LinkService,
    public dsoNameService: DSONameService,
    protected dsoBreadcrumbsService: DSOBreadcrumbsService,
  ) {
    super(truncatableService, linkService, dsoNameService, dsoBreadcrumbsService);
  }

  /**
   * Get the description of the Community by returning its abstract
   */
  getDescription(): string {
    return this.firstMetadataValue('dc.description.abstract');
  }
}
