import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { TranslateLoader, TranslateModule, TranslateService } from '@ngx-translate/core';
import { TranslateLoaderMock } from '../../shared/mocks/translate-loader.mock';
import { ItemDataService } from '../../core/data/item-data.service';
import { ChangeDetectionStrategy, NO_ERRORS_SCHEMA, PLATFORM_ID } from '@angular/core';
import { ItemPageComponent } from './item-page.component';
import { ActivatedRoute, Router } from '@angular/router';
import { ActivatedRouteStub } from '../../shared/testing/active-router.stub';
import { MetadataService } from '../../core/metadata/metadata.service';
import { VarDirective } from '../../shared/utils/var.directive';
import { Item } from '../../core/shared/item.model';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { By } from '@angular/platform-browser';
import { createRelationshipsObservable } from './item-types/shared/item.component.spec';
import { of as observableOf } from 'rxjs';
import {
  createFailedRemoteDataObject$,
  createPendingRemoteDataObject$,
  createSuccessfulRemoteDataObject,
  createSuccessfulRemoteDataObject$
} from '../../shared/remote-data.utils';
import { AuthService } from '../../core/auth/auth.service';
import { createPaginatedList } from '../../shared/testing/utils.test';
import { AuthorizationDataService } from '../../core/data/feature-authorization/authorization-data.service';
<<<<<<< HEAD
import { RegistryService } from 'src/app/core/registry/registry.service';
import { Store } from '@ngrx/store';
import { NotificationsService } from 'src/app/shared/notifications/notifications.service';
import { MetadataSchemaDataService } from 'src/app/core/data/metadata-schema-data.service';
import { MetadataFieldDataService } from 'src/app/core/data/metadata-field-data.service';
import { MetadataBitstreamDataService } from 'src/app/core/data/metadata-bitstream-data.service';
import { getMockTranslateService } from 'src/app/shared/mocks/translate.service.mock';
import { ConfigurationProperty } from '../../core/shared/configuration-property.model';
import { HALEndpointService } from '../../core/shared/hal-endpoint.service';
import { MetadataValue } from '../../core/shared/metadata.models';
=======
import { ServerResponseService } from '../../core/services/server-response.service';
import { SignpostingDataService } from '../../core/data/signposting-data.service';
import { LinkDefinition, LinkHeadService } from '../../core/services/link-head.service';
import { SignpostingLink } from '../../core/data/signposting-links.model';
>>>>>>> dspace-7.6.1

const mockItem: Item = Object.assign(new Item(), {
  bundles: createSuccessfulRemoteDataObject$(createPaginatedList([])),
  metadata: {
    'local.has.files': [Object.assign(new MetadataValue(), {
      value: 'yes',
      language: undefined
    })]
  },
  relationships: createRelationshipsObservable()
});

const mockWithdrawnItem: Item = Object.assign(new Item(), {
  bundles: createSuccessfulRemoteDataObject$(createPaginatedList([])),
  metadata: [],
  relationships: createRelationshipsObservable(),
  isWithdrawn: true
});

<<<<<<< HEAD
=======
const mocklink = {
  href: 'http://test.org',
  rel: 'rel1',
  type: 'type1'
};

const mocklink2 = {
  href: 'http://test2.org',
  rel: 'rel2',
  type: undefined
};

const mockSignpostingLinks: SignpostingLink[] = [mocklink, mocklink2];

>>>>>>> dspace-7.6.1
describe('ItemPageComponent', () => {
  let comp: ItemPageComponent;
  let fixture: ComponentFixture<ItemPageComponent>;
  let authService: AuthService;
<<<<<<< HEAD
  let translateService: TranslateService;
  let registryService: RegistryService;
  let halService: HALEndpointService;
  const authorizationService = jasmine.createSpyObj('authorizationService', [
    'isAuthorized',
  ]);
  let authorizationDataService: AuthorizationDataService;
=======
  let authorizationDataService: AuthorizationDataService;
  let serverResponseService: jasmine.SpyObj<ServerResponseService>;
  let signpostingDataService: jasmine.SpyObj<SignpostingDataService>;
  let linkHeadService: jasmine.SpyObj<LinkHeadService>;
>>>>>>> dspace-7.6.1

  const mockMetadataService = {
    /* eslint-disable no-empty,@typescript-eslint/no-empty-function */
    processRemoteData: () => {
    }
    /* eslint-enable no-empty, @typescript-eslint/no-empty-function */
  };
  const mockRoute = Object.assign(new ActivatedRouteStub(), {
    data: observableOf({ dso: createSuccessfulRemoteDataObject(mockItem) })
  });

  const mockMetadataBitstreamDataService = {
    searchByHandleParams: () => observableOf({}) // Returns a mock Observable
  };

  beforeEach(waitForAsync(() => {
    authService = jasmine.createSpyObj('authService', {
      isAuthenticated: observableOf(true),
      setRedirectUrl: {}
    });
    authorizationDataService = jasmine.createSpyObj('authorizationDataService', {
      isAuthorized: observableOf(false),
    });
    serverResponseService = jasmine.createSpyObj('ServerResponseService', {
      setHeader: jasmine.createSpy('setHeader'),
    });

    signpostingDataService = jasmine.createSpyObj('SignpostingDataService', {
      getLinks: observableOf([mocklink, mocklink2]),
    });

    linkHeadService = jasmine.createSpyObj('LinkHeadService', {
      addTag: jasmine.createSpy('setHeader'),
      removeTag: jasmine.createSpy('removeTag'),
    });

    translateService = getMockTranslateService();
    authorizationDataService = jasmine.createSpyObj('authorizationDataService', {
      isAuthorized: observableOf(false),
    });

    const configurationDataService = jasmine.createSpyObj('configurationDataService', {
      findByPropertyName: createSuccessfulRemoteDataObject$(Object.assign(new ConfigurationProperty(), {
        name: 'test',
        values: [
          'org.dspace.ctask.general.ProfileFormats = test'
        ]
      }))
    });

    halService = jasmine.createSpyObj('authService', {
      getRootHref: 'root url',
    });

    TestBed.configureTestingModule({
      imports: [TranslateModule.forRoot({
        loader: {
          provide: TranslateLoader,
          useClass: TranslateLoaderMock
        }
      }), BrowserAnimationsModule],
      declarations: [ItemPageComponent, VarDirective],
      providers: [
        { provide: ActivatedRoute, useValue: mockRoute },
        { provide: ItemDataService, useValue: {} },
        { provide: MetadataService, useValue: mockMetadataService },
        { provide: Router, useValue: {} },
        { provide: AuthService, useValue: authService },
<<<<<<< HEAD
        { provide: AuthorizationDataService, useValue: authorizationService },
        { provide: Store, useValue: {} },
        { provide: NotificationsService, useValue: {} },
        { provide: MetadataSchemaDataService, useValue: {} },
        { provide: MetadataFieldDataService, useValue: {} },
        { provide: MetadataBitstreamDataService, useValue: mockMetadataBitstreamDataService },
        RegistryService,
        { provide: AuthorizationDataService, useValue: authorizationDataService },
        { provide: HALEndpointService, useValue: halService }
=======
        { provide: AuthorizationDataService, useValue: authorizationDataService },
        { provide: ServerResponseService, useValue: serverResponseService },
        { provide: SignpostingDataService, useValue: signpostingDataService },
        { provide: LinkHeadService, useValue: linkHeadService },
        { provide: PLATFORM_ID, useValue: 'server' },
>>>>>>> dspace-7.6.1
      ],

      schemas: [NO_ERRORS_SCHEMA]
    }).overrideComponent(ItemPageComponent, {
      set: { changeDetection: ChangeDetectionStrategy.Default }
    }).compileComponents();
  }));

  beforeEach(waitForAsync(() => {
    registryService = TestBed.inject(RegistryService);
    fixture = TestBed.createComponent(ItemPageComponent);
    comp = fixture.componentInstance;
    fixture.detectChanges();
  }));

  describe('when the item is loading', () => {
    beforeEach(() => {
      comp.itemRD$ = createPendingRemoteDataObject$();
      // comp.itemRD$ = observableOf(new RemoteData(true, true, true, null, undefined));
      fixture.detectChanges();
    });

    it('should display a loading component', () => {
      const loading = fixture.debugElement.query(By.css('ds-themed-loading'));
      expect(loading.nativeElement).toBeDefined();
    });
  });

  describe('when the item failed loading', () => {
    beforeEach(() => {
      comp.itemRD$ = createFailedRemoteDataObject$('server error', 500);
      fixture.detectChanges();
    });

    it('should display an error component', () => {
      const error = fixture.debugElement.query(By.css('ds-error'));
      expect(error.nativeElement).toBeDefined();
    });
  });

  describe('when the item is withdrawn and the user is an admin', () => {
    beforeEach(() => {
      comp.isAdmin$ = observableOf(true);
      comp.itemRD$ = createSuccessfulRemoteDataObject$(mockWithdrawnItem);
      fixture.detectChanges();
    });

    it('should display the item', () => {
      const objectLoader = fixture.debugElement.query(By.css('ds-listable-object-component-loader'));
      expect(objectLoader.nativeElement).toBeDefined();
    });
<<<<<<< HEAD
=======

    it('should add the signposting links', () => {
      expect(serverResponseService.setHeader).toHaveBeenCalled();
      expect(linkHeadService.addTag).toHaveBeenCalledTimes(2);
    });


    it('should add link tags correctly', () => {

      expect(comp.signpostingLinks).toEqual([mocklink, mocklink2]);

      // Check if linkHeadService.addTag() was called with the correct arguments
      expect(linkHeadService.addTag).toHaveBeenCalledTimes(mockSignpostingLinks.length);
      let expected: LinkDefinition = mockSignpostingLinks[0] as LinkDefinition;
      expect(linkHeadService.addTag).toHaveBeenCalledWith(expected);
      expected = {
        href: 'http://test2.org',
        rel: 'rel2'
      };
      expect(linkHeadService.addTag).toHaveBeenCalledWith(expected);
    });

    it('should set Link header on the server', () => {

      expect(serverResponseService.setHeader).toHaveBeenCalledWith('Link', '<http://test.org> ; rel="rel1" ; type="type1" , <http://test2.org> ; rel="rel2" ');
    });

>>>>>>> dspace-7.6.1
  });
  describe('when the item is withdrawn and the user is not an admin', () => {
    beforeEach(() => {
      comp.itemRD$ = createSuccessfulRemoteDataObject$(mockWithdrawnItem);
      fixture.detectChanges();
    });

    it('should not display the item', () => {
      const objectLoader = fixture.debugElement.query(By.css('ds-listable-object-component-loader'));
      expect(objectLoader).toBeNull();
    });
  });

  describe('when the item is not withdrawn and the user is an admin', () => {
    beforeEach(() => {
      comp.isAdmin$ = observableOf(true);
      comp.itemRD$ = createSuccessfulRemoteDataObject$(mockItem);
      fixture.detectChanges();
    });

    it('should display the item', () => {
      const objectLoader = fixture.debugElement.query(By.css('ds-listable-object-component-loader'));
      expect(objectLoader.nativeElement).toBeDefined();
    });
<<<<<<< HEAD
=======

    it('should add the signposting links', () => {
      expect(serverResponseService.setHeader).toHaveBeenCalled();
      expect(linkHeadService.addTag).toHaveBeenCalledTimes(2);
    });
>>>>>>> dspace-7.6.1
  });

  describe('when the item is not withdrawn and the user is not an admin', () => {
    beforeEach(() => {
      comp.itemRD$ = createSuccessfulRemoteDataObject$(mockItem);
      fixture.detectChanges();
    });

    it('should display the item', () => {
      const objectLoader = fixture.debugElement.query(By.css('ds-listable-object-component-loader'));
      expect(objectLoader.nativeElement).toBeDefined();
    });
<<<<<<< HEAD
  });

  describe('when the item has the file', () => {
    it('should display license and files section', waitForAsync(async () => {
      comp.itemRD$ = createSuccessfulRemoteDataObject$(mockItem);
      fixture.detectChanges();

      void fixture.whenStable().then(() => {
        const objectLoader = fixture.debugElement.query(By.css('ds-clarin-license-info'));
        expect(objectLoader.nativeElement).toBeDefined();
      });
    }));
=======

    it('should add the signposting links', () => {
      expect(serverResponseService.setHeader).toHaveBeenCalled();
      expect(linkHeadService.addTag).toHaveBeenCalledTimes(2);
    });
>>>>>>> dspace-7.6.1
  });

});
