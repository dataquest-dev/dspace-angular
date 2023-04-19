import {ComponentFixture, TestBed, waitForAsync} from '@angular/core/testing';

import { SubmissionSectionClarinNoticeComponent } from './clarin-notice.component';
import {mockSubmissionCollectionId, mockSubmissionId} from '../../../shared/mocks/submission.mock';
import {Collection} from '../../../core/shared/collection.model';
import {createSuccessfulRemoteDataObject$} from '../../../shared/remote-data.utils';
import {License} from '../../../core/shared/license.model';
import {SectionDataObject} from '../models/section-data.model';
import {SectionsType} from '../sections-type';
import {SectionsServiceStub} from '../../../shared/testing/sections-service.stub';
import {BrowserModule} from '@angular/platform-browser';
import {CommonModule} from '@angular/common';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {TranslateModule} from '@ngx-translate/core';
import {FormComponent} from '../../../shared/form/form.component';
import {
  SubmissionSectionClarinLicenseDistributionComponent
} from '../clarin-license-distribution/clarin-license-distribution.component';
import {CollectionDataService} from '../../../core/data/collection-data.service';
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
import {ConfigurationDataService} from '../../../core/data/configuration-data.service';
import {ChangeDetectorRef, Component, NO_ERRORS_SCHEMA} from '@angular/core';
import {FormBuilderService} from '../../../shared/form/builder/form-builder.service';
import {SubmissionSectionLicenseComponent} from '../license/section-license.component';
import {of} from 'rxjs';
import {DSONameService} from '../../../core/breadcrumbs/dso-name.service';
import {DSONameServiceMock} from '../../../shared/mocks/dso-name.service.mock';

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

const sectionObject: SectionDataObject = {
  config: 'https://dspace7.4science.it/or2018/api/config/submissionforms/clarin-notice',
  mandatory: true,
  data: {
    url: null,
    acceptanceDate: null,
    granted: false
  },
  errorsToShow: [],
  serverValidationErrors: [],
  header: 'submit.progressbar.describe.clarin-notice',
  id: 'license',
  sectionType: SectionsType.clarinNotice
};
describe('SubmissionSectionClarinNoticeComponent', () => {
  let component: SubmissionSectionClarinNoticeComponent;
  let fixture: ComponentFixture<SubmissionSectionClarinNoticeComponent>;

  const sectionsServiceStub: any = new SectionsServiceStub();
  const submissionId = mockSubmissionId;

  const mockCollectionDataService = jasmine.createSpyObj('CollectionDataService', {
    findById: createSuccessfulRemoteDataObject$(mockCollection),
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
        SubmissionSectionClarinNoticeComponent,
        TestComponent
      ],
      providers: [
        { provide: CollectionDataService, useValue: mockCollectionDataService },
        { provide: SectionsService, useValue: sectionsServiceStub },
        { provide: DSONameService, useClass: DSONameServiceMock },
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
    fixture = TestBed.createComponent(SubmissionSectionClarinNoticeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
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
