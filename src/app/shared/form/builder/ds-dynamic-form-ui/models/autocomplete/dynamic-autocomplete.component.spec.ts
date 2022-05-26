import {ComponentFixture, fakeAsync, flush, inject, TestBed, tick, waitForAsync} from '@angular/core/testing';
import {VocabularyServiceStub} from '../../../../../testing/vocabulary-service.stub';
import {DynamicFormLayoutService, DynamicFormsCoreModule, DynamicFormValidationService} from '@ng-dynamic-forms/core';
import {DynamicFormsNGBootstrapUIModule} from '@ng-dynamic-forms/ui-ng-bootstrap';
import {FormControl, FormGroup, FormsModule, ReactiveFormsModule} from '@angular/forms';
import {NgbModule, NgbTypeaheadSelectItemEvent} from '@ng-bootstrap/ng-bootstrap';
import {DsDynamicTagComponent} from '../tag/dynamic-tag.component';
import {ChangeDetectorRef, Component, CUSTOM_ELEMENTS_SCHEMA} from '@angular/core';
import {VocabularyService} from '../../../../../../core/submission/vocabularies/vocabulary.service';
import {
  mockDynamicFormLayoutService,
  mockDynamicFormValidationService
} from '../../../../../testing/dynamic-form-mock-services';
import {VocabularyOptions} from '../../../../../../core/submission/vocabularies/models/vocabulary-options.model';
import {createTestComponent} from '../../../../../testing/utils.test';
import {Chips} from '../../../../../chips/models/chips.model';
import {DsDynamicAutocompleteComponent} from './dynamic-autocomplete.component';
import {DynamicTagModel} from '../tag/dynamic-tag.model';
import {DynamicAutocompleteModel} from './dynamic-autocomplete.model';
import {MetadataValueDataService} from '../../../../../../core/data/metadata-value-data.service';
import {Item} from '../../../../../../core/shared/item.model';
import {Observable, of as observableOf} from 'rxjs';
import {RemoteData} from '../../../../../../core/data/remote-data';
import {Bitstream} from '../../../../../../core/shared/bitstream.model';
import {createSuccessfulRemoteDataObject$} from '../../../../../remote-data.utils';
import {buildPaginatedList, PaginatedList} from '../../../../../../core/data/paginated-list.model';
import {MetadataValue} from '../../../../../../core/metadata/metadata-value.model';
import {Runtime} from 'inspector';
import {VocabularyEntry} from '../../../../../../core/submission/vocabularies/models/vocabulary-entry.model';
import {PageInfo} from '../../../../../../core/shared/page-info.model';
import {MockMetadataValueService} from '../../../../../testing/metadata-value-data-service.mock';

let AUT_TEST_GROUP;
let AUT_TEST_MODEL_CONFIG;

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
    repeatable: false
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
    init();
    TestBed.configureTestingModule({
      imports: [
        DynamicFormsCoreModule,
        DynamicFormsNGBootstrapUIModule,
        FormsModule,
        NgbModule,
        ReactiveFormsModule,
      ],
      declarations: [
        DsDynamicAutocompleteComponent,
        TestComponent,
      ], // declare the test component
      providers: [
        ChangeDetectorRef,
        DsDynamicAutocompleteComponent,
        { provide: MetadataValueDataService, useValue: mockMetadataValueService },
        { provide: VocabularyService, useValue: vocabularyServiceStub },
        { provide: DynamicFormLayoutService, useValue: mockDynamicFormLayoutService },
        { provide: DynamicFormValidationService, useValue: mockDynamicFormValidationService }
      ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA]
    });
  }));
  describe('', () => {
    // synchronous beforeEach
    beforeEach(() => {
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
      autComp.model = new DynamicAutocompleteModel(AUT_TEST_MODEL_CONFIG);
      autFixture.detectChanges();
    });

    afterEach(() => {
      autFixture.destroy();
      autComp = null;
    });

    it('should init component properly', () => {
      expect(autComp.model.value).toEqual([]);
    });


    it('should search when 3+ characters typed', fakeAsync(() => {
      spyOn((autComp as any).metadataValueService, 'findByMetadataNameAndByValue').and.callThrough();

      autComp.search(observableOf('test')).subscribe(() => {
        expect((autComp as any).metadataValueService.findByMetadataNameAndByValue).toHaveBeenCalled();
      });
    }));

    it('should select a results entry properly', fakeAsync(() => {
      modelValue = Object.assign(new VocabularyEntry(), { display: 'Name, Lastname', value: 1 });
      const event: NgbTypeaheadSelectItemEvent = {
        item: Object.assign(new VocabularyEntry(), {
          display: 'Name, Lastname',
          value: 1
        }),
        preventDefault: () => {
          return;
        }
      };
      spyOn(autComp.change, 'emit');

      autComp.onSelectItem(event);

      autFixture.detectChanges();
      flush();

      expect(autComp.model.value).toEqual(modelValue.display);
      expect(autComp.change.emit).toHaveBeenCalled();
    }));
  });
});

// declare a test component
@Component({
  selector: 'ds-test-cmp',
  template: ``
})
class TestComponent {
  group: FormGroup = AUT_TEST_GROUP;
  model = new DynamicAutocompleteModel(AUT_TEST_MODEL_CONFIG);
  showErrorMessages = false;
}


