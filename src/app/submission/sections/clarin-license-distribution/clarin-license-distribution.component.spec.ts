import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SubmissionSectionClarinLicenseDistributionComponent } from './clarin-license-distribution.component';
import {BrowserModule} from '@angular/platform-browser';
import {CommonModule} from '@angular/common';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {TranslateModule} from '@ngx-translate/core';
import {LicenseContractPageComponent} from '../../../license-contract-page/license-contract-page.component';
import {ActivatedRoute, Params} from '@angular/router';
import {CollectionDataService} from '../../../core/data/collection-data.service';
import {Collection} from '../../../core/shared/collection.model';
import {createSuccessfulRemoteDataObject$} from '../../../shared/remote-data.utils';
import {FormComponent} from '../../../shared/form/form.component';
import {SubmissionSectionLicenseComponent} from '../license/section-license.component';
import {SectionFormOperationsService} from '../form/section-form-operations.service';
import {getMockFormOperationsService} from '../../../shared/mocks/form-operations-service.mock';
import {FormService} from '../../../shared/form/form.service';
import {getMockFormService} from '../../../shared/mocks/form-service.mock';
import {JsonPatchOperationsBuilder} from '../../../core/json-patch/builder/json-patch-operations-builder';
import {SubmissionFormsConfigService} from '../../../core/config/submission-forms-config.service';
import {NotificationsService} from '../../../shared/notifications/notifications.service';
import {NotificationsServiceStub} from '../../../shared/testing/notifications-service.stub';
import {SectionsService} from '../sections.service';
import {SubmissionService} from '../../submission.service';
import {SubmissionServiceStub} from '../../../shared/testing/submission-service.stub';
import {ChangeDetectorRef, Component, NO_ERRORS_SCHEMA} from '@angular/core';
import {FormBuilderService} from '../../../shared/form/builder/form-builder.service';
import {SectionsServiceStub} from '../../../shared/testing/sections-service.stub';
import {mockSubmissionCollectionId, mockSubmissionId} from '../../../shared/mocks/submission.mock';
import {JsonPatchOperationPathCombiner} from '../../../core/json-patch/builder/json-patch-operation-path-combiner';
import {License} from '../../../core/shared/license.model';
import {SectionDataObject} from '../models/section-data.model';
import {SectionsType} from '../sections-type';
import {DynamicFormControlEvent, DynamicFormControlEventType} from '@ng-dynamic-forms/core';
import {ConfigurationDataService} from '../../../core/data/configuration-data.service';
import {of as observableOf, of} from 'rxjs';
import {createTestComponent} from '../../../shared/testing/utils.test';

const collectionId = mockSubmissionCollectionId;
const licenseText = 'License text';
const helpDeskMail = 'test@mail.com';
const mockCollection = Object.assign(new Collection(), {
  name: 'Community 1-Collection 1',
  id: collectionId,
  metadata: [
    {
      key: 'dc.title',
      language: 'en_US',
      value: 'Community 1-Collection 1'
    }],
  license: createSuccessfulRemoteDataObject$(Object.assign(new License(), { text: licenseText }))
});

function getMockSubmissionFormsConfigService(): SubmissionFormsConfigService {
  return jasmine.createSpyObj('FormOperationsService', {
    getConfigAll: jasmine.createSpy('getConfigAll'),
    getConfigByHref: jasmine.createSpy('getConfigByHref'),
    getConfigByName: jasmine.createSpy('getConfigByName'),
    getConfigBySearch: jasmine.createSpy('getConfigBySearch')
  });
}

const sectionObject: SectionDataObject = {
  config: 'https://dspace7.4science.it/or2018/api/config/submissionforms/license',
  mandatory: true,
  data: {
    url: null,
    acceptanceDate: null,
    granted: false
  },
  errorsToShow: [],
  serverValidationErrors: [],
  header: 'submit.progressbar.describe.license',
  id: 'license',
  sectionType: SectionsType.License
};

const dynamicFormControlEvent: DynamicFormControlEvent = {
  $event: new Event('change'),
  context: null,
  control: null,
  group: null,
  model: null,
  type: DynamicFormControlEventType.Change
};

describe('SubmissionSectionClarinLicenseDistributionComponent', () => {
  let component: SubmissionSectionClarinLicenseDistributionComponent;
  let fixture: ComponentFixture<SubmissionSectionClarinLicenseDistributionComponent>;

  const sectionsServiceStub: any = new SectionsServiceStub();
  const submissionId = mockSubmissionId;

  const pathCombiner = new JsonPatchOperationPathCombiner('sections', sectionObject.id);
  const jsonPatchOpBuilder: any = jasmine.createSpyObj('jsonPatchOpBuilder', {
    add: jasmine.createSpy('add'),
    replace: jasmine.createSpy('replace'),
    remove: jasmine.createSpy('remove'),
  });

  const mockCollectionDataService = jasmine.createSpyObj('CollectionDataService', {
    findById: jasmine.createSpy('findById'),
    findByHref: jasmine.createSpy('findByHref')
  });

  const configurationServiceSpy = jasmine.createSpyObj('configurationService', {
    findByPropertyName: of(helpDeskMail),
  });


  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        BrowserModule,
        CommonModule,
        FormsModule,
        ReactiveFormsModule,
        TranslateModule.forRoot()
      ],
      declarations: [
        FormComponent,
        SubmissionSectionClarinLicenseDistributionComponent,
        TestComponent
      ],
      providers: [
        { provide: CollectionDataService, useValue: mockCollectionDataService },
        { provide: SectionFormOperationsService, useValue: getMockFormOperationsService() },
        { provide: FormService, useValue: getMockFormService() },
        { provide: JsonPatchOperationsBuilder, useValue: jsonPatchOpBuilder },
        { provide: SubmissionFormsConfigService, useValue: getMockSubmissionFormsConfigService() },
        { provide: NotificationsService, useClass: NotificationsServiceStub },
        { provide: SectionsService, useValue: sectionsServiceStub },
        { provide: SubmissionService, useClass: SubmissionServiceStub },
        { provide: ConfigurationDataService, useValue: configurationServiceSpy },
        { provide: 'collectionIdProvider', useValue: collectionId },
        { provide: 'sectionDataProvider', useValue: Object.assign({}, sectionObject) },
        { provide: 'submissionIdProvider', useValue: submissionId },
        ChangeDetectorRef,
        FormBuilderService,
        SubmissionSectionLicenseComponent
      ],
      schemas: [NO_ERRORS_SCHEMA]
    })
    .compileComponents();
  });

  beforeEach(() => {
    mockCollectionDataService.findById.and.returnValue(createSuccessfulRemoteDataObject$(mockCollection));
    sectionsServiceStub.isSectionReadOnly.and.returnValue(observableOf(false));
    sectionsServiceStub.getSectionErrors.and.returnValue(observableOf([]));

    fixture = TestBed.createComponent(SubmissionSectionClarinLicenseDistributionComponent);
    component = fixture.componentInstance;
    // fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

// declare a test component
@Component({
  selector: 'ds-test-cmp',
  template: ``
})
class TestComponent {

}
