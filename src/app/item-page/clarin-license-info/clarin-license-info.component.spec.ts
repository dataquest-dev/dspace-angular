import {
  ComponentFixture,
  TestBed,
} from '@angular/core/testing';
import { DomSanitizer } from '@angular/platform-browser';
import { TranslateModule } from '@ngx-translate/core';
import { of } from 'rxjs';

import { ClarinLicenseDataService } from '../../core/data/clarin/clarin-license-data.service';
import { LocaleService } from '../../core/locale/locale.service';
import { Item } from '../../core/shared/item.model';
import { MetadataValue } from '../../core/shared/metadata.models';
import { mockLicenseRD$ } from '../../shared/testing/clarin-license-mock';
import { ClarinLicenseInfoComponent } from './clarin-license-info.component';

const license = 'Test License Name';
const licenseLabel = 'Test PUB';
const licenseURI = 'Test URI';

describe('ClarinLicenseInfoComponent', () => {
  let component: ClarinLicenseInfoComponent;
  let fixture: ComponentFixture<ClarinLicenseInfoComponent>;

  let clarinLicenseDataService: ClarinLicenseDataService;
  let sanitizerStub: DomSanitizer;
  let localeService: LocaleService;

  function metadataValue(key: string, value: string) {
    return [Object.assign(new MetadataValue(), { key, value })];
  }

  function itemWithLicense(label: string): Item {
    return Object.assign(new Item(), {
      metadata: {
        'dc.rights.label': metadataValue('dc.rights.label', label),
        'dc.rights': metadataValue('dc.rights', license),
        'dc.rights.uri': metadataValue('dc.rights.uri', licenseURI),
      },
    });
  }

  async function createComponent(item: Item, currentLanguageCode = 'en') {
    clarinLicenseDataService = jasmine.createSpyObj('clarinLicenseService', {
      searchBy: mockLicenseRD$,
    });
    sanitizerStub = jasmine.createSpyObj('sanitizer', {
      bypassSecurityTrustUrl: null,
    });
    localeService = jasmine.createSpyObj('LocaleService', {
      getCurrentLanguageCode: of(currentLanguageCode),
    });

    await TestBed.configureTestingModule({
      imports: [
        ClarinLicenseInfoComponent,
        TranslateModule.forRoot(),
      ],
      providers: [
        { provide: ClarinLicenseDataService, useValue: clarinLicenseDataService },
        { provide: DomSanitizer, useValue: sanitizerStub },
        { provide: LocaleService, useValue: localeService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ClarinLicenseInfoComponent);
    component = fixture.componentInstance;
    component.item = item;
    fixture.detectChanges();
  }

  beforeEach(async () => {
    await createComponent(itemWithLicense(licenseLabel));
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load license data', () => {
    expect(component.license).toEqual(license);
    expect(component.licenseLabel).toEqual(licenseLabel);
    expect(component.licenseURI).toEqual(licenseURI);
  });

  it('should load license label icons', () => {
    expect(component.licenseLabelIcons.value.length).toEqual(1);
  });

  it('should translate the PUB label into a readable licence type', async () => {
    TestBed.resetTestingModule();
    await createComponent(itemWithLicense('PUB'));

    expect(component.licenseType).toEqual('Publicly Available');
  });

  it('should translate the RES label into a readable licence type', async () => {
    TestBed.resetTestingModule();
    await createComponent(itemWithLicense('RES'));

    expect(component.licenseType).toEqual('Restricted Use');
  });

  it('should translate the ACA label into a readable licence type', async () => {
    TestBed.resetTestingModule();
    await createComponent(itemWithLicense('ACA'));

    expect(component.licenseType).toEqual('Academic Use');
  });

  it('should report the Czech locale', async () => {
    TestBed.resetTestingModule();
    await createComponent(itemWithLicense('PUB'), 'cs');

    expect(component.isCsLocale()).toBeTrue();
  });

  it('should not report the Czech locale for English', () => {
    expect(component.isCsLocale()).toBeFalse();
  });
});
