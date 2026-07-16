import { Observable } from 'rxjs';

import {
  buildPaginatedList,
  PaginatedList,
} from '../../core/data/paginated-list.model';
import { RemoteData } from '../../core/data/remote-data';
import { ExternalSource } from '../../core/shared/external-source.model';
import { ExternalSourceEntry } from '../../core/shared/external-source-entry.model';
import { PageInfo } from '../../core/shared/page-info.model';
import { createSuccessfulRemoteDataObject$ } from '../remote-data.utils';
import { PaginatedSearchOptions } from '../search/models/paginated-search-options.model';

/**
 * The LookupRelationServiceMock for the test purposes.
 */
export class MockLookupRelationService {
  private _payload = [];

  getExternalResults(externalSource: ExternalSource, searchOptions: PaginatedSearchOptions): Observable<RemoteData<PaginatedList<ExternalSourceEntry>>> {
    return createSuccessfulRemoteDataObject$(buildPaginatedList(new PageInfo(), this._payload));
  }
}
