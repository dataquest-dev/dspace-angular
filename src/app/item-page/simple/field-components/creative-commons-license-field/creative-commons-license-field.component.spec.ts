import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { of } from 'rxjs';

import { CreativeCommonsLicenseFieldComponent } from './creative-commons-license-field.component';
import { BundleDataService } from '../../../../core/data/bundle-data.service';
import { BitstreamDataService } from '../../../../core/data/bitstream-data.service';
import { Item } from '../../../../core/shared/item.model';
import { RemoteData } from '../../../../core/data/remote-data';
import { Bundle } from '../../../../core/shared/bundle.model';
import { PaginatedList, buildPaginatedList } from '../../../../core/data/paginated-list.model';
import { Bitstream } from '../../../../core/shared/bitstream.model';
import { createSuccessfulRemoteDataObject, createFailedRemoteDataObject } from '../../../../shared/remote-data.utils';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { PageInfo } from '../../../../core/shared/page-info.model';

describe('CreativeCommonsLicenseFieldComponent', () => {
  let component: CreativeCommonsLicenseFieldComponent;
  let fixture: ComponentFixture<CreativeCommonsLicenseFieldComponent>;
  let bundleDataService: jasmine.SpyObj<BundleDataService>;
  let bitstreamDataService: jasmine.SpyObj<BitstreamDataService>;

  const mockItem = {
    uuid: 'test-item-uuid',
    metadata: {
      'dc.rights.uri': [{ value: 'https://creativecommons.org/licenses/by/4.0/' }],
      'dc.rights': [{ value: 'Attribution 4.0 International' }]
    },
    allMetadata: jasmine.createSpy('allMetadata').and.callFake((field: string) => {
      return mockItem.metadata[field] || [];
    })
  } as any as Item;

  const mockItemWithoutLicense = {
    uuid: 'test-item-uuid-no-license',
    metadata: {
      'dc.title': [{ value: 'Test Item' }]
    },
    allMetadata: jasmine.createSpy('allMetadata').and.callFake((field: string) => {
      return mockItemWithoutLicense.metadata[field] || [];
    })
  } as any as Item;

  const mockBundle = {
    uuid: 'test-bundle-uuid',
    name: 'CC_LICENSE'
  } as Bundle;

  const mockBitstream = {
    uuid: 'test-bitstream-uuid',
    name: 'license.txt',
    metadata: {
      'dc.identifier.uri': [{ value: 'https://creativecommons.org/licenses/by-nc-sa/3.0/' }]
    }
  } as any as Bitstream;

  beforeEach(async () => {
    const bundleDataServiceSpy = jasmine.createSpyObj('BundleDataService', ['findByItemAndName']);
    const bitstreamDataServiceSpy = jasmine.createSpyObj('BitstreamDataService', ['findAllByItemAndBundleName']);

    await TestBed.configureTestingModule({
      declarations: [CreativeCommonsLicenseFieldComponent],
      imports: [
        TranslateModule.forRoot(),
        NoopAnimationsModule
      ],
      providers: [
        { provide: BundleDataService, useValue: bundleDataServiceSpy },
        { provide: BitstreamDataService, useValue: bitstreamDataServiceSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(CreativeCommonsLicenseFieldComponent);
    component = fixture.componentInstance;
    bundleDataService = TestBed.inject(BundleDataService) as jasmine.SpyObj<BundleDataService>;
    bitstreamDataService = TestBed.inject(BitstreamDataService) as jasmine.SpyObj<BitstreamDataService>;
  });

  describe('Component Initialization', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should initialize with item input', () => {
      component.item = mockItem;
      expect(component.item).toBe(mockItem);
    });
  });

  describe('Creative Commons License Detection', () => {
    beforeEach(() => {
      component.item = mockItem;
    });

    it('should detect Creative Commons license from metadata', (done) => {
      bundleDataService.findByItemAndName.and.returnValue(of(createFailedRemoteDataObject<Bundle>()));

      component.ngOnInit();

      component.hasCcLicense$.subscribe(hasLicense => {
        expect(hasLicense).toBe(true);
        done();
      });
    });

    it('should detect Creative Commons license from CC_LICENSE bundle', (done) => {
      bundleDataService.findByItemAndName.and.returnValue(of(createSuccessfulRemoteDataObject(mockBundle)));
      bitstreamDataService.findAllByItemAndBundleName.and.returnValue(
        of(createSuccessfulRemoteDataObject(buildPaginatedList(new PageInfo(), [mockBitstream])))
      );

      component.ngOnInit();

      component.hasCcLicense$.subscribe(hasLicense => {
        expect(hasLicense).toBe(true);
        done();
      });
    });

    it('should return false when no Creative Commons license is found', (done) => {
      component.item = mockItemWithoutLicense;
      bundleDataService.findByItemAndName.and.returnValue(of(createFailedRemoteDataObject<Bundle>()));

      component.ngOnInit();

      component.hasCcLicense$.subscribe(hasLicense => {
        expect(hasLicense).toBe(false);
        done();
      });
    });
  });

  describe('License URL Extraction', () => {
    beforeEach(() => {
      component.item = mockItem;
    });

    it('should extract license URL from metadata', (done) => {
      bundleDataService.findByItemAndName.and.returnValue(of(createFailedRemoteDataObject<Bundle>()));

      component.ngOnInit();

      component.ccLicenseUrl$.subscribe(url => {
        expect(url).toBe('https://creativecommons.org/licenses/by/4.0/');
        done();
      });
    });

    it('should extract license URL from bitstream metadata', (done) => {
      bundleDataService.findByItemAndName.and.returnValue(of(createSuccessfulRemoteDataObject(mockBundle)));
      bitstreamDataService.findAllByItemAndBundleName.and.returnValue(
        of(createSuccessfulRemoteDataObject(buildPaginatedList(new PageInfo(), [mockBitstream])))
      );

      component.ngOnInit();

      component.ccLicenseUrl$.subscribe(url => {
        expect(url).toBe('https://creativecommons.org/licenses/by-nc-sa/3.0/');
        done();
      });
    });

    it('should return empty string when no license URL is found', (done) => {
      component.item = mockItemWithoutLicense;
      bundleDataService.findByItemAndName.and.returnValue(of(createFailedRemoteDataObject<Bundle>()));

      component.ngOnInit();

      component.ccLicenseUrl$.subscribe(url => {
        expect(url).toBe('');
        done();
      });
    });
  });

  describe('License Name Extraction', () => {
    beforeEach(() => {
      component.item = mockItem;
    });

    it('should extract license name from URL', (done) => {
      bundleDataService.findByItemAndName.and.returnValue(of(createFailedRemoteDataObject<Bundle>()));

      component.ngOnInit();

      component.ccLicenseName$.subscribe(name => {
        expect(name).toBe('CC BY 4.0');
        done();
      });
    });

    it('should return empty string when no license URL is available', (done) => {
      component.item = mockItemWithoutLicense;
      bundleDataService.findByItemAndName.and.returnValue(of(createFailedRemoteDataObject<Bundle>()));

      component.ngOnInit();

      component.ccLicenseName$.subscribe(name => {
        expect(name).toBe('');
        done();
      });
    });
  });

  describe('License Type Detection', () => {
    const testCases = [
      { input: 'CC BY 4.0', expected: 'by' },
      { input: 'CC BY-SA 3.0', expected: 'by-sa' },
      { input: 'CC BY-NC 2.0', expected: 'by-nc' },
      { input: 'CC BY-NC-SA 4.0', expected: 'by-nc-sa' },
      { input: 'CC BY-ND 3.0', expected: 'by-nd' },
      { input: 'CC BY-NC-ND 2.0', expected: 'by-nc-nd' },
      { input: 'CC0 1.0', expected: 'cc0' },
      { input: 'Public Domain Mark', expected: 'cc0' },
      { input: '', expected: '' },
      { input: 'Unknown License', expected: '' }
    ];

    testCases.forEach(testCase => {
      it(`should return '${testCase.expected}' for license '${testCase.input}'`, () => {
        const result = component.getLicenseType(testCase.input);
        expect(result).toBe(testCase.expected);
      });
    });
  });

  describe('License Name Extraction from URL', () => {
    const urlTestCases = [
      {
        url: 'https://creativecommons.org/licenses/by/4.0/',
        expected: 'CC BY 4.0'
      },
      {
        url: 'https://creativecommons.org/licenses/by-sa/3.0/',
        expected: 'CC BY-SA 3.0'
      },
      {
        url: 'https://creativecommons.org/licenses/by-nc/2.0/',
        expected: 'CC BY-NC 2.0'
      },
      {
        url: 'https://creativecommons.org/licenses/by-nc-sa/4.0/',
        expected: 'CC BY-NC-SA 4.0'
      },
      {
        url: 'https://creativecommons.org/licenses/by-nd/3.0/',
        expected: 'CC BY-ND 3.0'
      },
      {
        url: 'https://creativecommons.org/licenses/by-nc-nd/2.0/',
        expected: 'CC BY-NC-ND 2.0'
      },
      {
        url: 'https://creativecommons.org/publicdomain/zero/1.0/',
        expected: 'CC0 1.0'
      },
      {
        url: 'https://creativecommons.org/publicdomain/mark/1.0/',
        expected: 'Public Domain 1.0'
      },
      {
        url: 'https://example.com/not-cc-license',
        expected: ''
      },
      {
        url: '',
        expected: ''
      }
    ];

    urlTestCases.forEach(testCase => {
      it(`should extract '${testCase.expected}' from URL '${testCase.url}'`, () => {
        const result = component['extractLicenseNameFromUrl'](testCase.url);
        expect(result).toBe(testCase.expected);
      });
    });
  });

  describe('Metadata Extraction', () => {
    it('should extract Creative Commons URL from dc.rights.uri', () => {
      component.item = mockItem;
      const result = component['extractUrlFromMetadata']();
      expect(result).toBe('https://creativecommons.org/licenses/by/4.0/');
    });

    it('should return empty string when no Creative Commons URL is found in metadata', () => {
      component.item = mockItemWithoutLicense;
      const result = component['extractUrlFromMetadata']();
      expect(result).toBe('');
    });

    it('should check multiple metadata fields for Creative Commons URL', () => {
      const itemWithDifferentField = {
        uuid: 'test-item-uuid',
        metadata: {
          'dc.rights': [{ value: 'https://creativecommons.org/licenses/by-sa/3.0/' }]
        },
        allMetadata: jasmine.createSpy('allMetadata').and.callFake((field: string) => {
          return itemWithDifferentField.metadata[field] || [];
        })
      } as any as Item;

      component.item = itemWithDifferentField;
      const result = component['extractUrlFromMetadata']();
      expect(result).toBe('https://creativecommons.org/licenses/by-sa/3.0/');
    });
  });

  describe('Component Template Integration', () => {
    it('should not display license field when no license is present', () => {
      component.item = mockItemWithoutLicense;
      bundleDataService.findByItemAndName.and.returnValue(of(createFailedRemoteDataObject<Bundle>()));

      component.ngOnInit();
      fixture.detectChanges();

      const licenseElement = fixture.debugElement.query(By.css('.clarin-item-page-field'));
      expect(licenseElement).toBeNull();
    });

    it('should display license field when Creative Commons license is present', () => {
      component.item = mockItem;
      bundleDataService.findByItemAndName.and.returnValue(of(createFailedRemoteDataObject<Bundle>()));

      component.ngOnInit();
      fixture.detectChanges();

      setTimeout(() => {
        fixture.detectChanges();
        const licenseElement = fixture.debugElement.query(By.css('.clarin-item-page-field'));
        expect(licenseElement).toBeTruthy();
      }, 100);
    });
  });

  describe('Error Handling', () => {
    it('should handle bundle service errors gracefully', (done) => {
      component.item = mockItem;
      bundleDataService.findByItemAndName.and.returnValue(of(createFailedRemoteDataObject<Bundle>()));

      component.ngOnInit();

      component.hasCcLicense$.subscribe(hasLicense => {
        expect(hasLicense).toBe(true); // Should still detect from metadata
        done();
      });
    });

    it('should handle bitstream service errors gracefully', (done) => {
      component.item = mockItem;
      bundleDataService.findByItemAndName.and.returnValue(of(createSuccessfulRemoteDataObject(mockBundle)));
      bitstreamDataService.findAllByItemAndBundleName.and.returnValue(of(createFailedRemoteDataObject<PaginatedList<Bitstream>>()));

      component.ngOnInit();

      component.ccLicenseUrl$.subscribe(url => {
        expect(url).toBe('https://creativecommons.org/licenses/by/4.0/'); // Fallback to metadata
        done();
      });
    });
  });

  describe('Debug Methods', () => {
    it('should return metadata values for debug purposes', () => {
      component.item = mockItem;
      const result = component.getMetadataValues('dc.rights.uri');
      expect(result).toBe('https://creativecommons.org/licenses/by/4.0/');
    });

    it('should return "No values found" when metadata field does not exist', () => {
      component.item = mockItem;
      const result = component.getMetadataValues('nonexistent.field');
      expect(result).toBe('No values found');
    });

    it('should return "No metadata available" when item has no metadata', () => {
      component.item = { metadata: null } as any as Item;
      const result = component.getMetadataValues('dc.rights.uri');
      expect(result).toBe('No metadata available');
    });
  });
});
