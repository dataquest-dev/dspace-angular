import {ComponentFixture, inject, TestBed, waitForAsync} from '@angular/core/testing';
import {VocabularyServiceStub} from '../../../../../testing/vocabulary-service.stub';
import {DynamicFormLayoutService, DynamicFormsCoreModule, DynamicFormValidationService} from '@ng-dynamic-forms/core';
import {DynamicFormsNGBootstrapUIModule} from '@ng-dynamic-forms/ui-ng-bootstrap';
import {FormControl, FormGroup, FormsModule, ReactiveFormsModule} from '@angular/forms';
import {NgbModule} from '@ng-bootstrap/ng-bootstrap';
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
import {Observable} from 'rxjs';
import {RemoteData} from '../../../../../../core/data/remote-data';
import {Bitstream} from '../../../../../../core/shared/bitstream.model';
import {createSuccessfulRemoteDataObject$} from '../../../../../remote-data.utils';
import {PaginatedList} from '../../../../../../core/data/paginated-list.model';
import {MetadataValue} from '../../../../../../core/metadata/metadata-value.model';
import {Runtime} from 'inspector';

let AUT_TEST_GROUP;
let AUT_TEST_MODEL_CONFIG;

function init() {
  AUT_TEST_GROUP = new FormGroup({
    tag: new FormControl(),
  });

  AUT_TEST_MODEL_CONFIG = {
    // vocabularyOptions: {
    //   closed: false,
    //   name: 'common_iso_languages'
    // } as VocabularyOptions,
    disabled: false,
    id: 'tag',
    label: 'Keywords',
    minChars: 3,
    name: 'tag',
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
    const vocabularyServiceStub = new VocabularyServiceStub();
    // const mockMetadataValueService = {
    //   getThumbnailFor(item: MetadataValue): Observable<RemoteObject<MetadataValue>> {
    //     return createSuccessfulRemoteDataObject$(new MetadataValue());
    //   }
    // };
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
        { provide: MetadataValueDataService, useValue: {} },
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
      <ds-dynamic-tag [bindId]="bindId"
                      [group]="group"
                      [model]="model"
                      (blur)="onBlur($event)"
                      (change)="onValueChange($event)"
                      (focus)="onFocus($event)"></ds-dynamic-tag>`;

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
