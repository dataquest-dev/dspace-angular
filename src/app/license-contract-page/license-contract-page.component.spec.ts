import { NO_ERRORS_SCHEMA } from '@angular/core';
import {
  ComponentFixture,
  TestBed,
} from '@angular/core/testing';
import {
  ActivatedRoute,
  Params,
} from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { of } from 'rxjs';

import {
  SortDirection,
  SortOptions,
} from '../core/cache/models/sort-options.model';
import { CollectionDataService } from '../core/data/collection-data.service';
import { FindListOptions } from '../core/data/find-list-options.model';
import { buildPaginatedList } from '../core/data/paginated-list.model';
import { PaginationService } from '../core/pagination/pagination.service';
import { Collection } from '../core/shared/collection.model';
import { License } from '../core/shared/license.model';
import { PageInfo } from '../core/shared/page-info.model';
import { ErrorComponent } from '../shared/error/error.component';
import { ThemedLoadingComponent } from '../shared/loading/themed-loading.component';
import { PaginationComponent } from '../shared/pagination/pagination.component';
import { PaginationComponentOptions } from '../shared/pagination/pagination-component-options.model';
import {
  createFailedRemoteDataObject$,
  createSuccessfulRemoteDataObject$,
} from '../shared/remote-data.utils';
import { LicenseContractPageComponent } from './license-contract-page.component';

describe('LicenseContractPageComponent', () => {
  let component: LicenseContractPageComponent;
  let fixture: ComponentFixture<LicenseContractPageComponent>;

  const paramCollectionId = 'collectionId';
  const paramCollectionIdValue = '1';

  const paramObject: Params = {};
  paramObject[paramCollectionId] = paramCollectionIdValue;

  const singleCollectionLicense = Object.assign(new License(), {
    text: 'Single collection license text',
  });

  const collection = Object.assign(new Collection(), {
    uuid: 'fake-collection-id',
    name: 'Single collection',
    _links: {
      self: { href: 'collection-selflink' },
      license: { href: 'license-link' },
    },
    license: createSuccessfulRemoteDataObject$(singleCollectionLicense),
  });

  const secondCollectionLicense = Object.assign(new License(), {
    text: 'Second collection license text',
  });

  const authorizedCollections = [
    collection,
    Object.assign(new Collection(), {
      uuid: 'second-collection-id',
      name: 'Second collection',
      _links: {
        self: { href: 'second-collection-selflink' },
        license: { href: 'second-license-link' },
      },
      license: createSuccessfulRemoteDataObject$(secondCollectionLicense),
    }),
  ];

  const authorizedCollectionsRD$ = createSuccessfulRemoteDataObject$(
    buildPaginatedList(
      new PageInfo({
        currentPage: 1,
        elementsPerPage: 10,
        totalElements: authorizedCollections.length,
        totalPages: 1,
      }),
      authorizedCollections,
    ),
  );

  const routeStub: any = {
    snapshot: {
      queryParams: { ...paramObject },
    },
  };

  const collectionService = jasmine.createSpyObj<CollectionDataService>('collectionService', {
    findById: createSuccessfulRemoteDataObject$(collection),
    getAuthorizedCollection: authorizedCollectionsRD$,
  });

  const paginationService = jasmine.createSpyObj<PaginationService>('paginationService', {
    getFindListOptions: of(Object.assign(new FindListOptions(), {
      currentPage: 1,
      elementsPerPage: 10,
    })),
    getCurrentPagination: of(Object.assign(new PaginationComponentOptions(), {
      currentPage: 1,
      pageSize: 10,
      pageSizeOptions: [1, 5, 10, 20, 40, 60, 80, 100],
    })),
    getCurrentSort: of(new SortOptions('name', SortDirection.ASC)),
    clearPagination: undefined,
  });

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        TranslateModule.forRoot(),
        LicenseContractPageComponent,
      ],
      providers: [
        { provide: ActivatedRoute, useValue: routeStub },
        { provide: CollectionDataService, useValue: collectionService },
        { provide: PaginationService, useValue: paginationService },
      ],
    })
      .overrideComponent(LicenseContractPageComponent, {
        remove: {
          imports: [ErrorComponent, PaginationComponent, ThemedLoadingComponent],
        },
        add: {
          schemas: [NO_ERRORS_SCHEMA],
        },
      })
      .compileComponents();
  });

  beforeEach(() => {
    routeStub.snapshot.queryParams = { ...paramObject };
    collectionService.findById.and.returnValue(createSuccessfulRemoteDataObject$(collection));
    collectionService.findById.calls.reset();
    collectionService.getAuthorizedCollection.calls.reset();
    paginationService.getFindListOptions.calls.reset();
    paginationService.clearPagination.calls.reset();
    fixture = TestBed.createComponent(LicenseContractPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load collectionRD$', () => {
    expect(component.collectionRD$.value.payload).toEqual(collection);
  });

  it('should load licenseRD$', () => {
    expect(component.licenseRD$.value.payload).toEqual(singleCollectionLicense);
  });

  it('should set hasFailed on collectionRD$ when collectionId is bogus', () => {
    collectionService.findById.and.returnValue(createFailedRemoteDataObject$('Not Found', 404));
    collectionService.findById.calls.reset();

    const failFixture = TestBed.createComponent(LicenseContractPageComponent);
    const failComponent = failFixture.componentInstance;
    failFixture.detectChanges();

    expect(collectionService.findById).toHaveBeenCalled();
    expect(failComponent.collectionRD$.value.hasFailed).toBeTrue();
  });

  it('should load authorized collections when collectionId is missing', () => {
    routeStub.snapshot.queryParams = {};
    collectionService.findById.calls.reset();
    collectionService.getAuthorizedCollection.calls.reset();

    const listFixture = TestBed.createComponent(LicenseContractPageComponent);
    const listComponent = listFixture.componentInstance;
    listFixture.detectChanges();

    expect(collectionService.findById).not.toHaveBeenCalled();
    expect(collectionService.getAuthorizedCollection).toHaveBeenCalled();
    // v9 signature: the searchHref argument ('findSubmitAuthorized') is mandatory
    expect(collectionService.getAuthorizedCollection).toHaveBeenCalledWith(
      '', jasmine.any(FindListOptions), true, true, 'findSubmitAuthorized', jasmine.anything(),
    );

    listComponent.collectionsRD$.subscribe((collectionsRD) => {
      expect(collectionsRD.payload.page).toEqual(authorizedCollections);
    });
  });

  it('should clear pagination state on destroy in list mode', () => {
    routeStub.snapshot.queryParams = {};
    paginationService.clearPagination.calls.reset();

    const listFixture = TestBed.createComponent(LicenseContractPageComponent);
    const listComponent = listFixture.componentInstance;
    listFixture.detectChanges();
    listComponent.ngOnDestroy();

    expect(paginationService.clearPagination).toHaveBeenCalledWith(listComponent.paginationId);
  });

});
