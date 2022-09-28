import {ChangeDetectorRef, Component, ElementRef, EventEmitter, Inject, Output, ViewChild} from '@angular/core';
import {
  DynamicCheckboxModel,
  DynamicFormControlEvent,
  DynamicFormControlModel,
  DynamicFormLayout
} from '@ng-dynamic-forms/core';

import {of, Observable, Subscription } from 'rxjs';
import { CollectionDataService } from '../../../core/data/collection-data.service';
import { JsonPatchOperationPathCombiner } from '../../../core/json-patch/builder/json-patch-operation-path-combiner';
import { JsonPatchOperationsBuilder } from '../../../core/json-patch/builder/json-patch-operations-builder';
import {hasValue, isNotEmpty, isNotNull, isNotUndefined} from '../../../shared/empty.util';
import { FormBuilderService } from '../../../shared/form/builder/form-builder.service';
import { FormService } from '../../../shared/form/form.service';
import { SubmissionService } from '../../submission.service';
import { SectionFormOperationsService } from '../form/section-form-operations.service';
import { SectionDataObject } from '../models/section-data.model';
import { SectionModelComponent } from '../models/section.model';
import { renderSectionFor } from '../sections-decorator';
import { SectionsType } from '../sections-type';
import { SectionsService } from '../sections.service';
import { SECTION_LICENSE_FORM_LAYOUT } from './section-license.model';
import {RequestService} from '../../../core/data/request.service';
import {PatchRequest} from '../../../core/data/request.models';
import {Operation} from 'fast-json-patch';
import {ClarinLicenseDataService} from '../../../core/data/clarin/clarin-license-data.service';
import {ClarinLicense} from '../../../core/shared/clarin/clarin-license.model';
import {HALLink} from '../../../core/shared/hal-link.model';
import {getFirstCompletedRemoteData, getFirstSucceededRemoteData} from '../../../core/shared/operators';
import {distinctUntilChanged, filter, find, map, take} from 'rxjs/operators';
import {HALEndpointService} from '../../../core/shared/hal-endpoint.service';
import {RemoteDataBuildService} from '../../../core/cache/builders/remote-data-build.service';
import {WorkspaceitemDataService} from '../../../core/submission/workspaceitem-data.service';
import {FormFieldMetadataValueObject} from '../../../shared/form/builder/models/form-field-metadata-value.model';
import {RemoteData} from '../../../core/data/remote-data';
import {State} from '@ngrx/store';
import {RequestEntryState} from '../../../core/data/request.reducer';
import {WorkspaceitemSectionsObject} from '../../../core/submission/models/workspaceitem-sections.model';
import {SubmissionSectionError} from '../../objects/submission-objects.reducer';
import parseSectionErrors from '../../utils/parseSectionErrors';
import {normalizeSectionData} from '../../../core/submission/submission-response-parsing.service';

interface licenseacceptbutton {
  handleColor: string|null;
  handleOnColor: string|null;
  handleOffColor: string|null;
  onColor: string;
  offColor: string;
  onText: string;
  offText: string;
  disabled: boolean;
  size: 'sm' | 'lg' | '';
  value: boolean;
}

/**
 * This component represents a section that contains the submission license form.
 */

@Component({
  selector: 'ds-submission-section-clarin-license',
  styleUrls: ['./section-license.component.scss'],
  templateUrl: './section-license.component.html',
})
@renderSectionFor(SectionsType.clarinLicense)
export class SubmissionSectionClarinLicenseComponent extends SectionModelComponent {

  toggleAcceptation: licenseacceptbutton = {
    handleColor: 'dark',
    handleOnColor: 'danger',
    handleOffColor: 'info',
    onColor: 'success',
    offColor: 'danger',
    onText: 'license accepted',
    offText: 'click to accept license',
    disabled: false,
    size: 'sm',
    value: false
  };

  private selectedLicenseDefinition = '';

  private status: boolean;

  /**
   * The form id
   * @type {string}
   */
  public formId: string;

  /**
   * The form toggleAcceptation
   * @type {DynamicFormControlModel[]}
   */
  public formModel: DynamicFormControlModel[];

  /**
   * The [[DynamicFormLayout]] object
   * @type {DynamicFormLayout}
   */
  public formLayout: DynamicFormLayout = SECTION_LICENSE_FORM_LAYOUT;

  /**
   * A boolean representing if to show form submit and cancel buttons
   * @type {boolean}
   */
  public displaySubmit = false;

  /**
   * The submission license text
   * @type {Array}
   */
  public licenseText$: Observable<string>;

  /**
   * The [[JsonPatchOperationPathCombiner]] object
   * @type {JsonPatchOperationPathCombiner}
   */
  protected pathCombiner: JsonPatchOperationPathCombiner;

  /**
   * Array to track all subscriptions and unsubscribe them onDestroy
   * @type {Array}
   */
  protected subs: Subscription[] = [];


  /**
   * The FormComponent reference
   */

  /**
   * Initialize instance variables
   *
   * @param {ChangeDetectorRef} changeDetectorRef
   * @param {CollectionDataService} collectionDataService
   * @param clarinLicenseService
   * @param requestService
   * @param {FormBuilderService} formBuilderService
   * @param {SectionFormOperationsService} formOperationsService
   * @param {FormService} formService
   * @param {JsonPatchOperationsBuilder} operationsBuilder
   * @param {SectionsService} sectionService
   * @param {SubmissionService} submissionService
   * @param {string} injectedCollectionId
   * @param {SectionDataObject} injectedSectionData
   * @param {string} injectedSubmissionId
   */
  constructor(protected changeDetectorRef: ChangeDetectorRef,
              protected collectionDataService: CollectionDataService,
              protected clarinLicenseService: ClarinLicenseDataService,
              protected workspaceItemService: WorkspaceitemDataService,
              protected halService: HALEndpointService,
              protected rdbService: RemoteDataBuildService,
              protected requestService: RequestService,
              protected formBuilderService: FormBuilderService,
              protected formOperationsService: SectionFormOperationsService,
              protected formService: FormService,
              protected operationsBuilder: JsonPatchOperationsBuilder,
              protected sectionService: SectionsService,
              protected submissionService: SubmissionService,
              @Inject('collectionIdProvider') public injectedCollectionId: string,
              @Inject('sectionDataProvider') public injectedSectionData: SectionDataObject,
              @Inject('submissionIdProvider') public injectedSubmissionId: string) {
    super(injectedCollectionId, injectedSectionData, injectedSubmissionId);
  }

  @ViewChild('abc') el: ElementRef;

  /**
   * Initialize all instance variables and retrieve submission license
   */
  onSectionInit() {
    // todo set from backend
    // this.toggleAcceptation.value = accepted distrubution
    // id = license id from html select options
    // use '' for not selected
    this.subs.push(
      this.sectionService.getSectionErrors(this.submissionId, this.sectionData.id).pipe(
        filter((errors) => isNotEmpty(errors)),
        distinctUntilChanged())
        .subscribe((errors) => {
          // parse errors
          const newErrors = errors.map((error) => {
            // When the error path is only on the section,
            // replace it with the path to the form field to display error also on the form
            if (error.path === '/sections/clarin-license') {
              // check whether license is not accepted
            } else {
              return error;
            }
          }).filter((error) => isNotNull(error));

          if (isNotUndefined(newErrors) && isNotEmpty(newErrors)) {
            // this.sectionService.checkSectionErrors(this.submissionId, this.sectionData.id, this.formId, newErrors);
            this.sectionData.errors = errors;
          } else {
            // Remove any section's errors
            this.sectionService.dispatchRemoveSectionErrors(this.submissionId, this.sectionData.id);
          }
          this.changeDetectorRef.detectChanges();
        })
    );
    // '' = not selected
    let id = '';
    this.toggleAcceptation.value = false;

    (document.getElementById('aspect_submission_StepTransformer_field_license') as HTMLSelectElement).value = id;
    // if ever we needed to move button. Now just click event is redirected
    // $('#license-text').css('display', 'inline').appendTo('#button-holder');
  }

  /**
   * Get section status
   *
   * @return Observable<boolean>
   *     the section status
   */
  protected getSectionStatus(): Observable<boolean> {
    return of(this.status);
  }

  /**
   * Method called when a form dfChange event is fired.
   * Dispatch form operations based on changes.
   */
  onChange(event: any) {
    let selectedLicenseId: string;
    if (this.el == undefined) {
      this.status = false;
      return;
    }
      selectedLicenseId = this.el.nativeElement.value
    let selectedLicense: boolean = false;
    selectedLicense = selectedLicenseId.trim().length != 0
    this.status = this.toggleAcceptation.value && selectedLicense;

    // is any license selected - create method
    // set status method
    //

    this.updateSectionStatus();
    if (selectedLicense) {
      if (this.el.nativeElement == undefined) {
        return;
      }
      let licenseLabel:string;
      let options = this.el.nativeElement.children
      for (let i = 0; i < options.length; i++) {
        if (options[i].value == selectedLicenseId) {
          licenseLabel = options[i].label
        }
      }

      this.selectedLicenseDefinition = licenseLabel;
      console.log('licenseLabel', licenseLabel);
      console.log('selectedLicense', selectedLicense);

      //
      // this.formOperationsService.dispatchOperationsFromEvent(
      //   this.pathCombiner,
      //   event,
      //   this.previousValue,
      //   this.hasStoredValue(this.formBuilderService.getId(event.toggleAcceptation), this.formOperationsService.getArrayIndexFromEvent(event)));
      // const metadata = this.formOperationsService.getFieldPathSegmentedFromChangeEvent(event);
      // const value = this.formOperationsService.getFieldValueFromChangeEvent(event);

      // console.log('change');
      //
      // this.sectionService.updateSectionData(this.submissionId, this.sectionData.id, Object.assign({}, {}, {}));
      // this.submissionService.dispatchSaveSection(this.submissionId, this.sectionData.id);

      // todo to sent Backend.
      // Accepted = this.toggleAcceptation.value.
      // License: licenseLabel
    }
  }

  // change() {
  // //   this.onChange(null);
  // //   this.sectionService.updateSectionData(this.submissionId, this.sectionData.id, "x");
  // }

  /**
   * Unsubscribe from all subscriptions
   */
  onSectionDestroy() {
    this.subs
      .filter((subscription) => hasValue(subscription))
      .forEach((subscription) => subscription.unsubscribe());
  }

  clickLicense() {
    document.getElementById('license-text').click();
  }

  sendRequest(event) {
    // this.pathCombiner = new JsonPatchOperationPathCombiner('sections', this.sectionData.id);
    console.log('sending patch request');
    const clarinLicense = Object.assign(new ClarinLicense(), {
      id: 1,
      name: 'fff',
      value: 'sdsdd',
      confirmation: 0,
      requiredInfo: 'NAME',
      _links: {
        self: 'http://localhost:8080/server/api/core/clarinlicenses/1'
      }
    });
    // const patchOperation = {
    //   op: 'replace', path: '1', value: clarinLicense
    // } as Operation;

    console.log('toggleAcceptation value', this.toggleAcceptation);
    console.log('event', event);
    // this.submissionService.dispatchSave(this.submissionId, true);
    // dispatch save to show validation errors in the section-form (traditionalpageone)
    this.workspaceItemService.findById(this.submissionId)
      .pipe(getFirstCompletedRemoteData())
      .subscribe(res => {

        const requestId = this.requestService.generateRequestId();
        const hrefObs = this.halService.getEndpoint(this.workspaceItemService.getLinkPath());

        const patchOperation2 = {
          op: 'replace', path: '/license/' + clarinLicense.definition, value: clarinLicense
        } as Operation;

        hrefObs.pipe(
          find((href: string) => hasValue(href)),
        ).subscribe((href: string) => {
          const request = new PatchRequest(requestId, href + '/' + res.payload.id, [patchOperation2]);
          this.requestService.send(request);
        });

        // this.requestService.getByUUID(requestId)
        //   .pipe(filter(response => hasValue(response) && response.state !== RequestEntryState.ResponsePending))
        //   // .pipe(take(1))
        //   .subscribe(response => {
        //     console.log('response', response);
        //   });

        this.rdbService.buildFromRequestUUID(requestId)
          // .pipe(filter(response => hasValue(response) && response.state !== RequestEntryState.ResponsePending))
          .pipe(getFirstCompletedRemoteData())
          // .pipe(take(1))
          .subscribe(response => {
            console.log('response', response);

            // show validation errors in every section
            const workspaceitem = response.payload;

            const { sections } = workspaceitem;
            const { errors } = workspaceitem;

            const errorsList = parseSectionErrors(errors);

            if (sections && isNotEmpty(sections)) {
              Object.keys(sections)
                .forEach((sectionId) => {
                  const sectionData = normalizeSectionData(sections[sectionId]);
                  const sectionErrors = errorsList[sectionId];
                  this.sectionService.updateSectionData(this.submissionId, sectionId, sectionData, sectionErrors, sectionErrors);
                });
            }
            // const sectionError: SubmissionSectionError = {
            //   message: 'error.validation.required',
            //   path: '/sections/traditionalpageone/local.contact.person'
            // };
            // console.log('response', response);
            // this.sectionService.updateSectionData(this.submissionId, this.sectionData.id, Object.assign({}, {}, Object.assign(new WorkspaceitemSectionsObject(), {
            //   url: 'superUrl',
            //   acceptanceDate: 'sss',
            //   granted: true
            // })), [sectionError]);
            // this.submissionService.dispatchSaveSection(this.submissionId, this.sectionData.id);
            // @ts-ignore
            // this.sectionService.checkSectionErrors(this.submissionId, this.sectionData.id, this.formId, response.payload.errors, this.sectionData.errorsToShow);
            // @ts-ignore
            // this.sectionData.errorsToShow = response.payload.errors;
            // this.changeDetectorRef.detectChanges();
            // this.updateSectionStatus();
          });
      });

    // this.operationsBuilder.add(this.pathCombiner.getPath('dc.contributor.author'), Object.assign(new FormFieldMetadataValueObject(), {
    //   value: 'qqqq',
    //   display: 'qqqq',
    //   confidence: -1,
    //   place: 0
    // }), false);

    // this.submissionService.dispatchSaveSection(this.submissionId, this.sectionData.id);
    // this.sectionService.checkSectionErrors(this.submissionId, this.sectionData.id, this.formId, errors, this.sectionData.errorsToShow);
    // this.sectionData.errorsToShow = errors;
    // this.changeDetectorRef.detectChanges();
    // this.updateSectionStatus();
    // send workspaceitem in the request




    //

    // this.clarinLicenseService.patch(clarinLicense, [patchOperation])
    //   .pipe(getFirstSucceededRemoteData())
    //   .subscribe(res => {
    //     console.log('res', res);
    //   });
    // this.clarinLicenseService.create(clarinLicense);
    // const handleObj = {
    //   handle: 'handle',
    //   url: 'url'
    // };
    //
    // // create request with the updated Handle
    // const patchOperation = {
    //   op: 'replace', path: '/sections/clarin-license/granted', value: handleObj
    // } as Operation;
    //
    // const requestId = this.requestService.generateRequestId();
    // const patchRequest = new PatchRequest(requestId, 'http://localhost:8080/server/api/submission/workspaceitems/' + this.submissionId, [patchOperation]);
    // // call patch request
    // this.requestService.send(patchRequest);
    //
    // // check response
    // this.requestService.getByUUID(requestId)
    //   .subscribe( res => {
    //     console.log('res', res);
    //   });
  }
}

