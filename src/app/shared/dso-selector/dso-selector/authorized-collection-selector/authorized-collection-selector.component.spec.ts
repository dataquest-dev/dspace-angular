import { AuthorizedCollectionSelectorComponent } from './authorized-collection-selector.component';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { VarDirective } from '../../../utils/var.directive';
import { TranslateModule } from '@ngx-translate/core';
import { RouterTestingModule } from '@angular/router/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { SearchService } from '../../../../core/shared/search/search.service';
import { CollectionDataService } from '../../../../core/data/collection-data.service';
import { createSuccessfulRemoteDataObject$ } from '../../../remote-data.utils';
import { createPaginatedList } from '../../../testing/utils.test';
import { Collection } from '../../../../core/shared/collection.model';
import { DSpaceObjectType } from '../../../../core/shared/dspace-object-type.model';
import { NotificationsService } from '../../../notifications/notifications.service';
import { DSONameService } from '../../../../core/breadcrumbs/dso-name.service';

describe('AuthorizedCollectionSelectorComponent', () => {
  let component: AuthorizedCollectionSelectorComponent;
  let fixture: ComponentFixture<AuthorizedCollectionSelectorComponent>;

  let collectionService;
  let dsoNameService: jasmine.SpyObj<DSONameService>;
  let notificationsService: NotificationsService;

  function createCollection(id: string, name: string): Collection {
    return Object.assign(new Collection(), { id, name });
  }

  const collectionTest       = createCollection('col-test',      'test');
  const collectionTestSuite  = createCollection('col-suite',     'test suite');
  const collectionCollection = createCollection('col-collection', 'collection');

  beforeEach(waitForAsync(() => {
    dsoNameService = jasmine.createSpyObj('dsoNameService', ['getName']);
    dsoNameService.getName.and.callFake((dso: any) => dso?.name ?? '');

    notificationsService = jasmine.createSpyObj('notificationsService', ['error']);

    // Use callFake so createSuccessfulRemoteDataObject$ is called lazily at spy invocation time
    // (not at setup time), avoiding issues with environment not being available during beforeEach.
    collectionService = jasmine.createSpyObj('collectionService', ['getAuthorizedCollection', 'getAuthorizedCollectionByEntityType']);
    collectionService.getAuthorizedCollection.and.callFake(() =>
      createSuccessfulRemoteDataObject$(createPaginatedList([collectionTest]))
    );
    collectionService.getAuthorizedCollectionByEntityType.and.callFake(() =>
      createSuccessfulRemoteDataObject$(createPaginatedList([collectionTest]))
    );

    TestBed.configureTestingModule({
      declarations: [AuthorizedCollectionSelectorComponent, VarDirective],
      imports: [TranslateModule.forRoot(), RouterTestingModule.withRoutes([])],
      providers: [
        { provide: SearchService, useValue: {} },
        { provide: CollectionDataService, useValue: collectionService },
        { provide: NotificationsService, useValue: notificationsService },
        { provide: DSONameService, useValue: dsoNameService },
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AuthorizedCollectionSelectorComponent);
    component = fixture.componentInstance;
    component.types = [DSpaceObjectType.COLLECTION];
    fixture.detectChanges();
  });

  describe('search', () => {
    describe('when has no entity type', () => {
      it('should call getAuthorizedCollection and return the collection wrapped in a SearchResult', (done) => {
        component.search('', 1).subscribe((resultRD) => {
          expect(collectionService.getAuthorizedCollection).toHaveBeenCalled();
          expect(resultRD.payload.page.length).toEqual(1);
          expect(resultRD.payload.page[0].indexableObject).toEqual(collectionTest);
          done();
        });
      });
    });

    describe('when has entity type', () => {
      it('should call getAuthorizedCollectionByEntityType and return the collection wrapped in a SearchResult', (done) => {
        component.entityType = 'Publication';
        fixture.detectChanges();
        component.search('', 1).subscribe((resultRD) => {
          expect(collectionService.getAuthorizedCollectionByEntityType).toHaveBeenCalled();
          expect(resultRD.payload.page.length).toEqual(1);
          expect(resultRD.payload.page[0].indexableObject).toEqual(collectionTest);
          done();
        });
      });
    });

    describe('title prefix filtering', () => {
      beforeEach(() => {
        // Override to return all three collections so we can test client-side filtering
        collectionService.getAuthorizedCollection.and.callFake(() =>
          createSuccessfulRemoteDataObject$(
            createPaginatedList([collectionTest, collectionTestSuite, collectionCollection])
          )
        );
      });

      it('should return all collections when query is empty', (done) => {
        component.search('', 1).subscribe((resultRD) => {
          expect(resultRD.payload.page.length).toEqual(3);
          done();
        });
      });

      it('should return only collections whose title starts with the query', (done) => {
        component.search('test', 1).subscribe((resultRD) => {
          const names = resultRD.payload.page.map((r: any) => r.indexableObject.name);
          expect(names).toEqual(['test', 'test suite']);
          expect(names).not.toContain('collection');
          done();
        });
      });

      it('should be case-insensitive', (done) => {
        component.search('TEST', 1).subscribe((resultRD) => {
          const names = resultRD.payload.page.map((r: any) => r.indexableObject.name);
          expect(names).toContain('test');
          expect(names).toContain('test suite');
          done();
        });
      });
    });
  });
});
