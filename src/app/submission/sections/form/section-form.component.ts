import { ChangeDetectorRef, Component, Inject, ViewChild } from '@angular/core';
import { DynamicFormControlEvent, DynamicFormControlModel, parseReviver } from '@ng-dynamic-forms/core';

import { combineLatest as observableCombineLatest, Observable, Subscription } from 'rxjs';
import { distinctUntilChanged, filter, find, map, mergeMap, take, tap } from 'rxjs/operators';
import { TranslateService } from '@ngx-translate/core';
import { findIndex, isEqual } from 'lodash';

import { FormBuilderService } from '../../../shared/form/builder/form-builder.service';
import { FormComponent } from '../../../shared/form/form.component';
import { FormService } from '../../../shared/form/form.service';
import { SectionModelComponent } from '../models/section.model';
import { SubmissionFormsConfigService } from '../../../core/config/submission-forms-config.service';
import { hasValue, isEmpty, isNotEmpty, isNotNull, isUndefined } from '../../../shared/empty.util';
import { JsonPatchOperationPathCombiner } from '../../../core/json-patch/builder/json-patch-operation-path-combiner';
import { SubmissionFormsModel } from '../../../core/config/models/config-submission-forms.model';
import { SubmissionSectionError, SubmissionSectionObject } from '../../objects/submission-objects.reducer';
import { FormFieldPreviousValueObject } from '../../../shared/form/builder/models/form-field-previous-value-object';
import { SectionDataObject } from '../models/section-data.model';
import { renderSectionFor } from '../sections-decorator';
import { SectionsType } from '../sections-type';
import { SubmissionService } from '../../submission.service';
import { SectionFormOperationsService } from './section-form-operations.service';
import { NotificationsService } from '../../../shared/notifications/notifications.service';
import { SectionsService } from '../sections.service';
import { difference } from '../../../shared/object.util';
import { WorkspaceitemSectionFormObject } from '../../../core/submission/models/workspaceitem-section-form.model';
import { WorkspaceItem } from '../../../core/submission/models/workspaceitem.model';
import { getFirstSucceededRemoteData, getRemoteDataPayload } from '../../../core/shared/operators';
import { SubmissionObjectDataService } from '../../../core/submission/submission-object-data.service';
import { ObjectCacheService } from '../../../core/cache/object-cache.service';
import { RequestService } from '../../../core/data/request.service';
import { followLink } from '../../../shared/utils/follow-link-config.model';
import { environment } from '../../../../environments/environment';
import { ConfigObject } from '../../../core/config/models/config.model';
import { RemoteData } from '../../../core/data/remote-data';
import { RowParser } from '../../../shared/form/builder/parsers/row-parser';
import { cloneDeep } from 'lodash';
import { DynamicRowArrayModel } from '../../../shared/form/builder/ds-dynamic-form-ui/models/ds-dynamic-row-array-model';
import { DynamicRowGroupModel } from '../../../shared/form/builder/ds-dynamic-form-ui/models/ds-dynamic-row-group-model';

/**
 * This component represents a section that contains a Form.
 */
@Component({
  selector: 'ds-submission-section-form',
  styleUrls: ['./section-form.component.scss'],
  templateUrl: './section-form.component.html',
})
@renderSectionFor(SectionsType.SubmissionForm)
export class SubmissionSectionFormComponent extends SectionModelComponent {

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
   * A boolean representing if this section is updating
   * @type {boolean}
   */
  public isUpdating = false;

  /**
   * A boolean representing if this section is loading
   * @type {boolean}
   */
  public isLoading = true;

  /**
   * A map representing all field on their way to be removed
   * @type {Map}
   */
  protected fieldsOnTheirWayToBeRemoved: Map<string, number[]> = new Map();

  /**
   * The form config
   * @type {SubmissionFormsModel}
   */
  protected formConfig: SubmissionFormsModel;

  /**
   * The form data
   * @type {any}
   */
  protected formData: any = Object.create({});

  /**
   * Store the
   * @protected
   */
  protected sectionMetadata: string[];

  /**
   * The [JsonPatchOperationPathCombiner] object
   * @type {JsonPatchOperationPathCombiner}
   */
  protected pathCombiner: JsonPatchOperationPathCombiner;

  /**
   * The [FormFieldPreviousValueObject] object
   * @type {FormFieldPreviousValueObject}
   */
  protected previousValue: FormFieldPreviousValueObject = new FormFieldPreviousValueObject();

  /**
   * The list of Subscription
   * @type {Array}
   */
  protected subs: Subscription[] = [];

  /**
   * Some input rows are not rendered because actual submission type doesn't equals to type-bind definition.
   * Save index of every row that is not rendered but is removed from the form.
   * @type {Array}
   */
  protected hiddenRowsIndex: number[] = [];

  protected workspaceItem: WorkspaceItem;
  /**
   * The FormComponent reference
   */
  @ViewChild('formRef') private formRef: FormComponent;

  /**
   * Initialize instance variables
   *
   * @param {ChangeDetectorRef} cdr
   * @param {FormBuilderService} formBuilderService
   * @param {SectionFormOperationsService} formOperationsService
   * @param {FormService} formService
   * @param {SubmissionFormsConfigService} formConfigService
   * @param {NotificationsService} notificationsService
   * @param {SectionsService} sectionService
   * @param {SubmissionService} submissionService
   * @param {TranslateService} translate
   * @param {SubmissionObjectDataService} submissionObjectService
   * @param {ObjectCacheService} objectCache
   * @param {RequestService} requestService
   * @param {string} injectedCollectionId
   * @param {SectionDataObject} injectedSectionData
   * @param {string} injectedSubmissionId
   */
  constructor(protected cdr: ChangeDetectorRef,
              protected formBuilderService: FormBuilderService,
              protected formOperationsService: SectionFormOperationsService,
              protected formService: FormService,
              protected formConfigService: SubmissionFormsConfigService,
              protected notificationsService: NotificationsService,
              protected sectionService: SectionsService,
              protected submissionService: SubmissionService,
              protected translate: TranslateService,
              protected submissionObjectService: SubmissionObjectDataService,
              protected objectCache: ObjectCacheService,
              protected requestService: RequestService,
              protected rowParser: RowParser,
              @Inject('collectionIdProvider') public injectedCollectionId: string,
              @Inject('sectionDataProvider') public injectedSectionData: SectionDataObject,
              @Inject('submissionIdProvider') public injectedSubmissionId: string) {
    super(injectedCollectionId, injectedSectionData, injectedSubmissionId);
  }

  /**
   * Initialize all instance variables and retrieve form configuration
   */
  onSectionInit() {
    this.pathCombiner = new JsonPatchOperationPathCombiner('sections', this.sectionData.id);
    this.formId = this.formService.getUniqueId(this.sectionData.id);
    this.sectionService.dispatchSetSectionFormId(this.submissionId, this.sectionData.id, this.formId);
    this.formConfigService.findByHref(this.sectionData.config).pipe(
      map((configData: RemoteData<ConfigObject>) => configData.payload),
      tap((config: SubmissionFormsModel) => this.formConfig = config),
      mergeMap(() =>
        observableCombineLatest([
          this.sectionService.getSectionData(this.submissionId, this.sectionData.id, this.sectionData.sectionType),
          this.submissionObjectService.findById(this.submissionId, true, false, followLink('item')).pipe(
            getFirstSucceededRemoteData(),
            getRemoteDataPayload())
        ])),
      take(1))
      .subscribe(([sectionData, workspaceItem]: [WorkspaceitemSectionFormObject, WorkspaceItem]) => {
        if (isUndefined(this.formModel)) {
          // this.sectionData.errorsToShow = [];
          this.workspaceItem = workspaceItem;
          // Is the first loading so init form
          this.initForm(sectionData);
          this.sectionData.data = sectionData;
          this.subscriptions();
          this.isLoading = false;
          this.cdr.detectChanges();
        }
      });
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
   * Get section status
   *
   * @return Observable<boolean>
   *     the section status
   */
  protected getSectionStatus(): Observable<boolean> {
    const formStatus$ = this.formService.isValid(this.formId);
    const serverValidationStatus$ = this.sectionService.getSectionServerErrors(this.submissionId, this.sectionData.id).pipe(
      map((validationErrors) => isEmpty(validationErrors))
    );

    return observableCombineLatest([formStatus$, serverValidationStatus$]).pipe(
      map(([formValidation, serverSideValidation]: [boolean, boolean]) => formValidation && serverSideValidation)
    );
  }

  /**
   * Check if the section data has been enriched by the server
   *
   * @param sectionData
   *    the section data retrieved from the server
   */
  hasMetadataEnrichment(sectionData: WorkspaceitemSectionFormObject): boolean {

    const sectionDataToCheck = {};
    Object.keys(sectionData).forEach((key) => {
      if (this.sectionMetadata && this.sectionMetadata.includes(key)) {
        sectionDataToCheck[key] = sectionData[key];
      }
    });

    const diffResult = [];

    // compare current form data state with section data retrieved from store
    const diffObj = difference(sectionDataToCheck, this.formData);

    // iterate over differences to check whether they are actually different
    Object.keys(diffObj)
      .forEach((key) => {
        diffObj[key].forEach((value) => {
          // the findIndex extra check excludes values already present in the form but in different positions
          if (value.hasOwnProperty('value') && findIndex(this.formData[key], { value: value.value }) < 0) {
            diffResult.push(value);
          }
        });
      });
    return isNotEmpty(diffResult);
  }

  /**
   * Initialize form model
   *
   * @param sectionData
   *    the section data retrieved from the server
   */
  initForm(sectionData: WorkspaceitemSectionFormObject): void {
    try {
      this.formModel = this.formBuilderService.modelFromConfiguration(
        this.submissionId,
        this.formConfig,
        this.collectionId,
        sectionData,
        this.submissionService.getSubmissionScope()
      );
      const sectionMetadata = this.sectionService.computeSectionConfiguredMetadata(this.formConfig);
      this.sectionService.updateSectionData(this.submissionId, this.sectionData.id, sectionData, this.sectionData.errorsToShow, this.sectionData.serverValidationErrors, sectionMetadata);

    } catch (e) {
      const msg: string = this.translate.instant('error.submission.sections.init-form-error') + e.toString();
      const sectionError: SubmissionSectionError = {
        message: msg,
        path: '/sections/' + this.sectionData.id
      };
      console.error(e.stack);
      this.sectionService.setSectionError(this.submissionId, this.sectionData.id, sectionError);
    }
  }

  /**
   * Update form model
   *
   * @param sectionData
   *    the section data retrieved from the server
   * @param errors
   *    the section errors retrieved from the server
   */
  updateForm(sectionData: WorkspaceitemSectionFormObject, errors: SubmissionSectionError[]): void {

    if (isNotEmpty(sectionData) && !isEqual(sectionData, this.sectionData.data)) {
      this.sectionData.data = sectionData;
      if (this.hasMetadataEnrichment(sectionData)) {
        this.isUpdating = true;
        this.formModel = null;
        this.cdr.detectChanges();
        this.initForm(sectionData);
        this.checksForErrors(errors);
        this.isUpdating = false;
        this.cdr.detectChanges();
      } else if (isNotEmpty(errors) || isNotEmpty(this.sectionData.errorsToShow)) {
        this.checksForErrors(errors);
      }
    } else if (isNotEmpty(errors) || isNotEmpty(this.sectionData.errorsToShow)) {
      this.checksForErrors(errors);
    }

  }

  /**
   * Check if there are form validation error retrieved from server
   *
   * @param errors
   *    the section errors retrieved from the server
   */
  checksForErrors(errors: SubmissionSectionError[]): void {
    this.formService.isFormInitialized(this.formId).pipe(
      find((status: boolean) => status === true && !this.isUpdating))
      .subscribe(() => {
        this.sectionService.checkSectionErrors(this.submissionId, this.sectionData.id, this.formId, errors, this.sectionData.errorsToShow);
        this.sectionData.errorsToShow = errors;
        this.cdr.detectChanges();
      });
  }

  /**
   * Initialize all subscriptions
   */
  subscriptions(): void {
    this.subs.push(
      /**
       * Subscribe to form's data
       */
      this.formService.getFormData(this.formId).pipe(
        distinctUntilChanged())
        .subscribe((formData) => {
          this.formData = formData;
        }),

      /**
       * Subscribe to section state
       */
      this.sectionService.getSectionState(this.submissionId, this.sectionData.id, this.sectionData.sectionType).pipe(
        filter((sectionState: SubmissionSectionObject) => {
          return isNotEmpty(sectionState) && (isNotEmpty(sectionState.data) || isNotEmpty(sectionState.errorsToShow));
        }),
        distinctUntilChanged())
        .subscribe((sectionState: SubmissionSectionObject) => {
          this.fieldsOnTheirWayToBeRemoved = new Map();
          this.sectionMetadata = sectionState.metadata;
          this.updateForm(sectionState.data as WorkspaceitemSectionFormObject, sectionState.errorsToShow);
        })
    );
  }

  /**
   * Copy actual form with filled values and remove all fields with the type-bind property.
   * @param formConfig configuration of the form, it is loaded from the server.
   */
  initFormWithValues(typeValue) {
    // const updatedFormModel = cloneDeep(this.formModel);
    // formConfig.rows.forEach((currentRow, indexRow) => {
    //   currentRow.fields.forEach((field, indexField) => {
    //     // Remove a field or a row with the type-bind
    //     if (isNotEmpty(field.typeBind)) {
    //       currentRow = this.formBuilderService.removeFieldFromRow(currentRow, indexField);
    //       const parsedRow = this.formBuilderService.parseFormRow(this.submissionId, currentRow, this.collectionId,
    //         this.sectionData.data, this.submissionService.getSubmissionScope());
    //       // the row has input field with the type-bind and without type-bind
    //       if (isNotNull(parsedRow)) {
    //         // remove type-bind input field from the row where is another non type-bind input field
    //         updatedFormModel[indexRow] = parsedRow;
    //       } else {
    //         // whole row is type-bind, mark it as removed and remove if is rendered
    //         if (this.isTypeBindFieldRendered(indexRow, indexField, formConfig.rows[indexRow].fields[indexField])) {
    //           // All fields from row was removed -> remove empty row
    //           updatedFormModel[indexRow].hidden = true;
    //           // updatedFormModel.splice(indexRow, 1);
    //           }
    //         this.hiddenRowsIndex.push(indexRow);
    //       }
    //     }
    //   });
    // });
    this.isUpdating = true;
    this.formModel = null;
    this.cdr.detectChanges();
    this.initForm(this.sectionData);
    // this.formModel = updatedFormModel;
    if (isNotEmpty(this.sectionData.errorsToShow)) {
      this.checksForErrors(this.sectionData.errorsToShow);
    }
    this.isUpdating = false;
    this.cdr.detectChanges();
  }

  /**
   * Check if a row with type-bind from the formConfig is rendered in the Submission UI
   * @param indexRow of the row from the formConfig
   * @param indexField of the field of the row from the formConfig
   * @param currentRow row from the formConfig with the only one type-bind field
   */
  isTypeBindFieldRendered(indexRow, indexField, currentRow) {
    let group = null;
    if (isNotNull(this.formModel[indexRow])) {
      if (this.formModel[indexRow] instanceof DynamicRowArrayModel) {
        // @ts-ignore
        group = this.formModel[indexRow].groups;
      } else if (this.formModel[indexRow] instanceof DynamicRowGroupModel) {
        // @ts-ignore
        group = this.formModel[indexRow].group;
      }
    }
    if (isNotEmpty(currentRow.selectableMetadata) && isNotNull(group)) {
      if (currentRow.selectableMetadata[0].metadata === group[indexField].name) {
        return true;
      }
    }
    return false;
  }

  /**
   * Add only fields with the type-bind to the form which type-bind values equals with submission type.
   * @param event onChange event, if was changed dc.type metadata update the form.
   * @param formConfig configuration of the form, it is loaded from the server.
   */
  updateFormBaseOnTypeBind(event, formConfig) {
    const oldFormModel = cloneDeep(this.formModel);
    formConfig.rows.forEach((currentRow, indexRow) => {
      let isTypeBindInRow = false;
      currentRow.fields.forEach((field,indexField) => {
        if (isNotEmpty(field.typeBind)) {
          isTypeBindInRow = true;
          if (!field.typeBind.includes(event.$event.value)) {
            currentRow = this.formBuilderService.removeFieldFromRow(currentRow, indexField);
          }
        }
      });
      if (isTypeBindInRow) {
        const parsedRow = this.formBuilderService.parseFormRow(this.submissionId, currentRow, this.collectionId, this.sectionData.data, this.submissionService.getSubmissionScope());
        if (isNotNull(parsedRow)) {
          // show type-bind row
          if (this.hiddenRowsIndex.includes(indexRow)) {
            parsedRow.hidden = false;
          }
          oldFormModel[indexRow] = parsedRow;
        }
        this.isUpdating = true;
        this.formModel = null;
        this.cdr.detectChanges();
        this.formModel = oldFormModel;
        this.isUpdating = false;
        this.cdr.detectChanges();
      }
    });
  }

  /**
   * Method called when a form dfChange event is fired.
   * Dispatch form operations based on changes.
   *
   * @param event
   *    the [[DynamicFormControlEvent]] emitted
   */
  onChange(event: DynamicFormControlEvent): void {
    this.formOperationsService.dispatchOperationsFromEvent(
      this.pathCombiner,
      event,
      this.previousValue,
      this.hasStoredValue(this.formBuilderService.getId(event.model), this.formOperationsService.getArrayIndexFromEvent(event)));
    const metadata = this.formOperationsService.getFieldPathSegmentedFromChangeEvent(event);
    const value = this.formOperationsService.getFieldValueFromChangeEvent(event);

    if ((environment.submission.autosave.metadata.indexOf(metadata) !== -1 && isNotEmpty(value)) || this.hasRelatedCustomError(metadata)) {
      this.submissionService.dispatchSave(this.submissionId);
    }
    if (event.model.name === 'dc.type') {
      const rawData = typeof this.formConfig === 'string' ? JSON.parse(this.formConfig, parseReviver) : this.formConfig;
      this.initFormWithValues(rawData);
      this.updateFormBaseOnTypeBind(event, rawData);
    }
  }

  private hasRelatedCustomError(medatata): boolean {
    const index = findIndex(this.sectionData.errorsToShow, {path: this.pathCombiner.getPath(medatata).path});
    if (index  !== -1) {
      const error = this.sectionData.errorsToShow[index];
      const validator = error.message.replace('error.validation.', '');
      return !environment.form.validatorMap.hasOwnProperty(validator);
    } else {
      return false;
    }
  }

  /**
   * Method called when a form dfFocus event is fired.
   * Initialize [FormFieldPreviousValueObject] instance.
   *
   * @param event
   *    the [[DynamicFormControlEvent]] emitted
   */
  onFocus(event: DynamicFormControlEvent): void {
    const value = this.formOperationsService.getFieldValueFromChangeEvent(event);
    const path = this.formBuilderService.getPath(event.model);
    if (this.formBuilderService.hasMappedGroupValue(event.model)) {
      this.previousValue.path = path;
      this.previousValue.value = this.formOperationsService.getQualdropValueMap(event);
    } else if (isNotEmpty(value) && ((typeof value === 'object' && isNotEmpty(value.value)) || (typeof value === 'string'))) {
      this.previousValue.path = path;
      this.previousValue.value = value;
    }
  }

  /**
   * Method called when a form remove event is fired.
   * Dispatch form operations based on changes.
   *
   * @param event
   *    the [[DynamicFormControlEvent]] emitted
   */
  onRemove(event: DynamicFormControlEvent): void {
    const fieldId = this.formBuilderService.getId(event.model);
    const fieldIndex = this.formOperationsService.getArrayIndexFromEvent(event);

    // Keep track that this field will be removed
    if (this.fieldsOnTheirWayToBeRemoved.has(fieldId)) {
      const indexes = this.fieldsOnTheirWayToBeRemoved.get(fieldId);
      indexes.push(fieldIndex);
      this.fieldsOnTheirWayToBeRemoved.set(fieldId, indexes);
    } else {
      this.fieldsOnTheirWayToBeRemoved.set(fieldId, [fieldIndex]);
    }

    this.formOperationsService.dispatchOperationsFromEvent(
      this.pathCombiner,
      event,
      this.previousValue,
      this.hasStoredValue(fieldId, fieldIndex));

  }

  /**
   * Check if the specified form field has already a value stored
   *
   * @param fieldId
   *    the section data retrieved from the serverù
   * @param index
   *    the section data retrieved from the server
   */
  hasStoredValue(fieldId, index): boolean {
    if (isNotEmpty(this.sectionData.data)) {
      return this.sectionData.data.hasOwnProperty(fieldId) &&
        isNotEmpty(this.sectionData.data[fieldId][index]) &&
        !this.isFieldToRemove(fieldId, index);
    } else {
      return false;
    }
  }

  /**
   * Check if the specified field is on the way to be removed
   *
   * @param fieldId
   *    the section data retrieved from the serverù
   * @param index
   *    the section data retrieved from the server
   */
  isFieldToRemove(fieldId, index) {
    return this.fieldsOnTheirWayToBeRemoved.has(fieldId) && this.fieldsOnTheirWayToBeRemoved.get(fieldId).includes(index);
  }

  /**
   * Handle the customEvent (ex. drag-drop move event).
   * The customEvent is stored inside event.$event
   * @param $event
   */
  onCustomEvent(event: DynamicFormControlEvent) {
    this.formOperationsService.dispatchOperationsFromEvent(
      this.pathCombiner,
      event,
      this.previousValue,
      null);
  }
}
