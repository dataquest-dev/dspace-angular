import {
  Inject,
  Injectable,
} from '@angular/core';
import { ActivatedRoute } from '@angular/router';

import {
  APP_CONFIG,
  AppConfig,
} from '../../../../../config/app-config.interface';
import { LinkService } from '../../../../core/cache/builders/link.service';
import { RemoteDataBuildService } from '../../../../core/cache/builders/remote-data-build.service';
import { RequestService } from '../../../../core/data/request.service';
import { PaginationService } from '../../../../core/pagination/pagination.service';
import { RouteService } from '../../../../core/services/route.service';
import { HALEndpointService } from '../../../../core/shared/hal-endpoint.service';
import { SearchConfigurationService } from '../../../../core/shared/search/search-configuration.service';
import { PaginationComponentOptions } from '../../../pagination/pagination-component-options.model';

/**
 * CLARIN/LINDAT (production parity): the comcol landing lists 20 items per page like the
 * v7 Recent Submissions view (the default search page size is 10). The parent constructor
 * captures defaultPagination before subclass field initializers run, so the override has
 * to happen in the constructor, followed by re-initializing the defaults.
 */
@Injectable()
export class ComcolSearchSectionConfigurationService extends SearchConfigurationService {

  constructor(
    protected routeService: RouteService,
    protected paginationService: PaginationService,
    protected route: ActivatedRoute,
    protected linkService: LinkService,
    protected halService: HALEndpointService,
    protected requestService: RequestService,
    protected rdb: RemoteDataBuildService,
    @Inject(APP_CONFIG) protected appConfig: AppConfig,
  ) {
    super(routeService, paginationService, route, linkService, halService, requestService, rdb, appConfig);
    this.defaultPagination = Object.assign(new PaginationComponentOptions(), {
      id: this.paginationID,
      pageSize: 20,
      currentPage: 1,
    });
    this._defaults = null;
    this.initDefaults();
  }
}
