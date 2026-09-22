import { CommonModule } from '@angular/common';
import {
  ChangeDetectorRef,
  Component,
  NO_ERRORS_SCHEMA,
} from '@angular/core';
import {
  ComponentFixture,
  inject,
  TestBed,
  waitForAsync,
} from '@angular/core/testing';
import {
  FormsModule,
  ReactiveFormsModule,
} from '@angular/forms';
import { By } from '@angular/platform-browser';
import { NgbCollapseConfig } from '@ng-bootstrap/ng-bootstrap';
import { TranslateModule } from '@ngx-translate/core';
import { of } from 'rxjs';
import { SubmissionFormsConfigDataService } from 'src/app/core/config/submission-forms-config-data.service';

import { RemoteDataBuildService } from '../../../core/cache/builders/remote-data-build.service';
import { ClarinLicenseDataService } from '../../../core/data/clarin/clarin-license-data.service';
import { CollectionDataService } from '../../../core/data/collection-data.service';
import { ConfigurationDataService } from '../../../core/data/configuration-data.service';
import { ItemDataService } from '../../../core/data/item-data.service';
import { buildPaginatedList } from '../../../core/data/paginated-list.model';
import { PatchRequest } from '../../../core/data/request.models';
import { RequestService } from '../../../core/data/request.service';
import { JsonPatchOperationPathCombiner } from '../../../core/json-patch/builder/json-patch-operation-path-combiner';
import { JsonPatchOperationsBuilder } from '../../../core/json-patch/builder/json-patch-operations-builder';
import { Collection } from '../../../core/shared/collection.model';
import { License } from '../../../core/shared/license.model';
import { PageInfo } from '../../../core/shared/page-info.model';
import { FormBuilderService } from '../../../shared/form/builder/form-builder.service';
import { FormComponent } from '../../../shared/form/form.component';
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
import {
  createPaginatedList,
  createTestComponent,
} from '../../../shared/testing/utils.test';
import { SubmissionService } from '../../submission.service';
import { SectionFormOperationsService } from '../form/section-form-operations.service';
import { SectionDataObject } from '../models/section-data.model';
import { SectionsService } from '../sections.service';
import { SectionsType } from '../sections-type';
import { SubmissionSectionClarinLicenseComponent } from './section-license.component';

const collectionId = mockSubmissionCollectionId;
const submissionId = mockSubmissionId;
const licenseText = 'License text';
const helpDeskMail = 'help@desk.mail';
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

function getMockSubmissionFormsConfigService(): SubmissionFormsConfigDataService {
  return jasmine.createSpyObj('FormOperationsService', {
    getConfigAll: jasmine.createSpy('getConfigAll'),
    getConfigByHref: jasmine.createSpy('getConfigByHref'),
    getConfigByName: jasmine.createSpy('getConfigByName'),
    getConfigBySearch: jasmine.createSpy('getConfigBySearch'),
  });
}

const sectionObject: SectionDataObject = {
  config: 'https://dspace7.4science.it/or2018/api/config/submissionforms/license',
  mandatory: true,
  data: {},
  errorsToShow: [],
  serverValidationErrors: [],
  header: 'submit.progressbar.describe.license',
  id: 'license',
  sectionType: SectionsType.License,
};

describe('SubmissionSectionClarinLicenseComponent', () => {

  const jsonPatchOpBuilder: any = jasmine.createSpyObj('operationsBuilder', {
    add: undefined,
    replace: undefined,
    remove: undefined,
  });

  const sectionsServiceStub = new SectionsServiceStub();

  const mockClarinDataService = jasmine.createSpyObj('ClarinDataService', {
    searchBy: jasmine.createSpy('searchBy'),
    findAll: jasmine.createSpy('findAll'),
  });

  const mockItemDataService = jasmine.createSpyObj('ItemDataService', {
    findByHref: jasmine.createSpy('findByHref'),
  });

  const mockRdbService = jasmine.createSpyObj('RemoteDataBuildService', {
    buildFromRequestUUID: jasmine.createSpy('buildFromRequestUUID'),
  });

  const configurationServiceSpy = jasmine.createSpyObj('configurationService', {
    findByPropertyName: of(helpDeskMail),
  });

  const mockRequestService = jasmine.createSpyObj('RequestService', {
    generateRequestId: jasmine.createSpy('generateRequestId'),
    send: jasmine.createSpy('send'),
  });

  const mockCollectionDataService = jasmine.createSpyObj('CollectionDataService', {
    findById: jasmine.createSpy('findById'),
    findByHref: jasmine.createSpy('findByHref'),
  });

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [
        CommonModule,
        FormsModule,
        ReactiveFormsModule,
        TranslateModule.forRoot(),
        FormComponent,
        SubmissionSectionClarinLicenseComponent,
        TestComponent,
      ],
      providers: [
        { provide: SectionFormOperationsService, useValue: getMockFormOperationsService() },
        { provide: FormService, useValue: getMockFormService() },
        { provide: JsonPatchOperationsBuilder, useValue: jsonPatchOpBuilder },
        { provide: SubmissionFormsConfigDataService, useValue: getMockSubmissionFormsConfigService() },
        { provide: NotificationsService, useClass: NotificationsServiceStub },
        { provide: SectionsService, useValue: sectionsServiceStub },
        { provide: SubmissionService, useClass: SubmissionServiceStub },
        { provide: CollectionDataService, useValue: mockCollectionDataService },
        { provide: ClarinLicenseDataService, useValue: mockClarinDataService },
        { provide: ItemDataService, useValue: mockItemDataService },
        { provide: RemoteDataBuildService, useValue: mockRdbService },
        { provide: ConfigurationDataService, useValue: configurationServiceSpy },
        { provide: RequestService, useValue: mockRequestService },
        { provide: 'collectionIdProvider', useValue: collectionId },
        { provide: 'sectionDataProvider', useValue: Object.assign({}, sectionObject) },
        { provide: 'submissionIdProvider', useValue: submissionId },
        ChangeDetectorRef,
        FormBuilderService,
        SubmissionSectionClarinLicenseComponent,
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents().then();
  }));

  describe('', () => {
    let testComp: TestComponent;
    let testFixture: ComponentFixture<TestComponent>;

    // synchronous beforeEach
    beforeEach(() => {
      mockCollectionDataService.findById.and.returnValue(createSuccessfulRemoteDataObject$(mockCollection));
      sectionsServiceStub.isSectionReadOnly.and.returnValue(of(false));
      sectionsServiceStub.getSectionErrors.and.returnValue(of([]));

      const html = `
        <ds-submission-section-license></ds-submission-section-license>`;

      testFixture = createTestComponent(html, TestComponent) as ComponentFixture<TestComponent>;
      testComp = testFixture.componentInstance;
    });

    afterEach(() => {
      testFixture.destroy();
    });

    it('should create ClarinSubmissionSectionLicenseComponent', inject([SubmissionSectionClarinLicenseComponent], (app: SubmissionSectionClarinLicenseComponent) => {
      expect(app).toBeDefined();
    }));

    it('sendRequest should PATCH the submission object self link (route-aware, works for workflow items)',
      inject([SubmissionSectionClarinLicenseComponent], (app: SubmissionSectionClarinLicenseComponent) => {
        // Arrange: enable validation flow so sendRequest actually executes
        (app as any).couldShowValidationErrors = true;
        (app as any).sectionData = { id: 'clarin-license' } as any;
        (app as any).pathCombiner = new JsonPatchOperationPathCombiner('sections', 'clarin-license');

        const wsiId = 42;
        const selfHref = 'http://localhost/api/submission/workspaceitems/' + wsiId;

        // The component now resolves the current submission object and PATCHes its
        // self link directly, so stub getActualSubmissionItem with a succeeded
        // RemoteData exposing _links.self.href.
        spyOn(app as any, 'getActualSubmissionItem').and.returnValue(
          Promise.resolve({ hasSucceeded: true, payload: { _links: { self: { href: selfHref } } } }),
        );
        spyOn(app as any, 'updateSectionStatus').and.callFake(() => undefined);

        mockRequestService.generateRequestId.and.returnValue('req-id-1');
        mockRequestService.send.calls.reset();
        mockRdbService.buildFromRequestUUID.and.returnValue(of({ payload: { sections: {}, errors: [] } } as any));

        // Act
        return (app as any).sendRequest('My CLARIN License').then(() => {
          // Assert
          expect(mockRequestService.send).toHaveBeenCalledTimes(1);
          const sentRequest = mockRequestService.send.calls.mostRecent().args[0] as PatchRequest;
          expect(sentRequest.href).toBe(selfHref);
          const body: any[] = (sentRequest as any).body;
          expect(body.length).toBe(1);
          expect(body[0].op).toBe('replace');
          expect(body[0].path).toBe('/sections/clarin-license/select');
          expect(body[0].value).toBe('My CLARIN License');
        });
      }));
  });

  describe('license more details', () => {
    let fixture: ComponentFixture<SubmissionSectionClarinLicenseComponent>;
    let style: HTMLStyleElement;

    const details = (): HTMLElement =>
      fixture.nativeElement.querySelector('#aspect_submission_StepTransformer_list_accordion-body_lic_1');
    const toggle = (): HTMLElement => fixture.nativeElement.querySelector('.accordion-heading a');
    const isVisible = (el: HTMLElement): boolean => getComputedStyle(el).display !== 'none';

    beforeEach(() => {
      // Verbatim from node_modules/bootstrap/dist/css/bootstrap.css; the karma target lists the theme
      // with `inject: false`, so without it everything measures as visible.
      style = document.createElement('style');
      style.textContent = '.collapse:not(.show) { display: none; }';
      document.head.appendChild(style);

      TestBed.inject(NgbCollapseConfig).animation = false;

      mockClarinDataService.findAll = jasmine.createSpy('findAll')
        .and.returnValue(createSuccessfulRemoteDataObject$(createPaginatedList([])));
      sectionsServiceStub.isSectionReadOnly.and.returnValue(of(false));
      sectionsServiceStub.getSectionErrors.and.returnValue(of([]));
      // an unstubbed retrieveSubmission returns undefined, and the .pipe() on it rejects inside the
      // component's async ngOnInit, which wedges the whole karma run rather than failing a spec
      (TestBed.inject(SubmissionService) as any).retrieveSubmission.and.returnValue(
        createSuccessfulRemoteDataObject$({ _links: { self: { href: 'self' } } }),
      );

      fixture = TestBed.createComponent(SubmissionSectionClarinLicenseComponent);
      fixture.detectChanges();
    });

    afterEach(() => {
      style.remove();
      fixture.destroy();
    });

    // One spec, not two: a second TestBed.createComponent of this component in the same run never
    // settles (the browser disconnects after 30 s), so the whole open/close path is asserted here.
    it('keeps the details list hidden and opens it when the heading is clicked', () => {
      expect(toggle()).withContext('the more-details control did not render').not.toBeNull();
      expect(details()).withContext('the more-details list did not render').not.toBeNull();
      expect(isVisible(details()))
        .withContext('details list is visible before any click')
        .toBeFalse();
      expect(toggle().getAttribute('aria-expanded')).toEqual('false');

      toggle().click();
      fixture.detectChanges();

      expect(isVisible(details()))
        .withContext(`details list stayed hidden: display=${getComputedStyle(details()).display}`)
        .toBeTrue();
      expect(toggle().getAttribute('aria-expanded')).toEqual('true');
    });

    it('opens the details list from the keyboard', () => {
      expect(toggle().getAttribute('tabindex'))
        .withContext('the more-details control is not reachable with Tab')
        .toEqual('0');

      toggle().dispatchEvent(new KeyboardEvent('keyup', { key: 'Enter', bubbles: true }));
      fixture.detectChanges();

      expect(isVisible(details()))
        .withContext('Enter on the more-details control did not open the list')
        .toBeTrue();
    });

    it('still renders as a control and not as plain text', () => {
      // Bootstrap's reboot greys out a:not([href]):not([class]) and leaves it no pointer cursor,
      // so the toggle has to keep one of the two.
      expect(toggle().matches('a:not([href]):not([class])'))
        .withContext(`the more-details control falls under Bootstrap's reboot: ${toggle().outerHTML.slice(0, 120)}`)
        .toBeFalse();
    });
  });

  describe('license selector button', () => {
    const triggerId = 'license-text';

    afterEach(() => {
      document.getElementById(triggerId)?.remove();
    });

    it('opens the license selector by clicking the trigger the license-selector script appends to the body',
      inject([SubmissionSectionClarinLicenseComponent], (app: SubmissionSectionClarinLicenseComponent) => {
        const trigger = document.createElement('a');
        trigger.id = triggerId;
        document.body.appendChild(trigger);
        const triggerClick = spyOn(trigger, 'click');

        app.clickLicense();

        expect(triggerClick).toHaveBeenCalledTimes(1);
      }));

    it('does not throw when the license selector trigger is not in the DOM',
      inject([SubmissionSectionClarinLicenseComponent], (app: SubmissionSectionClarinLicenseComponent) => {
        document.getElementById(triggerId)?.remove();

        expect(() => app.clickLicense()).not.toThrow();
      }));

    it('calls clickLicense from the license selector button in the template', () => {
      mockClarinDataService.findAll.and.returnValue(
        createSuccessfulRemoteDataObject$(buildPaginatedList(new PageInfo(), [])));
      sectionsServiceStub.isSectionReadOnly.and.returnValue(of(false));
      sectionsServiceStub.getSectionErrors.and.returnValue(of([]));

      const fixture = TestBed.createComponent(SubmissionSectionClarinLicenseComponent);
      fixture.detectChanges();
      const clickLicense = spyOn(fixture.componentInstance, 'clickLicense');

      fixture.debugElement.query(By.css('#button-holder')).nativeElement.click();

      expect(clickLicense).toHaveBeenCalledTimes(1);
    });
  });
});

// declare a test component
@Component({
  selector: 'ds-test-cmp',
  template: ``,
  imports: [
    FormsModule,
    ReactiveFormsModule,
  ],
})
class TestComponent {

}
