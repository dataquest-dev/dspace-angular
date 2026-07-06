import { Injectable } from '@angular/core';

import { SearchConfigurationService } from '../../../../core/shared/search/search-configuration.service';
import { PaginationComponentOptions } from '../../../pagination/pagination-component-options.model';

/**
 * CLARIN/LINDAT (production parity): the comcol landing lists 20 items per page like the
 * v7 Recent Submissions view (the default search page size is 10).
 */
@Injectable()
export class ComcolSearchSectionConfigurationService extends SearchConfigurationService {
  protected defaultPagination = Object.assign(new PaginationComponentOptions(), {
    id: 'spc',
    pageSize: 20,
    currentPage: 1,
  });
}
