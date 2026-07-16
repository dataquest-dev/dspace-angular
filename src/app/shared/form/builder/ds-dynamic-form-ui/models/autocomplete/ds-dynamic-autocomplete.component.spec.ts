import {
  ChangeDetectorRef,
  Component,
  CUSTOM_ELEMENTS_SCHEMA,
} from '@angular/core';
import {
  ComponentFixture,
  fakeAsync,
  flush,
  inject,
  TestBed,
  waitForAsync,
} from '@angular/core/testing';
import {
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
} from '@angular/forms';
import {
  NgbModule,
  NgbTypeaheadSelectItemEvent,
} from '@ng-bootstrap/ng-bootstrap';
import {
  DynamicFormLayoutService,
  DynamicFormsCoreModule,
  DynamicFormValidationService,
} from '@ng-dynamic-forms/core';
import { TranslateModule } from '@ngx-translate/core';
import { of } from 'rxjs';

import { RemoteDataBuildService } from '../../../../../../core/cache/builders/remote-data-build.service';
import { ConfigurationDataService } from '../../../../../../core/data/configuration-data.service';
import { LookupRelationService } from '../../../../../../core/data/lookup-relation.service';
import { MetadataValueDataService } from '../../../../../../core/data/metadata-value-data.service';
import { RequestService } from '../../../../../../core/data/request.service';
import { HALEndpointService } from '../../../../../../core/shared/hal-endpoint.service';
import { VocabularyEntry } from '../../../../../../core/submission/vocabularies/models/vocabulary-entry.model';
import { VocabularyService } from '../../../../../../core/submission/vocabularies/vocabulary.service';
import { getMockRemoteDataBuildService } from '../../../../../mocks/remote-data-build.service.mock';
import { getMockRequestService } from '../../../../../mocks/request.service.mock';
import {
  mockDynamicFormLayoutService,
  mockDynamicFormValidationService,
} from '../../../../../testing/dynamic-form-mock-services';
import { HALEndpointServiceStub } from '../../../../../testing/hal-endpoint-service.stub';
import { MockLookupRelationService } from '../../../../../testing/lookup-relation-service.mock';
import { MockMetadataValueService } from '../../../../../testing/metadata-value-data-service.mock';
import { createTestComponent } from '../../../../../testing/utils.test';
import { VocabularyServiceStub } from '../../../../../testing/vocabulary-service.stub';
import { DsDynamicAutocompleteComponent } from './ds-dynamic-autocomplete.component';
import { DsDynamicAutocompleteModel } from './ds-dynamic-autocomplete.model';

let AUT_TEST_GROUP;
let AUT_TEST_MODEL_CONFIG;

/**
 * The test class for the DsDynamicAutocompleteComponent.
 */
function init() {
  AUT_TEST_GROUP = new FormGroup({
    autocomplete: new FormControl(),
  });

  AUT_TEST_MODEL_CONFIG = {
    disabled: false,
    id: 'autocomplete',
    label: 'Keywords',
    minChars: 3,
    name: 'autocomplete',
    placeholder: 'Keywords',
    readOnly: false,
    required: false,
    repeatable: false,
  };
}

describe('DsDynamicAutocompleteComponent test suite', () => {
  let testComp: TestComponent;
  let autComp: DsDynamicAutocompleteComponent;
  let testFixture: ComponentFixture<TestComponent>;
  let autFixture: ComponentFixture<DsDynamicAutocompleteComponent>;
  let html;
  let modelValue: any;

  beforeEach(waitForAsync(() => {
    const mockMetadataValueService = new MockMetadataValueService();
    const vocabularyServiceStub = new VocabularyServiceStub();
    const mockLookupRelationService = new MockLookupRelationService();
    const requestService = getMockRequestService();
    const halService = Object.assign(new HALEndpointServiceStub('url'));
    const rdbService = getMockRemoteDataBuildService();
    const configurationServiceSpy = jasmine.createSpyObj('configurationService', {
      findByPropertyName: of('hdl'),
    });
    init();
    TestBed.configureTestingModule({
      imports: [
        DynamicFormsCoreModule,
        FormsModule,
        NgbModule,
        ReactiveFormsModule,
        TranslateModule.forRoot(),
        DsDynamicAutocompleteComponent,
        TestComponent,
      ],
      providers: [
        ChangeDetectorRef,
        DsDynamicAutocompleteComponent,
        { provide: MetadataValueDataService, useValue: mockMetadataValueService },
        { provide: VocabularyService, useValue: vocabularyServiceStub },
        { provide: DynamicFormLayoutService, useValue: mockDynamicFormLayoutService },
        { provide: DynamicFormValidationService, useValue: mockDynamicFormValidationService },
        { provide: LookupRelationService, useValue: mockLookupRelationService },
        { provide: RequestService, useValue: requestService },
        { provide: HALEndpointService, useValue: halService },
        { provide: RemoteDataBuildService, useValue: rdbService },
        { provide: ConfigurationDataService, useValue: configurationServiceSpy },
      ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    });
  }));
  describe('', () => {
    // synchronous beforeEach
    beforeEach(() => {
      init();
      html = `
      <ds-dynamic-autocomplete [bindId]="bindId"
                      [group]="group"
                      [model]="model"
                      (blur)="onBlur($event)"
                      (change)="onValueChange($event)"
                      (focus)="onFocus($event)"></ds-dynamic-autocomplete>`;

      testFixture = createTestComponent(html, TestComponent) as ComponentFixture<TestComponent>;
      testComp = testFixture.componentInstance;
    });
    afterEach(() => {
      testFixture.destroy();
    });
    it('should create DsDynamicAutocompleteComponent',
      inject([DsDynamicAutocompleteComponent], (app: DsDynamicAutocompleteComponent) => {

        expect(app).toBeDefined();
      }));
  });
  describe('when vocabularyOptions are set', () => {
    beforeEach(() => {

      autFixture = TestBed.createComponent(DsDynamicAutocompleteComponent);
      autComp = autFixture.componentInstance; // FormComponent test instance
      autComp.group = AUT_TEST_GROUP;
      autComp.model = new DsDynamicAutocompleteModel(AUT_TEST_MODEL_CONFIG);
      autFixture.detectChanges();
    });

    afterEach(() => {
      autFixture.destroy();
      autComp = null;
    });

    it('should init component properly', () => {
      expect(autComp.model.value).toEqual([]);
    });


    it('should search when 3+ characters is typed', fakeAsync(() => {
      spyOn((autComp as any).metadataValueService, 'findByMetadataNameAndByValue').and.callThrough();

      autComp.search(of('test')).subscribe(() => {
        expect((autComp as any).metadataValueService.findByMetadataNameAndByValue).toHaveBeenCalled();
      });
    }));

    it('should select a results entry properly', fakeAsync(() => {
      modelValue = Object.assign(new VocabularyEntry(), { display: 'Name, Lastname', value: 1 });
      const event: NgbTypeaheadSelectItemEvent = {
        item: Object.assign(new VocabularyEntry(), {
          display: 'Name, Lastname',
          value: 1,
        }),
        preventDefault: () => {
          return;
        },
      };
      spyOn(autComp.change, 'emit');

      autComp.onSelectItem(event);

      autFixture.detectChanges();
      flush();

      expect(autComp.model.value).toEqual(modelValue.value);
      expect(autComp.currentValue).toEqual(modelValue.value);
      expect(autComp.change.emit).toHaveBeenCalled();
    }));

    it('should normalize object value to string on blur', () => {
      spyOn(autComp.change, 'emit');
      autComp.currentValue = { value: 'aig', display: 'Alumu-Tesu' };

      autComp.onBlur(new Event('blur'));

      expect(autComp.model.value).toEqual('aig');
      expect(autComp.change.emit).toHaveBeenCalledWith('aig');
    });

    it('should format string values as-is', () => {
      expect(autComp.formatter('aig')).toEqual('aig');
    });

    it('should format object values using value first', () => {
      expect(autComp.formatter({ value: 'aig', display: 'Alumu-Tesu' })).toEqual('aig');
    });

    it('should format object values using display fallback', () => {
      expect(autComp.formatter({ display: 'Alumu-Tesu' })).toEqual('Alumu-Tesu');
    });
  });
});

// declare a test component
@Component({
  selector: 'ds-test-cmp',
  template: ``,
})
class TestComponent {
  group: FormGroup = AUT_TEST_GROUP;
  model = new DsDynamicAutocompleteModel(AUT_TEST_MODEL_CONFIG);
  showErrorMessages = false;
}


