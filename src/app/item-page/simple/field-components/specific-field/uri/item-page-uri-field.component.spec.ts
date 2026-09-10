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
import {
  TranslateLoader,
  TranslateModule,
} from '@ngx-translate/core';
import { of } from 'rxjs';

import { APP_CONFIG } from '../../../../../../config/app-config.interface';
import { environment } from '../../../../../../environments/environment';
import { BrowseService } from '../../../../../core/browse/browse.service';
import { BrowseDefinitionDataService } from '../../../../../core/browse/browse-definition-data.service';
import { ItemIdentifierService } from '../../../../../shared/item-identifier.service';
import { BrowseDefinitionDataServiceStub } from '../../../../../shared/testing/browse-definition-data-service.stub';
import { BrowseServiceStub } from '../../../../../shared/testing/browse-service.stub';
import { TranslateLoaderMock } from '../../../../../shared/testing/translate-loader.mock';
import { MetadataUriValuesComponent } from '../../../../field-components/metadata-uri-values/metadata-uri-values.component';
import { mockItemWithMetadataFieldsAndValue } from '../item-page-field.component.spec';
import { ItemPageUriFieldComponent } from './item-page-uri-field.component';

let comp: ItemPageUriFieldComponent;
let fixture: ComponentFixture<ItemPageUriFieldComponent>;

const mockField = 'dc.identifier.uri';
const mockValue = 'test value';
const mockLabel = 'test label';

const DOI_FIELD = 'dc.identifier.doi';
const NON_DOI_FIELD = 'coar.notify.endorsedBy';
const RESOLVER = 'https://doi.test';

let itemIdentifierService: jasmine.SpyObj<ItemIdentifierService>;

const hrefOfFirstAnchor = (f: ComponentFixture<ItemPageUriFieldComponent>): string =>
  f.debugElement.query(By.css('a')).nativeElement.getAttribute('href');

describe('ItemPageUriFieldComponent', () => {
  beforeEach(waitForAsync(() => {
    itemIdentifierService = jasmine.createSpyObj('itemIdentifierService', ['loadDoiResolverConfiguration']);
    itemIdentifierService.loadDoiResolverConfiguration.and.returnValue(of(RESOLVER));
    TestBed.configureTestingModule({
      imports: [TranslateModule.forRoot({
        loader: {
          provide: TranslateLoader,
          useClass: TranslateLoaderMock,
        },
      }), ItemPageUriFieldComponent, MetadataUriValuesComponent],
      providers: [
        { provide: APP_CONFIG, useValue: environment },
        { provide: BrowseDefinitionDataService, useValue: BrowseDefinitionDataServiceStub },
        { provide: BrowseService, useValue: BrowseServiceStub },
        { provide: ItemIdentifierService, useValue: itemIdentifierService },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).overrideComponent(ItemPageUriFieldComponent, {
      set: { changeDetection: ChangeDetectionStrategy.Default },
    }).compileComponents();
  }));

  beforeEach(waitForAsync(() => {
    fixture = TestBed.createComponent(ItemPageUriFieldComponent);
    comp = fixture.componentInstance;
    comp.item = mockItemWithMetadataFieldsAndValue([mockField], mockValue);
    comp.fields = [mockField];
    comp.label = mockLabel;
    fixture.detectChanges();
  }));

  it('should display display the correct metadata value', () => {
    expect(fixture.nativeElement.innerHTML).toContain(mockValue);
  });

  describe('DOI resolver', () => {
    const render = (field: string, value: string) => {
      fixture = TestBed.createComponent(ItemPageUriFieldComponent);
      comp = fixture.componentInstance;
      comp.item = mockItemWithMetadataFieldsAndValue([field], value);
      comp.fields = [field];
      comp.label = mockLabel;
      fixture.detectChanges();
      return fixture;
    };

    it('should prefix a bare dc.identifier.doi with the configured resolver', () => {
      const f = render(DOI_FIELD, '10.1234/abc');

      expect(hrefOfFirstAnchor(f)).toEqual(RESOLVER + '/' + '10.1234/abc');
    });

    it('should leave a dc.identifier.doi that already has a scheme alone', () => {
      const f = render(DOI_FIELD, 'https://doi.test/10.1234/abc');

      expect(hrefOfFirstAnchor(f)).toEqual('https://doi.test/10.1234/abc');
    });

    it('should leave a bare coar.notify.endorsedBy value untouched', () => {
      const f = render(NON_DOI_FIELD, '10.1234/abc');

      expect(hrefOfFirstAnchor(f)).toEqual('10.1234/abc');
    });

    it('should not produce a double slash when the configured resolver ends with one', () => {
      itemIdentifierService.loadDoiResolverConfiguration.and.returnValue(of('https://doi.test/'));
      const f = render(DOI_FIELD, '10.1234/abc');

      expect(hrefOfFirstAnchor(f)).toEqual('https://doi.test/10.1234/abc');
    });
  });
});
