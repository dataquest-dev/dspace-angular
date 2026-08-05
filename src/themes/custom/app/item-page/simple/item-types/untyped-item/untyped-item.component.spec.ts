import { HttpClient } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  NO_ERRORS_SCHEMA,
} from '@angular/core';
import {
  ComponentFixture,
  TestBed,
  waitForAsync,
} from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { RouterTestingModule } from '@angular/router/testing';
import { Store } from '@ngrx/store';
import {
  TranslateLoader,
  TranslateModule,
} from '@ngx-translate/core';
import {
  Observable,
  of,
} from 'rxjs';

import { BrowseDefinitionDataService } from '../../../../../../../app/core/browse/browse-definition-data.service';
import { RemoteDataBuildService } from '../../../../../../../app/core/cache/builders/remote-data-build.service';
import { ObjectCacheService } from '../../../../../../../app/core/cache/object-cache.service';
import { BitstreamDataService } from '../../../../../../../app/core/data/bitstream-data.service';
import { CommunityDataService } from '../../../../../../../app/core/data/community-data.service';
import { ConfigurationDataService } from '../../../../../../../app/core/data/configuration-data.service';
import { DefaultChangeAnalyzer } from '../../../../../../../app/core/data/default-change-analyzer.service';
import { DSOChangeAnalyzer } from '../../../../../../../app/core/data/dso-change-analyzer.service';
import { ItemDataService } from '../../../../../../../app/core/data/item-data.service';
import { RelationshipDataService } from '../../../../../../../app/core/data/relationship-data.service';
import { RemoteData } from '../../../../../../../app/core/data/remote-data';
import { VersionDataService } from '../../../../../../../app/core/data/version-data.service';
import { VersionHistoryDataService } from '../../../../../../../app/core/data/version-history-data.service';
import { RouteService } from '../../../../../../../app/core/services/route.service';
import { Bitstream } from '../../../../../../../app/core/shared/bitstream.model';
import { HALEndpointService } from '../../../../../../../app/core/shared/hal-endpoint.service';
import { Item } from '../../../../../../../app/core/shared/item.model';
import { MetadataMap } from '../../../../../../../app/core/shared/metadata.models';
import { SearchService } from '../../../../../../../app/core/shared/search/search.service';
import { UUIDService } from '../../../../../../../app/core/shared/uuid.service';
import { WorkspaceitemDataService } from '../../../../../../../app/core/submission/workspaceitem-data.service';
import { CollectionsComponent } from '../../../../../../../app/item-page/field-components/collections/collections.component';
import { ThemedMediaViewerComponent } from '../../../../../../../app/item-page/media-viewer/themed-media-viewer.component';
import { MiradorViewerComponent } from '../../../../../../../app/item-page/mirador-viewer/mirador-viewer.component';
import { ThemedFileSectionComponent } from '../../../../../../../app/item-page/simple/field-components/file-section/themed-file-section.component';
import { ItemPageAbstractFieldComponent } from '../../../../../../../app/item-page/simple/field-components/specific-field/abstract/item-page-abstract-field.component';
import { ItemPageCcLicenseFieldComponent } from '../../../../../../../app/item-page/simple/field-components/specific-field/cc-license/item-page-cc-license-field.component';
import { ItemPageCitationFieldComponent } from '../../../../../../../app/item-page/simple/field-components/specific-field/citation/item-page-citation.component';
import { ItemPageDateFieldComponent } from '../../../../../../../app/item-page/simple/field-components/specific-field/date/item-page-date-field.component';
import { GenericItemPageFieldComponent } from '../../../../../../../app/item-page/simple/field-components/specific-field/generic/generic-item-page-field.component';
import { GeospatialItemPageFieldComponent } from '../../../../../../../app/item-page/simple/field-components/specific-field/geospatial/geospatial-item-page-field.component';
import { ThemedItemPageTitleFieldComponent } from '../../../../../../../app/item-page/simple/field-components/specific-field/title/themed-item-page-field.component';
import { ItemPageUriFieldComponent } from '../../../../../../../app/item-page/simple/field-components/specific-field/uri/item-page-uri-field.component';
import { mockRouteService } from '../../../../../../../app/item-page/simple/item-types/shared/item.component.spec';
import { ThemedMetadataRepresentationListComponent } from '../../../../../../../app/item-page/simple/metadata-representation-list/themed-metadata-representation-list.component';
import { ItemVersionsSharedService } from '../../../../../../../app/item-page/versions/item-versions-shared.service';
import { DsoEditMenuComponent } from '../../../../../../../app/shared/dso-page/dso-edit-menu/dso-edit-menu.component';
import { MetadataFieldWrapperComponent } from '../../../../../../../app/shared/metadata-field-wrapper/metadata-field-wrapper.component';
import { mockTruncatableService } from '../../../../../../../app/shared/mocks/mock-trucatable.service';
import { TranslateLoaderMock } from '../../../../../../../app/shared/mocks/translate-loader.mock';
import { NotificationsService } from '../../../../../../../app/shared/notifications/notifications.service';
import { createSuccessfulRemoteDataObject$ } from '../../../../../../../app/shared/remote-data.utils';
import { ThemedResultsBackButtonComponent } from '../../../../../../../app/shared/results-back-button/themed-results-back-button.component';
import { BrowseDefinitionDataServiceStub } from '../../../../../../../app/shared/testing/browse-definition-data-service.stub';
import { ConfigurationDataServiceStub } from '../../../../../../../app/shared/testing/configuration-data.service.stub';
import { createPaginatedList } from '../../../../../../../app/shared/testing/utils.test';
import { TruncatableService } from '../../../../../../../app/shared/truncatable/truncatable.service';
import { ThemedThumbnailComponent } from '../../../../../../../app/thumbnail/themed-thumbnail.component';
import {
  APP_CONFIG,
  APP_DATA_SERVICES_MAP,
} from '../../../../../../../config/app-config.interface';
import { environment } from '../../../../../../../environments/environment.test';
import { UntypedItemComponent } from './untyped-item.component';

/**
 * The JCU theme owns this template so it can surface thesis metadata and the translated abstract
 * on the simple item page. These tests pin the field list down: upstream only exposes those values
 * on the full item page, and a future theme rebase must not silently drop them again.
 */
describe('UntypedItemComponent (custom theme)', () => {
  let comp: UntypedItemComponent;
  let fixture: ComponentFixture<UntypedItemComponent>;

  /**
   * Reads the `fields` input off every rendered ds-generic-item-page-field instance, which is what
   * actually decides which metadata the page shows.
   */
  const declaredGenericFields = (): string[] =>
    fixture.debugElement.queryAll(By.directive(GenericItemPageFieldComponent))
      .map((el) => (el.componentInstance as GenericItemPageFieldComponent).fields)
      .filter(Boolean)
      .reduce((acc: string[], fields: string[]) => acc.concat(fields), []);

  beforeEach(waitForAsync(() => {
    const mockBitstreamDataService = {
      getThumbnailFor(item: Item): Observable<RemoteData<Bitstream>> {
        return createSuccessfulRemoteDataObject$(new Bitstream());
      },
    };

    TestBed.configureTestingModule({
      imports: [
        TranslateModule.forRoot({
          loader: { provide: TranslateLoader, useClass: TranslateLoaderMock },
        }),
        RouterTestingModule,
        UntypedItemComponent,
      ],
      providers: [
        { provide: ItemDataService, useValue: {} },
        { provide: TruncatableService, useValue: mockTruncatableService },
        { provide: RelationshipDataService, useValue: {} },
        { provide: ObjectCacheService, useValue: {} },
        { provide: UUIDService, useValue: {} },
        { provide: Store, useValue: jasmine.createSpyObj('store', { dispatch: undefined, select: undefined, pipe: of(true) }) },
        { provide: RemoteDataBuildService, useValue: {} },
        { provide: CommunityDataService, useValue: {} },
        { provide: HALEndpointService, useValue: {} },
        { provide: NotificationsService, useValue: {} },
        { provide: HttpClient, useValue: {} },
        { provide: DSOChangeAnalyzer, useValue: {} },
        { provide: DefaultChangeAnalyzer, useValue: {} },
        { provide: VersionHistoryDataService, useValue: {} },
        { provide: VersionDataService, useValue: {} },
        { provide: BitstreamDataService, useValue: mockBitstreamDataService },
        { provide: WorkspaceitemDataService, useValue: {} },
        { provide: SearchService, useValue: {} },
        { provide: ItemVersionsSharedService, useValue: {} },
        { provide: RouteService, useValue: mockRouteService },
        { provide: BrowseDefinitionDataService, useValue: BrowseDefinitionDataServiceStub },
        { provide: ConfigurationDataService, useValue: new ConfigurationDataServiceStub() },
        { provide: APP_CONFIG, useValue: environment },
        { provide: APP_DATA_SERVICES_MAP, useValue: {} },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).overrideComponent(UntypedItemComponent, {
      add: { changeDetection: ChangeDetectionStrategy.Default },
      // Everything except ds-generic-item-page-field is stubbed out by NO_ERRORS_SCHEMA: these
      // tests are about which fields the template declares, not about rendering each one.
      remove: {
        imports: [
          ThemedResultsBackButtonComponent,
          MiradorViewerComponent,
          ThemedItemPageTitleFieldComponent,
          DsoEditMenuComponent,
          MetadataFieldWrapperComponent,
          ThemedThumbnailComponent,
          ThemedMediaViewerComponent,
          ThemedFileSectionComponent,
          ItemPageDateFieldComponent,
          ThemedMetadataRepresentationListComponent,
          ItemPageAbstractFieldComponent,
          ItemPageCcLicenseFieldComponent,
          ItemPageCitationFieldComponent,
          ItemPageUriFieldComponent,
          GeospatialItemPageFieldComponent,
          CollectionsComponent,
        ],
      },
    });
  }));

  beforeEach(waitForAsync(() => {
    TestBed.compileComponents();
    fixture = TestBed.createComponent(UntypedItemComponent);
    comp = fixture.componentInstance;
    comp.object = Object.assign(new Item(), {
      bundles: createSuccessfulRemoteDataObject$(createPaginatedList([])),
      metadata: new MetadataMap(),
      relationships: of([]),
    });
    fixture.detectChanges();
  }));

  it('should render the translated abstract next to the original', () => {
    expect(declaredGenericFields()).toContain('dc.description.abstract-translated');
    // The original abstract keeps its own dedicated component, so both are shown.
    expect(fixture.debugElement.queryAll(By.css('ds-item-page-abstract-field')).length).toBeGreaterThanOrEqual(1);
  });

  it('should render the document type', () => {
    expect(declaredGenericFields()).toContain('dc.type');
  });

  it('should render every thesis field', () => {
    const declared = declaredGenericFields();

    [
      'dc.thesis.degree-name',
      'dc.thesis.degree-program',
      'dc.thesis.degree-discipline',
      'dc.thesis.degree-grantor',
    ].forEach((field) => expect(declared).toContain(field));
  });

  it('should keep the upstream fields it inherited', () => {
    const declared = declaredGenericFields();

    ['dc.publisher', 'dc.subject', 'dc.description'].forEach((field) => expect(declared).toContain(field));
    expect(fixture.debugElement.queryAll(By.css('ds-item-page-uri-field')).length).toBeGreaterThanOrEqual(1);
    expect(fixture.debugElement.queryAll(By.css('ds-item-page-collections')).length).toBeGreaterThanOrEqual(1);
  });
});
