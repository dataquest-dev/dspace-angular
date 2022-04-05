import {createSuccessfulRemoteDataObject$} from '../shared/remote-data.utils';
import {first} from 'rxjs/operators';
import {ItemPageResolver} from './item-page.resolver';
import {ItemDataService} from '../core/data/item-data.service';
import {Item} from '../core/shared/item.model';

describe('ItemPageResolver', () => {
  let store: any;
  let router: any;
  const uuid = '1234-65487-12354-1235';
  const approximateDateValue = 'unknown';
  const dateIssuedValue = '2022-4-5';

  beforeEach(() => {
    store = jasmine.createSpyObj('store', {
      dispatch: {},
    });
    router = jasmine.createSpyObj('router', {
      navigateByUrl: {},
    });
  });
  describe('Item with local.approximateDate.issued', () => {
    let resolver: ItemPageResolver;
    let mockItemDataService: ItemDataService;
    const mockItem = Object.assign(new Item(), {
      metadata: { 'dc.date.issued': [{ value: dateIssuedValue }], 'local.approximateDate.issued': [{ value: approximateDateValue }]},
      id: uuid,
    });
    beforeEach(() => {
      mockItemDataService = jasmine.createSpyObj('mockItemDataService', {
        findById: createSuccessfulRemoteDataObject$(mockItem)
      });
      resolver = new ItemPageResolver(mockItemDataService ,store, router);
    });

    it('should replace dc.date.issued value by local.approximateDate.issued value', (done) => {
      resolver.resolve({ params: { id: uuid } } as any, { url: '/items/' + uuid } as any)
        .pipe(first())
        .subscribe(
          (resolved) => {
            expect(resolved.payload.metadata['dc.date.issued'][0].value).toEqual(approximateDateValue);
            done();
          }
        );
    });
  });

  describe('Item without local.approximateDate.issued', () => {
    let resolver: ItemPageResolver;
    let mockItemDataService: ItemDataService;
    const mockItem = Object.assign(new Item(), {
      metadata: { 'dc.date.issued': [{ value: dateIssuedValue }]},
      id: uuid,
    });
    beforeEach(() => {
      mockItemDataService = jasmine.createSpyObj('mockItemDataService', {
        findById: createSuccessfulRemoteDataObject$(mockItem)
      });
      resolver = new ItemPageResolver(mockItemDataService ,store, router);
    });

    it('should return dc.date.issued value', (done) => {
      resolver.resolve({ params: { id: uuid } } as any, { url: '/items/' + uuid } as any)
        .pipe(first())
        .subscribe(
          (resolved) => {
            expect(resolved.payload.metadata['dc.date.issued'][0].value).toEqual(dateIssuedValue);
            done();
          }
        );
    });
  });
});
