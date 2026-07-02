import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LicenseContractPageComponent } from './license-contract-page.component';
import { BrowserModule } from '@angular/platform-browser';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { ActivatedRoute, Params } from '@angular/router';
import { Directive, Input, NO_ERRORS_SCHEMA } from '@angular/core';
import { createFailedRemoteDataObject$, createSuccessfulRemoteDataObject$ } from '../shared/remote-data.utils';
import { CollectionDataService } from '../core/data/collection-data.service';
import { Collection } from '../core/shared/collection.model';
import { License } from '../core/shared/license.model';
import { PaginationService } from '../core/pagination/pagination.service';
import { buildPaginatedList } from '../core/data/paginated-list.model';
import { PageInfo } from '../core/shared/page-info.model';
import { of as observableOf } from 'rxjs';
import { FindListOptions } from '../core/data/find-list-options.model';
import { PaginationComponentOptions } from '../shared/pagination/pagination-component-options.model';
import { SortDirection, SortOptions } from '../core/cache/models/sort-options.model';

/* eslint-disable @angular-eslint/directive-selector */
@Directive({
  selector: '[ngVar]'
})
class MockNgVarDirective {
  @Input() ngVar: unknown;
}

describe('LicenseContractPageComponent', () => {
  let component: LicenseContractPageComponent;
  let fixture: ComponentFixture<LicenseContractPageComponent>;

  let routeStub: any;
  let collectionService: jasmine.SpyObj<CollectionDataService>;
  let paginationService: jasmine.SpyObj<PaginationService>;

  const paramCollectionId = 'collectionId';
  const paramCollectionIdValue = '1';

  const paramObject: Params = {};
  paramObject[paramCollectionId] = paramCollectionIdValue;

  const singleCollectionLicense = Object.assign(new License(), {
    text: 'Single collection license text'
  });

  const collection = Object.assign(new Collection(), {
    uuid: 'fake-collection-id',
    name: 'Single collection',
    _links: {
      self: {href: 'collection-selflink'},
      license: {href: 'license-link'}
    },
    license: createSuccessfulRemoteDataObject$(singleCollectionLicense)
  });

  const secondCollectionLicense = Object.assign(new License(), {
    text: 'Second collection license text'
  });

  const authorizedCollections = [
    collection,
    Object.assign(new Collection(), {
      uuid: 'second-collection-id',
      name: 'Second collection',
      _links: {
        self: { href: 'second-collection-selflink' },
        license: { href: 'second-license-link' }
      },
      license: createSuccessfulRemoteDataObject$(secondCollectionLicense)
    })
  ];

  const authorizedCollectionsRD$ = createSuccessfulRemoteDataObject$(
    buildPaginatedList(
      new PageInfo({
        currentPage: 1,
        elementsPerPage: 10,
        totalElements: authorizedCollections.length,
        totalPages: 1
      }),
      authorizedCollections
    )
  );

  routeStub = {
    snapshot: {
      queryParams: { ...paramObject },
    }
  };

  collectionService = jasmine.createSpyObj<CollectionDataService>('collectionService', {
    findById: createSuccessfulRemoteDataObject$(collection),
    getAuthorizedCollection: authorizedCollectionsRD$
  });

  paginationService = jasmine.createSpyObj<PaginationService>('paginationService', {
    getFindListOptions: observableOf(Object.assign(new FindListOptions(), {
      currentPage: 1,
      elementsPerPage: 10
    })),
    getCurrentPagination: observableOf(Object.assign(new PaginationComponentOptions(), {
      currentPage: 1,
      pageSize: 10,
      pageSizeOptions: [1, 5, 10, 20, 40, 60, 80, 100],
    })),
    getCurrentSort: observableOf(new SortOptions('name', SortDirection.ASC)),
    clearPagination: undefined
  });

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        BrowserModule,
        CommonModule,
        FormsModule,
        ReactiveFormsModule,
        TranslateModule.forRoot(),
      ],
      declarations: [
        LicenseContractPageComponent,
        MockNgVarDirective
      ],
      providers: [
        { provide: ActivatedRoute, useValue: routeStub },
        { provide: CollectionDataService, useValue: collectionService },
        { provide: PaginationService, useValue: paginationService },
      ],
      schemas: [NO_ERRORS_SCHEMA]
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
