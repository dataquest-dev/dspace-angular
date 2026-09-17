import { ChangeDetectorRef } from '@angular/core';
import {
  ComponentFixture,
  TestBed,
} from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { of } from 'rxjs';

import { CollectionDataService } from '../../../core/data/collection-data.service';
import { ConfigurationDataService } from '../../../core/data/configuration-data.service';
import { JsonPatchOperationPathCombiner } from '../../../core/json-patch/builder/json-patch-operation-path-combiner';
import { JsonPatchOperationsBuilder } from '../../../core/json-patch/builder/json-patch-operations-builder';
import { Collection } from '../../../core/shared/collection.model';
import { License } from '../../../core/shared/license.model';
import { FormBuilderService } from '../../../shared/form/builder/form-builder.service';
import { FormService } from '../../../shared/form/form.service';
import { getMockFormOperationsService } from '../../../shared/mocks/form-operations-service.mock';
import { getMockFormService } from '../../../shared/mocks/form-service.mock';
import {
  mockSubmissionCollectionId,
  mockSubmissionId,
} from '../../../shared/mocks/submission.mock';
import { NotificationsService } from '../../../shared/notifications/notifications.service';
import { createSuccessfulRemoteDataObject$ } from '../../../shared/remote-data.utils';
import { NotificationsServiceStub } from '../../../shared/testing/notifications-service.stub';
import { SectionsServiceStub } from '../../../shared/testing/sections-service.stub';
import { SubmissionServiceStub } from '../../../shared/testing/submission-service.stub';
import { SubmissionService } from '../../submission.service';
import { SectionFormOperationsService } from '../form/section-form-operations.service';
import { SectionDataObject } from '../models/section-data.model';
import { SectionsService } from '../sections.service';
import { SectionsType } from '../sections-type';
import { SubmissionSectionClarinLicenseDistributionComponent } from './clarin-license-distribution.component';

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
      value: 'Community 1-Collection 1',
    }],
  license: createSuccessfulRemoteDataObject$(Object.assign(new License(), { text: licenseText })),
});

const sectionObject: SectionDataObject = {
  config: 'https://dspace7.4science.it/or2018/api/config/submissionforms/license',
  mandatory: true,
  data: {
    url: null,
    acceptanceDate: null,
    granted: false,
  },
  errorsToShow: [],
  serverValidationErrors: [],
  header: 'submit.progressbar.describe.license',
  id: 'license',
  sectionType: SectionsType.License,
};

describe('SubmissionSectionClarinLicenseDistributionComponent', () => {
  let component: SubmissionSectionClarinLicenseDistributionComponent;
  let fixture: ComponentFixture<SubmissionSectionClarinLicenseDistributionComponent>;

  const sectionsServiceStub: any = new SectionsServiceStub();
  const submissionId = mockSubmissionId;

  const jsonPatchOpBuilder: any = jasmine.createSpyObj('jsonPatchOpBuilder', {
    add: jasmine.createSpy('add'),
    replace: jasmine.createSpy('replace'),
    remove: jasmine.createSpy('remove'),
  });

  const mockCollectionDataService = jasmine.createSpyObj('CollectionDataService', {
    findById: jasmine.createSpy('findById'),
    findByHref: jasmine.createSpy('findByHref'),
  });

  const configurationServiceSpy = jasmine.createSpyObj('configurationService', {
    findByPropertyName: of(helpDeskMail),
  });

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        SubmissionSectionClarinLicenseDistributionComponent,
        TranslateModule.forRoot(),
      ],
      providers: [
        { provide: CollectionDataService, useValue: mockCollectionDataService },
        { provide: SectionFormOperationsService, useValue: getMockFormOperationsService() },
        { provide: FormService, useValue: getMockFormService() },
        { provide: JsonPatchOperationsBuilder, useValue: jsonPatchOpBuilder },
        { provide: NotificationsService, useClass: NotificationsServiceStub },
        { provide: SectionsService, useValue: sectionsServiceStub },
        { provide: SubmissionService, useClass: SubmissionServiceStub },
        { provide: ConfigurationDataService, useValue: configurationServiceSpy },
        { provide: 'collectionIdProvider', useValue: collectionId },
        { provide: 'sectionDataProvider', useValue: Object.assign({}, sectionObject) },
        { provide: 'submissionIdProvider', useValue: submissionId },
        ChangeDetectorRef,
        FormBuilderService,
        provideRouter([]),
      ],
    }).compileComponents();

    mockCollectionDataService.findById.and.returnValue(createSuccessfulRemoteDataObject$(mockCollection));
    sectionsServiceStub.isSectionReadOnly.and.returnValue(of(false));
    sectionsServiceStub.getSectionErrors.and.returnValue(of([]));

    fixture = TestBed.createComponent(SubmissionSectionClarinLicenseDistributionComponent);
    component = fixture.componentInstance;

    jsonPatchOpBuilder.add.calls.reset();
    jsonPatchOpBuilder.remove.calls.reset();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('changeToNotInit', () => {
    it('should clear the init flag on the first toggle', () => {
      component.isInit = true;

      component.changeToNotInit();

      expect(component.isInit).toBeFalse();
    });

    it('should stop swallowing changes once the user has touched the toggle', () => {
      (component as any).pathCombiner = new JsonPatchOperationPathCombiner('sections', sectionObject.id);
      component.toggleAcceptation = { value: true } as any;
      spyOn(component as any, 'updateSectionStatus');
      component.isInit = true;

      component.changeToNotInit();
      component.onChange({});

      expect(jsonPatchOpBuilder.add).toHaveBeenCalled();
    });
  });

  describe('onChange', () => {
    beforeEach(() => {
      (component as any).pathCombiner = new JsonPatchOperationPathCombiner('sections', sectionObject.id);
      component.toggleAcceptation = { value: true } as any;
      component.isInit = false;
      spyOn(component as any, 'updateSectionStatus');
    });

    it('should ignore a null change event', () => {
      component.onChange(null);

      expect(jsonPatchOpBuilder.add).not.toHaveBeenCalled();
      expect(jsonPatchOpBuilder.remove).not.toHaveBeenCalled();
    });

    it('should swallow the change the toggle fires while initialising', () => {
      component.isInit = true;

      component.onChange({});

      expect(component.isInit).toBeFalse();
      expect(jsonPatchOpBuilder.add).not.toHaveBeenCalled();
    });

    it('should patch the granted flag when the licence is accepted', () => {
      component.onChange({});

      expect(jsonPatchOpBuilder.add).toHaveBeenCalledWith(
        jasmine.objectContaining({ path: '/sections/license/granted' }), 'true', false, true);
    });

    it('should remove the granted patch when the toggle has no value', () => {
      component.toggleAcceptation = {} as any;

      component.onChange({});

      expect(jsonPatchOpBuilder.remove).toHaveBeenCalled();
      expect(jsonPatchOpBuilder.add).not.toHaveBeenCalled();
    });
  });
});
