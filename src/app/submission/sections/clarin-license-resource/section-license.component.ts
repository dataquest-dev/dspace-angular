import { ChangeDetectorRef, Component, Inject, Renderer2, ViewChild } from '@angular/core';
import { DynamicFormControlModel } from '@ng-dynamic-forms/core';
import { BehaviorSubject, Observable, of, Subscription } from 'rxjs';
import { JsonPatchOperationPathCombiner, } from '../../../core/json-patch/builder/json-patch-operation-path-combiner';
import { JsonPatchOperationsBuilder } from '../../../core/json-patch/builder/json-patch-operations-builder';
import { hasValue, isEmpty, isNotEmpty, isNotNull, isNotUndefined, isUndefined } from '../../../shared/empty.util';
import { FormService } from '../../../shared/form/form.service';
import { SectionDataObject } from '../models/section-data.model';
import { SectionModelComponent } from '../models/section.model';
import { renderSectionFor } from '../sections-decorator';
import { SectionsType } from '../sections-type';
import { SectionsService } from '../sections.service';
import { RequestService } from '../../../core/data/request.service';
import { FindListOptions, PatchRequest } from '../../../core/data/request.models';
import { Operation } from 'fast-json-patch';
import { ClarinLicenseDataService } from '../../../core/data/clarin/clarin-license-data.service';
import { ClarinLicense } from '../../../core/shared/clarin/clarin-license.model';
import { getFirstCompletedRemoteData, getFirstSucceededRemoteListPayload } from '../../../core/shared/operators';
import { distinctUntilChanged, filter, find } from 'rxjs/operators';
import { HALEndpointService } from '../../../core/shared/hal-endpoint.service';
import { RemoteDataBuildService } from '../../../core/cache/builders/remote-data-build.service';
import { WorkspaceitemDataService } from '../../../core/submission/workspaceitem-data.service';
import { RemoteData } from '../../../core/data/remote-data';
import parseSectionErrors from '../../utils/parseSectionErrors';
import { normalizeSectionData } from '../../../core/submission/submission-response-parsing.service';
import { License4Selector } from './license-4-selector.model';
import { ConfigurationProperty } from '../../../core/shared/configuration-property.model';
import { HELP_DESK_PROPERTY } from '../../../item-page/tombstone/tombstone.component';
import { ConfigurationDataService } from '../../../core/data/configuration-data.service';
import { WorkspaceItem } from '../../../core/submission/models/workspaceitem.model';
import { PaginatedList } from '../../../core/data/paginated-list.model';
import { hasFailed } from '../../../core/data/request.reducer';
import { ItemDataService } from '../../../core/data/item-data.service';
import { Item } from '../../../core/shared/item.model';
import { MetadataValue } from '../../../core/shared/metadata.models';
import { TranslateService } from '@ngx-translate/core';
import { secureImageData } from 'src/app/shared/clarin-shared-util';
import {DomSanitizer} from '@angular/platform-browser';

/**
 * This component render resource license step in the submission workflow.
 */
@Component({
  selector: 'ds-submission-section-clarin-license',
  styleUrls: ['./section-license.component.scss'],
  templateUrl: './section-license.component.html',
})
@renderSectionFor(SectionsType.clarinLicense)
export class SubmissionSectionClarinLicenseComponent extends SectionModelComponent {

  /**
   * The license selection dropdown reference.
   */
  @ViewChild('licenseSelection') licenseSelectionRef;

  selectedCar: number;

  cars = [
    { id: 1, name: 'Volvo' },
    { id: 2, name: 'Saab' },
    { id: 3, name: 'Opel' },
    { id: 4, name: 'Audi' },
  ];

  /**
   * Sometimes do not show validation errors e.g. on Init.
   */
  couldShowValidationErrors = false;

  /**
   * If the Item has license - show it in the license selection.
   */
  selectedLicenseFromOptionId;

  /**
   * The mail for the help desk is loaded from the server.
   */
  helpDesk$: Observable<RemoteData<ConfigurationProperty>>;

  /**
   * Current selected license name.
   */
  selectedLicenseName = '';

  /**
   * Actual step status.
   */
  status = false;

  /**
   * Message that selected license is not supported.
   */
  unsupportedLicenseMsgHidden = new BehaviorSubject<boolean>(true);

  /**
   * Licenses loaded from the license-definitions.json and mapped to the object list.
   */
  licenses4Selector$: Observable<any>;

  /**
   * Current License Label icon as byte array.
   */
  licenseLabelIcons: any[] = [];

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
   * A boolean representing if to show form submit and cancel buttons
   * @type {boolean}
   */
  public displaySubmit = false;

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

  cities = [
    {
      id: 1,
      name: 'Vilnius',
      avatar: '//www.gravatar.com/avatar/b0d8c6e5ea589e6fc3d3e08afb1873bb?d=retro&r=g&s=30 2x'
    },
    { id: 2, name: 'Kaunas', avatar: '//www.gravatar.com/avatar/ddac2aa63ce82315b513be9dc93336e5?d=retro&r=g&s=15' },
    {
      id: 3,
      name: 'Pavilnys',
      avatar: '//www.gravatar.com/avatar/6acb7abf486516ab7fb0a6efa372042b?d=retro&r=g&s=15'
    },
    {
      id: 4,
      name: 'Siauliai',
      avatar: '//www.gravatar.com/avatar/b0d8c6e5ea589e6fc3d3e08afb1873bb?d=retro&r=g&s=30 2x'
    },
  ];

  selectedCity = this.cities[2].name;

  /**
   * Initialize instance variables
   *
   * @param {ChangeDetectorRef} changeDetectorRef
   * @param clarinLicenseService
   * @param translateService
   * @param itemService
   * @param workspaceItemService
   * @param halService
   * @param rdbService
   * @param configurationDataService
   * @param requestService
   * @param {FormService} formService
   * @param {JsonPatchOperationsBuilder} operationsBuilder
   * @param {SectionsService} sectionService
   * @param {string} injectedCollectionId
   * @param {SectionDataObject} injectedSectionData
   * @param {string} injectedSubmissionId
   * @param sanitizer
   */
  constructor(protected changeDetectorRef: ChangeDetectorRef,
              protected clarinLicenseService: ClarinLicenseDataService,
              protected translateService: TranslateService,
              protected itemService: ItemDataService,
              protected workspaceItemService: WorkspaceitemDataService,
              protected halService: HALEndpointService,
              protected rdbService: RemoteDataBuildService,
              private configurationDataService: ConfigurationDataService,
              protected requestService: RequestService,
              protected formService: FormService,
              protected operationsBuilder: JsonPatchOperationsBuilder,
              protected sectionService: SectionsService,
              @Inject('collectionIdProvider') public injectedCollectionId: string,
              @Inject('sectionDataProvider') public injectedSectionData: SectionDataObject,
              @Inject('submissionIdProvider') public injectedSubmissionId: string,
              private sanitizer: DomSanitizer) {
    super(injectedCollectionId, injectedSectionData, injectedSubmissionId);
  }

  async ngOnInit() {
    // initialize licenses for license selector
    // It must be before `super.ngOnInit();` because that method loads the metadata from the Item and compare
    // items license with licenses4Selector.
    await this.loadLicenses4Selector();
    super.ngOnInit();
    this.helpDesk$ = this.configurationDataService.findByPropertyName(HELP_DESK_PROPERTY);
  }

  /**
   * Unsubscribe from all subscriptions
   */
  onSectionDestroy() {
    this.subs
      .filter((subscription) => hasValue(subscription))
      .forEach((subscription) => subscription.unsubscribe());
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
        this.itemService.findByHref(workspaceItemRD.payload._links.item.href)
          .pipe(getFirstCompletedRemoteData())
          .subscribe((itemRD: RemoteData<Item>) => {
            // Load the metadata where is store clarin license name (`dc.rights`).
            const item = itemRD.payload;
            const dcRightsMetadata = item.metadata['dc.rights'];
            if (isUndefined(dcRightsMetadata)) {
              // '0' is a magic constant for a default message `Select a license ...`
              this.selectedLicenseFromOptionId = '0';
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

  /**
   * Select license by the license Id.
   */
  async selectLicense() {
    if (isEmpty(this.selectedLicenseFromOptionId)) {
      this.selectedLicenseName = '';
    } else {
      this.selectedLicenseName = this.getLicenseNameById(this.selectedLicenseFromOptionId);
    }

    await this.maintainLicenseSelection();
  }

  /**
   * Send Replace request to the API with the selected license name and update the section status.
   * @param licenseNameRest
   */
  async sendRequest(licenseNameRest) {
    // Do not send request in initialization because the validation errors will be seen.
    if (!this.couldShowValidationErrors) {
      return;
    }

    this.updateSectionStatus();
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

  /**
   * Pop up the License Selector.
   */
  clickLicense() {
    document.getElementById('license-text').click();
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

  /**
   * The Item has resource license name in the metadata `dc.rights`, load this metadata value and select the license
   * with this value.
   */
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
   * Select the license by `licenseName` value.
   * @param licenseName loaded from the `dc.rights` item metaddata
   */
  private async selectLicenseOnInit(licenseName) {
    if (isEmpty(licenseName)) {
      this.selectedLicenseName = '';
    } else {
      this.selectedLicenseName = licenseName;
    }

    this.setLicenseNameForRef(this.selectedLicenseName);
  }

  /**
   * Select the license in the license selection dropdown/
   */
  private setLicenseNameForRef(licenseName) {
    this.selectedLicenseFromOptionId = this.getLicenseIdByName(licenseName);
  }

  /**
   * Send request to the API for updating the selection or show error message that the selected license
   * is not supported.
   * @private
   */
  private async maintainLicenseSelection() {
    this.isLicenseSupported(this.selectedLicenseName)
      .then(isSupported => {
        // the user has chosen first supported license so the validation errors could be showed
        if (!this.couldShowValidationErrors) {
          this.couldShowValidationErrors = true;
        }
        this.unsupportedLicenseMsgHidden.next(isSupported);

        let selectedLicenseName = '';
        if (isSupported) {
          selectedLicenseName = this.selectedLicenseName;
        }
        this.sendRequest(selectedLicenseName);
      });
  }

  /**
   * Get the license object from the API by the license name.
   */
  private async findClarinLicenseByName(licenseName): Promise<RemoteData<PaginatedList<ClarinLicense>>> {
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

  /**
   * Check if the selected license is supported by CLARIN/DSpace, because not every license from the license
   * selector must be supported by the CLARIN/DSpace.
   * @param licenseName selected license name.
   */
  private async isLicenseSupported(licenseName) {
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

  /**
   * From the license object list get whole object by the Id.
   */
  private getLicenseNameById(selectionLicenseId) {
    let licenseName = '';
    this.licenses4Selector$.forEach(license4Selector => {
      if (String(license4Selector.id) === selectionLicenseId) {
        licenseName = license4Selector.name;
        return;
      }
    });
    return licenseName;
  }

  /**
   * From the license object list get whole object by the Id.
   */
  private getLicenseIdByName(selectionLicenseName) {
    let licenseId = -1;
    this.licenses4Selector$.forEach(license4Selector => {
      if (license4Selector.name === selectionLicenseName) {
        licenseId = license4Selector.id;
        return;
      }
    });
    return licenseId;
  }

  /**
   * Get the current workspace item by the submissionId.
   */
  private async getActualWorkspaceItem(): Promise<RemoteData<WorkspaceItem>> {
    return this.workspaceItemService.findById(this.submissionId)
      .pipe(getFirstCompletedRemoteData()).toPromise();
  }

  /**
   * Load selected value from the license selection dropdown reference.
   */
  private getLicenseNameFromRef() {
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
   * Map licenses from `license-definitions.json` to the object list.
   */
  private async loadLicenses4Selector(): Promise<any> {
    // Show PUB licenses as first.
    const pubLicense4SelectorArray = [];
    // Then show ACA and RES licenses.
    const acaResLicense4SelectorArray = [];
    await this.loadAllClarinLicenses()
      .then((clarinLicenseList: ClarinLicense[]) => {
        clarinLicenseList?.forEach(clarinLicense => {
          const license4Selector = new License4Selector();
          license4Selector.id = clarinLicense.id;
          license4Selector.name = clarinLicense.name;
          license4Selector.url = clarinLicense.definition;
          license4Selector.licenseLabel = clarinLicense?.clarinLicenseLabel?.label;
          if (license4Selector.licenseLabel === 'PUB') {
            pubLicense4SelectorArray.push(license4Selector);
          } else {
            acaResLicense4SelectorArray.push(license4Selector);
          }
        });
      });

    // Sort acaResLicense4SelectorArray by the license label (ACA, RES)
    acaResLicense4SelectorArray.sort((a, b) => a.licenseLabel.localeCompare(b.licenseLabel));

    // Concat two array into one.
    const license4SelectorArray = pubLicense4SelectorArray.concat(acaResLicense4SelectorArray);
    this.licenses4Selector$ = of(license4SelectorArray);
  }

  private loadAllClarinLicenses(): Promise<any> {
    const options = new FindListOptions();
    options.currentPage = 0;
    // Load all licenses
    options.elementsPerPage = 1000;
    return this.clarinLicenseService.findAll(options, false)
      .pipe(getFirstSucceededRemoteListPayload())
      .toPromise();
  }

  secureImageData() {
    // console.log('licenseId', this.licenseLabelIcons[78]);
    // console.log('licenseId', secureImageData(this.sanitizer, this.licenseLabelIcons[licenseId]));
    return secureImageData(this.sanitizer, 'iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAYAAACqaXHeAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAABEBJREFUeNrsW4uRmzAQxdcA1wHuAHdgd+B04HTgSQWkA9KBS6AE7ApwB76rwHYFRI+BC8NIuyshfufszE7uLkKw/5+0CoaFSOFO4abGdY0UXBU+FJ7rn4GfwYIgVpgqvCksPWFR7xnNmfCDwtwj0SbM63fNBvaepS3F29SMiEaSuEQj4inU/T4D4tuYuBCyslwfKvyj8Kf4gTAMdrtdsNlsqn/X63WFOvj4+Kjwer0G5/O5wufzafN9iBw/FD6HkHpYe2ORRA6HQ5llWdkXsAf2svQN8STEK2mXSZKU9/u99A3YE3vjHQIm3H0yQUT8fr8vb7dbOTSAEUKN8MIElnhIxIeq20Ke5xJt6M0EMszFcTyK1CltwDcIfELoQnzKET+ErbuAwCRyl+xuEcRbMCGxsfv7koi3YELcS/WjKJot8Q0wPoE1hYjiYFEU5dwBAmKiw8HJ6yMJWQogRDJRwU76UKulAeMPtFpwMj0Aji4NkJ8QppDrPL928Xa7LZcKMFtCC6Juff9tpN/WAoIBxzYDsr62D++bpmmlMbrwiWJJWjOA6bBhPKfTSEhWmoITvqBoM0C76HQ6iV6CdcIytWKqKZyCiToG9olMYDqxR1UjbE0LJEmPZbPiq4LsMgG/S5nYbbxwQDyPlL/KkZ2cH1TetYcHYhs1BqN16i7F4/FIfifMj6oPMhf1YhxM9VLsgY8zSRZrAFhDpd/YB0iZB+UTiGhQhUNtw4NzWCbV16l3t25vt86ANuoNf9PVVC5SEZlhEbjm/Sapmhxno+bdnmGXoLbkKYlKCBdqq/4/KABzXJ6z0ST4F59g+t43l1bR4/HQ/l1JxXovzAF0gDnCGPAWzBTe399fmwEmLXsZBowFbz7V83K5kJLT2btpL8wFXXyHC3gNg1QChdCF8NYOlaZskuo/NnEdEURSFHFh0HsipIvP3WwMBOId1MfpEiFdzYB1VN3CJUKDpsJAU57f5PBUQYVnsQ77UEynNIGoWXJjMSTpBTAdF7YsbqTGtK9Y5Mp2gsHJJOWwbrjiWg5LehbEvnsvDRGomPTjKXsFE6QNEZiGpBag0vZ2X3DwlpjUY3MtMfgWqWBsWmLfsinKTInS/23x7zwYYaRfmM74Wjcn5gpUm40akL70cJTUgqWYgqDDzJ4vTm36+Qs7IFH8PyIjhO0rH5JqIHGd8Y1t84L0OXdtlmTceGtKxwgBCA5KFq4HJcXnhBFzxzYJ4VxynPPC7Q7PGDFeIPVpTow3tcMQjADhFmcHBrszkEkbFc0csM9hajwLVbccnVvZ/MqBEYgOv61uV0XR17UZIFrh3dFX+7pMc2Xm89P6viSu8/waY56wDaa5KkfZ+37soUrIHakfCdM+Yc4HRDa+wSNmwcyu0kZUU8Wjqp+Cmd8hDuuSM/Ms7cMQqr4ayWHugn/X57mTD5iKYsJ6rX++DPlxfwUYAPZR72BU5Ev2AAAAAElFTkSuQmCC');
  }
}
