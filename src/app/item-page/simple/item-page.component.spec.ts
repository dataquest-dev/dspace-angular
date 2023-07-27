import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { TranslateLoader, TranslateModule, TranslateService } from '@ngx-translate/core';
import { TranslateLoaderMock } from '../../shared/mocks/translate-loader.mock';
import { ItemDataService } from '../../core/data/item-data.service';
import { ChangeDetectionStrategy, NO_ERRORS_SCHEMA } from '@angular/core';
import { ItemPageComponent } from './item-page.component';
import { ActivatedRoute, Router } from '@angular/router';
import { ActivatedRouteStub } from '../../shared/testing/active-router.stub';
import { MetadataService } from '../../core/metadata/metadata.service';
import { VarDirective } from '../../shared/utils/var.directive';
import { Item } from '../../core/shared/item.model';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { By } from '@angular/platform-browser';
import { createRelationshipsObservable } from './item-types/shared/item.component.spec';
import { of as observableOf, of } from 'rxjs';
import {
  createFailedRemoteDataObject$,
  createPendingRemoteDataObject$,
  createSuccessfulRemoteDataObject,
  createSuccessfulRemoteDataObject$,
} from '../../shared/remote-data.utils';
import { AuthService } from '../../core/auth/auth.service';
import { createPaginatedList } from '../../shared/testing/utils.test';
import { AuthorizationDataService } from '../../core/data/feature-authorization/authorization-data.service';
import { RegistryService } from 'src/app/core/registry/registry.service';
import { Store } from '@ngrx/store';
import { NotificationsService } from 'src/app/shared/notifications/notifications.service';
import { MetadataSchemaDataService } from 'src/app/core/data/metadata-schema-data.service';
import { MetadataFieldDataService } from 'src/app/core/data/metadata-field-data.service';
import { MetadataBitstreamDataService } from 'src/app/core/data/metadata-bitstream-data.service';
import { getMockTranslateService } from 'src/app/shared/mocks/translate.service.mock';

const mockItem: Item = Object.assign(new Item(), {
  bundles: createSuccessfulRemoteDataObject$(createPaginatedList([])),
  metadata: [],
  relationships: createRelationshipsObservable(),
});

describe('ItemPageComponent', () => {
  let comp: ItemPageComponent;
  let fixture: ComponentFixture<ItemPageComponent>;
  let authService: AuthService;
  let translateService: TranslateService;
  let registryService: RegistryService;
  const authorizationService = jasmine.createSpyObj('authorizationService', [
    'isAuthorized',
  ]);

  const mockMetadataService = {
    /* tslint:disable:no-empty */
    processRemoteData: () => {},
    /* tslint:enable:no-empty */
  };
  const mockRoute = Object.assign(new ActivatedRouteStub(), {
    data: observableOf({ dso: createSuccessfulRemoteDataObject(mockItem) }),
  });

  const mockMetadataBitstreamDataService = {
    searchByHandleParams: () => of({}) // Returns a mock Observable
  };

  beforeEach(waitForAsync(() => {
    authService = jasmine.createSpyObj('authService', {
      isAuthenticated: observableOf(true),
      setRedirectUrl: {},
    });

    translateService = getMockTranslateService();

    TestBed.configureTestingModule({
      imports: [
        TranslateModule.forRoot({
          loader: {
            provide: TranslateLoader,
            useClass: TranslateLoaderMock,
          },
        }),
        BrowserAnimationsModule,
      ],
      declarations: [ItemPageComponent, VarDirective],
      providers: [
        { provide: ActivatedRoute, useValue: mockRoute },
        { provide: ItemDataService, useValue: {} },
        { provide: MetadataService, useValue: mockMetadataService },
        { provide: Router, useValue: {} },
        { provide: AuthService, useValue: authService },
        { provide: AuthorizationDataService, useValue: authorizationService },
        { provide: Store, useValue: {} },
        { provide: NotificationsService, useValue: {} },
        { provide: MetadataSchemaDataService, useValue: {} },
        { provide: MetadataFieldDataService, useValue: {} },
        { provide: MetadataBitstreamDataService, useValue: mockMetadataBitstreamDataService },
        RegistryService,
      ],

      schemas: [NO_ERRORS_SCHEMA],
    })
      .overrideComponent(ItemPageComponent, {
        set: { changeDetection: ChangeDetectionStrategy.Default },
      })
      .compileComponents();
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
      const loading = fixture.debugElement.query(By.css('ds-loading'));
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
});
