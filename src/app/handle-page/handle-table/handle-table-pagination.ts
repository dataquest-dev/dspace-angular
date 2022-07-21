import {PaginationComponentOptions} from '../../shared/pagination/pagination-component-options.model';

export const paginationID = 'hdl';

export const defaultPagination = Object.assign(new PaginationComponentOptions(), {
    id: paginationID,
    currentPage: 1,
    pageSize: 10
  });
