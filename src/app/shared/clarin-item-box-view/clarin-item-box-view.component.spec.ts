import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { ClarinItemBoxViewComponent } from './clarin-item-box-view.component';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { TranslateLoaderMock } from '../mocks/translate-loader.mock';
import { CollectionDataService } from 'src/app/core/data/collection-data.service';
import { provideMockStore } from '@ngrx/store/testing';

import { BundleDataService } from 'src/app/core/data/bundle-data.service';
import { StoreModule } from '@ngrx/store';
import { DSONameService } from 'src/app/core/breadcrumbs/dso-name.service';
import { ConfigurationDataService } from 'src/app/core/data/configuration-data.service';
import { ClarinLicenseDataService } from 'src/app/core/data/clarin/clarin-license-data.service';
import { ClarinDateService } from '../clarin-date.service';
import { DomSanitizer } from '@angular/platform-browser';
import { DSONameServiceMock } from '../mocks/dso-name.service.mock';

describe('ClarinItemBoxViewComponent', () => {
  let component: ClarinItemBoxViewComponent;
  let fixture: ComponentFixture<ClarinItemBoxViewComponent>;
  let sanitizerStub: DomSanitizer;

  const restEndpoint = 'fake-rest-endpoint';
  const initialState = {
    core: { auth: { loading: false } },
  };

  const collectionDataServiceMock = jasmine.createSpyObj(
    'CollectionDataService',
    ['findByHref']
  );

  const bundleDataServiceMock = jasmine.createSpyObj('BundleDataService', [
    'findByItemAndName',
  ]);

  const configurationServiceMock = jasmine.createSpyObj(
    'ConfigurationDataService',
    ['findByPropertyName']
  );

  const clarinLicenseServiceMock = jasmine.createSpyObj(
    'ClarinLicenseDataService',
    ['searchBy']
  );

  const clarinDateServiceMock = jasmine.createSpyObj('ClarinDateService', [
    'composeItemDate',
  ]);

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [
        NoopAnimationsModule,
        TranslateModule.forRoot({
          loader: {
            provide: TranslateLoader,
            useClass: TranslateLoaderMock,
          },
        }),
        StoreModule.forRoot(),
      ],
      declarations: [ClarinItemBoxViewComponent],
      providers: [
        { provide: CollectionDataService, useValue: collectionDataServiceMock },
        { provide: BundleDataService, useValue: bundleDataServiceMock },
        {
          provide: ConfigurationDataService,
          useValue: configurationServiceMock,
        },
        {
          provide: ClarinLicenseDataService,
          useValue: clarinLicenseServiceMock,
        },
        { provide: ClarinDateService, useValue: clarinDateServiceMock },
        { provide: DSONameService, useValue: new DSONameServiceMock() },
        { provide: DomSanitizer, useValue: sanitizerStub },
        provideMockStore({ initialState }),
      ],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ClarinItemBoxViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('Should create', () => {
    expect(component).toBeDefined();
  });

  describe('formateIconsAltText', () => {
    it('should format camelCase item type correctly', () => {
      const result = component.formateIconsAltText('researchData');
      expect(result).toBe('Research data icon');
    });

    it('should format kebab-case item type correctly', () => {
      const result = component.formateIconsAltText('research-data');
      expect(result).toBe('Research data icon');
    });

    it('should handle single word item type', () => {
      const result = component.formateIconsAltText('article');
      expect(result).toBe('Article icon');
    });

    it('should handle empty string', () => {
      const result = component.formateIconsAltText('');
      expect(result).toBe('icon');
    });

    it('should handle empty string', () => {
      const result = component.formateIconsAltText('research_data');
      expect(result).toBe('Research data icon');
    });
  });
});
