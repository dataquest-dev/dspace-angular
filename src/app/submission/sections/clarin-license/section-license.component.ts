import {ChangeDetectorRef, Component, ElementRef, Inject, ViewChild} from '@angular/core';
import {
  DynamicFormControlEvent,
  DynamicFormControlModel,
  DynamicFormLayout
} from '@ng-dynamic-forms/core';

import {of, Observable, Subscription } from 'rxjs';
import { CollectionDataService } from '../../../core/data/collection-data.service';
import { JsonPatchOperationPathCombiner } from '../../../core/json-patch/builder/json-patch-operation-path-combiner';
import { JsonPatchOperationsBuilder } from '../../../core/json-patch/builder/json-patch-operations-builder';
import { hasValue } from '../../../shared/empty.util';
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

  model: licenseacceptbutton = {
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

  private status: boolean;

  /**
   * The form id
   * @type {string}
   */
  public formId: string;

  /**
   * The form model
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

  /**
   * Initialize all instance variables and retrieve submission license
   */
  onSectionInit() {
    //todo set from backend
    // this.model.value = accepted distrubution
    // id = license id from html select options
    // use '' for not selected

    //'' = not selected
    let id = '';
    this.model.value = false;

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
  @ViewChild('abc') el: ElementRef;

  onChange(event: DynamicFormControlEvent) {
    let selectedLicenseId: string;
    if (this.el == undefined) {
      this.status = false;
      return;
    }
      selectedLicenseId = this.el.nativeElement.value
    let selectedLicense: boolean = false;
    selectedLicense = selectedLicenseId.trim().length != 0
    this.status = this.model.value && selectedLicense;
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

      //todo to sent Backend.
      // Accepted = this.model.value.
      // License: licenseLabel
    }
  }

  change() {
    this.onChange(null);
    this.sectionService.updateSectionData(this.submissionId, this.sectionData.id, "x");
  }

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
}

