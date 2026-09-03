import { Component } from '@angular/core';
import { CommunityPageSubCollectionListComponent as BaseComponent }
  from '../../../../../app/community-page/sub-collection-list/community-page-sub-collection-list.component';
import { RemoteData } from '../../../../../app/core/data/remote-data';
import { PaginatedList } from '../../../../../app/core/data/paginated-list.model';
import { Collection } from '../../../../../app/core/shared/collection.model';
import { reorderZcuPublicationCollections } from '../../../../../app/shared/zcu-collection-order';

@Component({
  selector: 'ds-community-page-sub-collection-list',
  // styleUrls: ['./community-page-sub-collection-list.component.scss'],
  styleUrls: ['../../../../../app/community-page/sub-collection-list/community-page-sub-collection-list.component.scss'],
  // templateUrl: './community-page-sub-collection-list.component.html',
  templateUrl: '../../../../../app/community-page/sub-collection-list/community-page-sub-collection-list.component.html'
})
export class CommunityPageSubCollectionListComponent extends BaseComponent {

  /**
   * Reorders the current page of collections so that "Kapitoly v knihách" is shown 2nd and
   * "Články" 3rd, while all other collections keep their existing alphabetical order.
   *
   * @param rd the RemoteData holding the current page of collections
   * @returns the RemoteData with a reordered page, or unchanged when the page is empty
   */
  protected applyCustomCollectionOrder(rd: RemoteData<PaginatedList<Collection>>): RemoteData<PaginatedList<Collection>> {
    const page = rd?.payload?.page;
    if (Array.isArray(page) && page.length > 0) {
      rd.payload.page = this.reorderCollections(page);
    }
    return rd;
  }

  /**
   * Reorders the current page of collections using the shared ZCU ordering rule (issue #953),
   * pinning "Kapitoly v knihách" to the 2nd position and "Články" to the 3rd.
   *
   * @param collections the collections of the current page (alphabetical by dc.title)
   * @returns a new, reordered array, or the original array when the rule does not apply
   */
  protected reorderCollections(collections: Collection[]): Collection[] {
    return reorderZcuPublicationCollections(collections);
  }

}
