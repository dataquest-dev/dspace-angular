import {
  ComponentFixture,
  TestBed,
} from '@angular/core/testing';
import { TranslateModule } from '@ngx-translate/core';
import {
  firstValueFrom,
  of,
} from 'rxjs';

import { DSONameService } from '../../../core/breadcrumbs/dso-name.service';
import { CollectionDataService } from '../../../core/data/collection-data.service';
import { ConfigurationDataService } from '../../../core/data/configuration-data.service';
import { Collection } from '../../../core/shared/collection.model';
import { License } from '../../../core/shared/license.model';
import { DSONameServiceMock } from '../../../shared/mocks/dso-name.service.mock';
import {
  mockSubmissionCollectionId,
  mockSubmissionId,
} from '../../../shared/mocks/submission.mock';
import { createSuccessfulRemoteDataObject$ } from '../../../shared/remote-data.utils';
import { SectionsServiceStub } from '../../../shared/testing/sections-service.stub';
import { SectionDataObject } from '../models/section-data.model';
import { SectionsService } from '../sections.service';
import { SectionsType } from '../sections-type';
import { SubmissionSectionClarinNoticeComponent } from './clarin-notice.component';

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
  config: 'https://dspace7.4science.it/or2018/api/config/submissionforms/clarin-notice',
  mandatory: true,
  data: {
    url: null,
    acceptanceDate: null,
    granted: false,
  },
  errorsToShow: [],
  serverValidationErrors: [],
  header: 'submit.progressbar.describe.clarin-notice',
  id: 'license',
  sectionType: SectionsType.clarinNotice,
};

describe('SubmissionSectionClarinNoticeComponent', () => {
  let component: SubmissionSectionClarinNoticeComponent;
  let fixture: ComponentFixture<SubmissionSectionClarinNoticeComponent>;

  const sectionsServiceStub: any = new SectionsServiceStub();
  const submissionId = mockSubmissionId;

  const mockCollectionDataService = jasmine.createSpyObj('CollectionDataService', {
    findById: createSuccessfulRemoteDataObject$(mockCollection),
    findByHref: jasmine.createSpy('findByHref'),
  });

  const configurationServiceSpy = jasmine.createSpyObj('configurationService', {
    findByPropertyName: of(helpDeskMail),
  });

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        SubmissionSectionClarinNoticeComponent,
        TranslateModule.forRoot(),
      ],
      providers: [
        { provide: CollectionDataService, useValue: mockCollectionDataService },
        { provide: SectionsService, useValue: sectionsServiceStub },
        { provide: DSONameService, useClass: DSONameServiceMock },
        { provide: ConfigurationDataService, useValue: configurationServiceSpy },
        { provide: 'collectionIdProvider', useValue: collectionId },
        { provide: 'sectionDataProvider', useValue: Object.assign({}, sectionObject) },
        { provide: 'submissionIdProvider', useValue: submissionId },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(SubmissionSectionClarinNoticeComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should show the collection the submission belongs to', () => {
    (component as any).onSectionInit();

    expect(mockCollectionDataService.findById).toHaveBeenCalledWith(collectionId);
    expect(component.collectionName.value).toEqual('Community 1-Collection 1');
  });

  it('should load the help desk address', () => {
    (component as any).onSectionInit();

    expect(configurationServiceSpy.findByPropertyName).toHaveBeenCalledWith('lr.help.mail');
    expect(component.helpDesk$).toBeTruthy();
  });

  it('should report the section as incomplete until the notice is accepted', async () => {
    component.toggleAcceptation.value = false;

    await expectAsync(firstValueFrom((component as any).getSectionStatus())).toBeResolvedTo(false);
  });

  it('should report the section as complete once the notice is accepted', async () => {
    component.toggleAcceptation.value = true;

    await expectAsync(firstValueFrom((component as any).getSectionStatus())).toBeResolvedTo(true);
  });
});
