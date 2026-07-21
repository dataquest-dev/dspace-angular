import {
  ComponentFixture,
  TestBed,
  waitForAsync,
} from '@angular/core/testing';
import { DomSanitizer } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import { StoreModule } from '@ngrx/store';
import { provideMockStore } from '@ngrx/store/testing';
import {
  TranslateLoader,
  TranslateModule,
} from '@ngx-translate/core';
import { of } from 'rxjs';
import { DSONameService } from 'src/app/core/breadcrumbs/dso-name.service';
import { BundleDataService } from 'src/app/core/data/bundle-data.service';
import { ClarinLicenseDataService } from 'src/app/core/data/clarin/clarin-license-data.service';
import { CollectionDataService } from 'src/app/core/data/collection-data.service';
import { ConfigurationDataService } from 'src/app/core/data/configuration-data.service';

import { Item } from '../../core/shared/item.model';
import { ClarinDateService } from '../clarin-date.service';
import { DSONameServiceMock } from '../mocks/dso-name.service.mock';
import { TranslateLoaderMock } from '../mocks/translate-loader.mock';
import { ClarinItemBoxViewComponent } from './clarin-item-box-view.component';

describe('ClarinItemBoxViewComponent', () => {
  let component: ClarinItemBoxViewComponent;
  let fixture: ComponentFixture<ClarinItemBoxViewComponent>;
  let sanitizerStub: DomSanitizer;

  const initialState = {
    core: { auth: { loading: false } },
  };

  const collectionDataServiceMock = jasmine.createSpyObj(
    'CollectionDataService',
    ['findByHref'],
  );

  const bundleDataServiceMock = jasmine.createSpyObj('BundleDataService', [
    'findByItemAndName',
  ]);

  const configurationServiceMock = jasmine.createSpyObj(
    'ConfigurationDataService',
    ['findByPropertyName'],
  );

  const clarinLicenseServiceMock = jasmine.createSpyObj(
    'ClarinLicenseDataService',
    ['searchBy'],
  );

  const clarinDateServiceMock = jasmine.createSpyObj('ClarinDateService', [
    'composeItemDate',
  ]);

  beforeEach(waitForAsync(() => {
    configurationServiceMock.findByPropertyName.and.returnValue(of({ values: ['http://localhost:4000'] }));
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
        ClarinItemBoxViewComponent,
      ],
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
        provideRouter([]),
      ],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ClarinItemBoxViewComponent);
    component = fixture.componentInstance;
    component.baseUrl = 'http://localhost:4000';
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

  it('should build publisher link with authority when authority exists', async () => {
    const mockItem = new Item();
    mockItem.metadata = {
      'dc.publisher': [
        {
          value: 'Test Publisher',
          authority: 'test123',
          confidence: 600,
          place: 0,
          language: null,
          uuid: 'mock-uuid-1',
          isVirtual: false,
          virtualValue: null,
        } as any,
      ],
    };
    component.object = mockItem;
    component.isSearchResult = true;
    spyOn(component, 'assignBaseUrl').and.returnValue(Promise.resolve());
    spyOn(component as any, 'getItemCommunity').and.stub();
    spyOn(component as any, 'getItemFilesSize').and.stub();
    spyOn(component as any, 'loadItemLicense').and.stub();
    await component.ngOnInit();
    fixture.detectChanges();
    expect(component.publisherRedirectLink).toContain('f.publisher=test123,authority');
    expect(component.hasPublisherRorAuthority).toBeTrue();
  });

  it('should build publisher link with equals when no authority', async () => {
    const mockItem = new Item();
    mockItem.metadata = {
      'dc.publisher': [
        {
          value: 'Test Publisher',
          authority: null,
          confidence: -1,
          place: 0,
          language: null,
          uuid: 'mock-uuid-2',
          isVirtual: false,
          virtualValue: null,
        } as any,
      ],
    };
    component.object = mockItem;
    component.isSearchResult = true;
    spyOn(component, 'assignBaseUrl').and.returnValue(Promise.resolve());
    spyOn(component as any, 'getItemCommunity').and.stub();
    spyOn(component as any, 'getItemFilesSize').and.stub();
    spyOn(component as any, 'loadItemLicense').and.stub();
    await component.ngOnInit();
    fixture.detectChanges();
    expect(component.publisherRedirectLink).toContain('f.publisher=Test%20Publisher,equals');
    expect(component.hasPublisherRorAuthority).toBeFalse();
  });

  it('should show ROR icon when hasPublisherRorAuthority is true', async () => {
    const mockItem = new Item();
    mockItem.metadata = {
      'dc.publisher': [
        {
          value: 'Test Publisher',
          authority: 'test123',
          confidence: 600,
          place: 0,
          language: null,
          uuid: 'mock-uuid-1',
          isVirtual: false,
          virtualValue: null,
        } as any,
      ],
    };
    component.object = mockItem;
    component.isSearchResult = true;
    spyOn(component, 'assignBaseUrl').and.returnValue(Promise.resolve());
    spyOn(component as any, 'getItemCommunity').and.stub();
    spyOn(component as any, 'getItemFilesSize').and.stub();
    spyOn(component as any, 'loadItemLicense').and.stub();
    await component.ngOnInit();
    fixture.detectChanges();
    const compiled = fixture.nativeElement;
    const icon = compiled.querySelector('img[src*="ror-icon.svg"]');
    expect(icon).toBeTruthy();
    expect(icon.src).toContain('ror-icon.svg');
  });

  it('should hide ROR icon when hasPublisherRorAuthority is false', async () => {
    const mockItem = new Item();
    mockItem.metadata = {
      'dc.publisher': [
        {
          value: 'Test Publisher',
          authority: null,
          confidence: -1,
          place: 0,
          language: null,
          uuid: 'mock-uuid-2',
          isVirtual: false,
          virtualValue: null,
        } as any,
      ],
    };
    component.object = mockItem;
    component.isSearchResult = true;
    spyOn(component, 'assignBaseUrl').and.returnValue(Promise.resolve());
    spyOn(component as any, 'getItemCommunity').and.stub();
    spyOn(component as any, 'getItemFilesSize').and.stub();
    spyOn(component as any, 'loadItemLicense').and.stub();
    await component.ngOnInit();
    fixture.detectChanges();
    const compiled = fixture.nativeElement;
    const icon = compiled.querySelector('img[src*="ror-icon.svg"]');
    expect(icon).toBeFalsy();
  });
});
