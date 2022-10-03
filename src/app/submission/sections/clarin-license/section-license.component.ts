import {ChangeDetectorRef, Component, ElementRef, Inject, NgZone, OnInit, ViewChild} from '@angular/core';
import {DynamicFormControlModel, DynamicFormLayout} from '@ng-dynamic-forms/core';

import {BehaviorSubject, combineLatest as observableCombineLatest, Observable, of, Subscription} from 'rxjs';
import {CollectionDataService} from '../../../core/data/collection-data.service';
import {JsonPatchOperationPathCombiner} from '../../../core/json-patch/builder/json-patch-operation-path-combiner';
import {JsonPatchOperationsBuilder} from '../../../core/json-patch/builder/json-patch-operations-builder';
import {hasValue, isEmpty, isNotEmpty, isNotNull, isNotUndefined, isUndefined} from '../../../shared/empty.util';
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
import {distinctUntilChanged, filter, find, map} from 'rxjs/operators';
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
import {WorkspaceItem} from '../../../core/submission/models/workspaceitem.model';
import {PaginatedList} from '../../../core/data/paginated-list.model';
import {SubmissionSectionError} from '../../objects/submission-objects.reducer';
import {hasFailed} from '../../../core/data/request.reducer';
import {ItemDataService} from '../../../core/data/item-data.service';
import {Item} from '../../../core/shared/item.model';
import {MetadataValue} from '../../../core/shared/metadata.models';

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

  couldShowValidationErrors = false;

  @ViewChild('licenseSelection') licenseSelectionRef: ElementRef;

  /**
   * The mail for the help desk is loaded from the server.
   */
  helpDesk$: Observable<RemoteData<ConfigurationProperty>>;

  selectedLicenseName = '';

  private status = false;

  toggleAcceptation: LicenseAcceptButton;

  unsupportedLicenseMsgHidden = new BehaviorSubject<boolean>(true);

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
              protected itemService: ItemDataService,
              private _ngZone: NgZone,
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

  ngOnInit() {
    super.ngOnInit();
    this.toggleAcceptation = {
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

    this.helpDesk$ = this.configurationDataService.findByPropertyName(HELP_DESK_PROPERTY);
    // initialize licenses for license selector
    this.loadLicenses4Selector();
  }

  /**
   * Unsubscribe from all subscriptions
   */
  onSectionDestroy() {
    this.subs
      .filter((subscription) => hasValue(subscription))
      .forEach((subscription) => subscription.unsubscribe());
  }

  loadLicenses4Selector() {
    licenseDefinitions.forEach((license4Selector: License4Selector) => {
      this.licenses4Selector.push(license4Selector);
    });
  }

  private initializeLicenseFromMetadata(dcRightsMetadata: MetadataValue[]) {
    if (isEmpty(dcRightsMetadata)) {
      return;
    }

    const dcRightsValue = dcRightsMetadata[0].value;
    this.selectLicenseOnInit(dcRightsValue)
      .then(() => this.updateSectionStatus())
      .catch(err => console.error(err));
  }

  /**
   * Initialize all instance variables and retrieve submission license
   */
  onSectionInit() {
    this.pathCombiner = new JsonPatchOperationPathCombiner('sections', this.sectionData.id);
    this.formId = this.formService.getUniqueId(this.sectionData.id);

    // Load the accepted license of the item
    this.getActualWorkspaceItem()
      .then((workspaceItemRD: RemoteData<WorkspaceItem>) => {
        console.log('workspaceItemRD', workspaceItemRD);
        this.itemService.findByHref(workspaceItemRD.payload._links.item.href)
          .pipe(getFirstCompletedRemoteData())
          .subscribe((itemRD: RemoteData<Item>) => {
            console.log('itemRD', itemRD);
            // Load the metadata where is store clarin license name (`dc.rights`).
            const item = itemRD.payload;
            const dcRightsMetadata = item.metadata['dc.rights'];
            console.log('dcRights', dcRightsMetadata);
            if (isUndefined(dcRightsMetadata)) {
              return;
            }

            this.initializeLicenseFromMetadata(dcRightsMetadata);
          });
      });


    // subscribe validation errors
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
              // if the license def is null and the toogle acceptation is false
              return Object.assign({}, error, { path: '/sections/license/clarin-license' });
            } else {
              return error;
            }
          }).filter((error) => isNotNull(error));

          if (isNotUndefined(newErrors) && isNotEmpty(newErrors)) {
            this.sectionService.checkSectionErrors(this.submissionId, this.sectionData.id, this.formId, newErrors);
            this.sectionData.errors = errors;
          } else {
            // Remove any section's errors
            this.sectionService.dispatchRemoveSectionErrors(this.submissionId, this.sectionData.id);
          }
          this.changeDetectorRef.detectChanges();
        })
    );
  }

  /**
   * Method called when a form dfChange event is fired.
   * Dispatch form operations based on changes.
   */
  async changeLicenseNameFromRef() {
    this.selectedLicenseName = this.getLicenseNameFromRef();
    await this.maintainLicenseSelection();
  }

  setToggleAcceptation() {
    console.log('setting toogle');
    this.toggleAcceptation.value = true;
  }

  async selectLicenseOnInit(licenseName) {
    if (isEmpty(licenseName)) {
      this.selectedLicenseName = '';
    } else {
      this.selectedLicenseName = licenseName;
      console.log('chanted this.selectedLicenseName', this.selectedLicenseName);
    }

    this.setToggleAcceptation();
    this.setLicenseNameForRef(this.selectedLicenseName);
  }

  async selectLicense(selectedLicenseId) {
    if (isEmpty(selectedLicenseId)) {
      this.selectedLicenseName = '';
    } else {
      this.selectedLicenseName = this.getLicenseNameById(selectedLicenseId);
    }

    await this.maintainLicenseSelection();
  }

  async maintainLicenseSelection() {

    this.isLicenseSupported(this.selectedLicenseName)
      .then(isSupported => {
        if (!isSupported) {
          this.toggleAcceptation.value = false;
        } else {
          // the user has chosen first supported license so the validation errors could be showed
          if (!this.couldShowValidationErrors) {
            this.couldShowValidationErrors = true;
          }
        }
        this.unsupportedLicenseMsgHidden.next(isSupported);
        this.sendRequest();
      });
  }

  async findClarinLicenseByName(licenseName): Promise<RemoteData<PaginatedList<ClarinLicense>>> {
    const options = {
      searchParams: [
        {
          fieldName: 'name',
          fieldValue: licenseName
        }
      ]
    };
    return this.clarinLicenseService.searchBy('byName', options, false)
      .pipe(getFirstCompletedRemoteData()).toPromise();
  }

  async isLicenseSupported(licenseName) {
    let supported = true;
    await this.findClarinLicenseByName(licenseName)
      .then((response: RemoteData<PaginatedList<ClarinLicense>>) => {
        if (hasFailed(response?.state) || response?.payload?.page?.length === 0) {
          supported = false;
        } else {
          supported = true;
        }
    });
    return supported;
  }

  async sendRequest() {
    // Do not send request in initialization because the validation errors will be seen.
    if (!this.couldShowValidationErrors) {
      return;
    }

    let licenseNameRest = '';
    // send license definition value only if the acceptation toggle is true
    if (this.toggleAcceptation.value) {
      licenseNameRest = this.selectedLicenseName;
      this.status = true;
      this.updateSectionStatus();
    }

    await this.getActualWorkspaceItem()
      .then(workspaceItemRD => {
        const requestId = this.requestService.generateRequestId();
        const hrefObs = this.halService.getEndpoint(this.workspaceItemService.getLinkPath());

        const patchOperation2 = {
          op: 'replace', path: '/license', value: licenseNameRest
        } as Operation;

        hrefObs.pipe(
          find((href: string) => hasValue(href)),
        ).subscribe((href: string) => {
          const request = new PatchRequest(requestId, href + '/' + workspaceItemRD.payload.id, [patchOperation2]);
          this.requestService.send(request);
        });

        // process the response
        this.rdbService.buildFromRequestUUID(requestId)
          .pipe(getFirstCompletedRemoteData())
          .subscribe((response: RemoteData<WorkspaceItem>) => {

            // show validation errors in every section
            const workspaceitem = response.payload;

            const {sections} = workspaceitem;
            const {errors} = workspaceitem;

            const errorsList = parseSectionErrors(errors);

            if (sections && isNotEmpty(sections)) {
              Object.keys(sections)
                .forEach((sectionId) => {
                  const sectionData = normalizeSectionData(sections[sectionId]);
                  const sectionErrors = errorsList[sectionId];
                  // update section data to show validation errors for every section (upload, form)
                  this.sectionService.updateSectionData(this.submissionId, sectionId, sectionData, sectionErrors, sectionErrors);
                });
            }
          });
      });
  }

  clickLicense() {
    document.getElementById('license-text').click();
  }

  getLicenseNameById(selectionLicenseId) {
    let licenseName = '';
    this.licenses4Selector.forEach(license4Selector => {
      if (String(license4Selector.id) === selectionLicenseId) {
        licenseName = license4Selector.name;
        return;
      }
    });
    return licenseName;
  }

  getLicenseIdByName(selectionLicenseName) {
    let licenseId = -1;
    this.licenses4Selector.forEach(license4Selector => {
      if (license4Selector.name === selectionLicenseName) {
        licenseId = license4Selector.id;
        return;
      }
    });
    return licenseId;
  }

  async getActualWorkspaceItem(): Promise<RemoteData<WorkspaceItem>> {
    return this.workspaceItemService.findById(this.submissionId)
      .pipe(getFirstCompletedRemoteData()).toPromise();
  }

  setLicenseNameForRef(licenseName) {
    const licenseId = this.getLicenseIdByName(licenseName);
    // @ts-ignore
    document.getElementById('aspect_submission_StepTransformer_field_license').value = licenseId;
    document.getElementById('secret-change-button').click();
  }

  getLicenseNameFromRef() {
    let selectedLicenseId: string;
    if (isUndefined(this.licenseSelectionRef)) {
      return;
    }
    selectedLicenseId = this.licenseSelectionRef.nativeElement.value;
    let selectedLicense = false;
    selectedLicense = selectedLicenseId.trim().length !== 0;

    // is any license selected - create method
    if (selectedLicense) {
      if (isUndefined(this.licenseSelectionRef.nativeElement)) {
        return;
      }
      let licenseLabel: string;
      const options = this.licenseSelectionRef.nativeElement.children;
      for (const item of options) {
        if (item.value === selectedLicenseId) {
          licenseLabel = item.label;
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
    if (isEmpty(this.selectedLicenseName)) {
      this.status = null;
    } else if (isEmpty(this.sectionData.errorsToShow)) {
      this.status = true;
    } else {
      this.status = false;
    }

    return of(this.status);
  }
}

