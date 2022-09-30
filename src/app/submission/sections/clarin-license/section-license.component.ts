import {ChangeDetectorRef, Component, ElementRef, Inject, ViewChild} from '@angular/core';
import {DynamicFormControlModel, DynamicFormLayout} from '@ng-dynamic-forms/core';

import {Observable, of, Subscription} from 'rxjs';
import {CollectionDataService} from '../../../core/data/collection-data.service';
import {JsonPatchOperationPathCombiner} from '../../../core/json-patch/builder/json-patch-operation-path-combiner';
import {JsonPatchOperationsBuilder} from '../../../core/json-patch/builder/json-patch-operations-builder';
import {hasValue, isEmpty, isNotEmpty, isNotNull, isNotUndefined} from '../../../shared/empty.util';
import {FormBuilderService} from '../../../shared/form/builder/form-builder.service';
import {FormService} from '../../../shared/form/form.service';
import {SubmissionService} from '../../submission.service';
import {SectionFormOperationsService} from '../form/section-form-operations.service';
import {SectionDataObject} from '../models/section-data.model';
import {SectionModelComponent} from '../models/section.model';
import {renderSectionFor} from '../sections-decorator';
import {SectionsType} from '../sections-type';
import {SectionsService} from '../sections.service';
import {SECTION_LICENSE_FORM_LAYOUT} from './section-license.model';
import {RequestService} from '../../../core/data/request.service';
import {PatchRequest} from '../../../core/data/request.models';
import {Operation} from 'fast-json-patch';
import {ClarinLicenseDataService} from '../../../core/data/clarin/clarin-license-data.service';
import {ClarinLicense} from '../../../core/shared/clarin/clarin-license.model';
import {getFirstCompletedRemoteData} from '../../../core/shared/operators';
import {distinctUntilChanged, filter, find} from 'rxjs/operators';
import {HALEndpointService} from '../../../core/shared/hal-endpoint.service';
import {RemoteDataBuildService} from '../../../core/cache/builders/remote-data-build.service';
import {WorkspaceitemDataService} from '../../../core/submission/workspaceitem-data.service';
import {RemoteData} from '../../../core/data/remote-data';
import parseSectionErrors from '../../utils/parseSectionErrors';
import {normalizeSectionData} from '../../../core/submission/submission-response-parsing.service';
import licenseDefinitions from './license-definitions.json';
import {License4Selector} from './license-4-selector.model';
import {ConfigurationProperty} from '../../../core/shared/configuration-property.model';
import {HELP_DESK_PROPERTY} from '../../../item-page/tombstone/tombstone.component';
import {ConfigurationDataService} from '../../../core/data/configuration-data.service';

interface LicenseAcceptButton {
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

  @ViewChild('licenseSelection') licenseSelectionRef: ElementRef;

  toggleAcceptation: LicenseAcceptButton = {
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

  /**
   * The mail for the help desk is loaded from the server.
   */
  helpDesk$: Observable<RemoteData<ConfigurationProperty>>;

  private selectedLicenseDefinition = '';

  private status = false;

  licenses4Selector: License4Selector[] = [];

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
              private configurationDataService: ConfigurationDataService,
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

  loadLicenses4Selector() {
    licenseDefinitions.forEach((license4Selector: License4Selector) => {
      this.licenses4Selector.push(license4Selector);
    });
  }
  /**
   * Initialize all instance variables and retrieve submission license
   */
  onSectionInit() {
    this.helpDesk$ = this.configurationDataService.findByPropertyName(HELP_DESK_PROPERTY);

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

    // initialize licenses for license selector
    this.loadLicenses4Selector();
    // '' = not selected
    let id = '';
    this.toggleAcceptation.value = false;

    (document.getElementById('aspect_submission_StepTransformer_field_license') as HTMLSelectElement).value = id;
    // if ever we needed to move button. Now just click event is redirected
    // $('#license-text').css('display', 'inline').appendTo('#button-holder');
  }

  getLicenseDefinitionFromRef() {
    let selectedLicenseId: string;
    if (this.licenseSelectionRef == undefined) {
      this.status = false;
      return;
    }
    selectedLicenseId = this.licenseSelectionRef.nativeElement.value
    let selectedLicense: boolean = false;
    selectedLicense = selectedLicenseId.trim().length != 0
    this.status = this.toggleAcceptation.value && selectedLicense;

    // is any license selected - create method
    if (selectedLicense) {
      if (this.licenseSelectionRef.nativeElement == undefined) {
        return;
      }
      let licenseLabel: string;
      let options = this.licenseSelectionRef.nativeElement.children
      for (let i = 0; i < options.length; i++) {
        if (options[i].value == selectedLicenseId) {
          licenseLabel = options[i].label
        }
      }
      return licenseLabel;
    }
    return '';
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

  selectLicense(selectedLicenseId) {
    if (isEmpty(selectedLicenseId)) {
      this.selectedLicenseDefinition = '';
    }
    this.selectedLicenseDefinition = this.getLicenseDefinitionById(selectedLicenseId);
    console.log('this.selectedLicenseDefinition', this.selectedLicenseDefinition);
  }

  getLicenseDefinitionById(selectionLicenseId) {
    let licenseDefinition = '';
    this.licenses4Selector.forEach(license4Selector => {
      if (String(license4Selector.id) === selectionLicenseId) {
        licenseDefinition = license4Selector.name;
        return;
      }
    });
    return licenseDefinition;
  }
  /**
   * Method called when a form dfChange event is fired.
   * Dispatch form operations based on changes.
   */
  changeLicenseDefFromRef() {
    this.selectedLicenseDefinition = this.getLicenseDefinitionFromRef();
    console.log('this.selectedLicenseDefinition', this.selectedLicenseDefinition);
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
    console.log('clicked');
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

