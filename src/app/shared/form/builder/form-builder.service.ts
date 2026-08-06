import {
  Injectable,
  Optional,
} from '@angular/core';
import {
  AbstractControl,
  UntypedFormControl,
  UntypedFormGroup,
} from '@angular/forms';
import {
  DYNAMIC_FORM_CONTROL_TYPE_ARRAY,
  DYNAMIC_FORM_CONTROL_TYPE_CHECKBOX_GROUP,
  DYNAMIC_FORM_CONTROL_TYPE_GROUP,
  DYNAMIC_FORM_CONTROL_TYPE_INPUT,
  DYNAMIC_FORM_CONTROL_TYPE_RADIO_GROUP,
  DynamicFormArrayGroupModel,
  DynamicFormArrayModel,
  DynamicFormComponentService,
  DynamicFormControlEvent,
  DynamicFormControlModel,
  DynamicFormGroupModel,
  DynamicFormService,
  DynamicFormValidationService,
  DynamicPathable,
  parseReviver,
} from '@ng-dynamic-forms/core';
import isObject from 'lodash/isObject';
import isString from 'lodash/isString';
import mergeWith from 'lodash/mergeWith';
import {
  Observable,
  Subject,
} from 'rxjs';

import { FormRowModel } from '../../../core/config/models/config-submission-form.model';
import { SubmissionFormsModel } from '../../../core/config/models/config-submission-forms.model';
import { ConfigurationDataService } from '../../../core/data/configuration-data.service';
import { VIRTUAL_METADATA_PREFIX } from '../../../core/shared/metadata.models';
import { getFirstCompletedRemoteData } from '../../../core/shared/operators';
import {
  dateToString,
  isNgbDateStruct,
} from '../../date.util';
import {
  hasNoValue,
  hasValue,
  isEmpty,
  isNotEmpty,
  isNotNull,
  isNotUndefined,
  isNull,
} from '../../empty.util';
import { DYNAMIC_FORM_CONTROL_TYPE_RELATION_GROUP } from './ds-dynamic-form-ui/ds-dynamic-form-constants';
import {
  CONCAT_GROUP_SUFFIX,
  DynamicConcatModel,
} from './ds-dynamic-form-ui/models/ds-dynamic-concat.model';
import { DsDynamicInputModel } from './ds-dynamic-form-ui/models/ds-dynamic-input.model';
import { DynamicQualdropModel } from './ds-dynamic-form-ui/models/ds-dynamic-qualdrop.model';
import { DynamicRowArrayModel } from './ds-dynamic-form-ui/models/ds-dynamic-row-array-model';
import { DynamicRelationGroupModel } from './ds-dynamic-form-ui/models/relation-group/dynamic-relation-group.model';
import { DYNAMIC_FORM_CONTROL_TYPE_TAG } from './ds-dynamic-form-ui/models/tag/dynamic-tag.model';
import { FormFieldModel } from './models/form-field.model';
import { FormFieldMetadataValueObject } from './models/form-field-metadata-value.model';
import { RowParser } from './parsers/row-parser';

/**
 * Key of the default entry in the type field map, e.g. {'default' -> 'dc_type'}
 */
export const TYPE_BIND_DEFAULT_KEY = 'default';

/**
 * Separator in `submit.type-bind.field`, e.g. `dc.language.iso=>edm.type`
 */
const TYPE_BIND_FIELD_SEPARATOR = '=>';

/**
 * Controlling model id used when `submit.type-bind.field` declares no default
 */
const TYPE_BIND_DEFAULT_MODEL_ID = 'dc_type';

@Injectable({ providedIn: 'root' })
export class FormBuilderService extends DynamicFormService {

  /**
   * The models that control type binding, keyed by model id (`dc_type`, `edm_type`)
   */
  private typeBindModel: Map<string, DynamicFormControlModel>;

  /**
   * Emits the id of a type bind model whenever one is registered
   */
  private typeBindModelUpdates: Subject<string>;

  /**
   * This map contains the active forms model
   */
  private formModels: Map<string, DynamicFormControlModel[]>;

  /**
   * This map contains the active forms control groups
   */
  private formGroups: Map<string, UntypedFormGroup>;

  /**
   * The submission {@link typeBindModel} belongs to; the registry is scoped to it
   */
  private typeBindModelSubmissionId: string;

  /**
   * Rows parsed before `submit.type-bind.field` arrived, re-scanned once it does
   */
  private typeBindParsedRows: DynamicFormControlModel[][];

  /**
   * Whether `submit.type-bind.field` has been processed, i.e. whether {@link typeFields} can still change
   */
  private typeBindConfigLoaded: boolean;

  /**
   * The fields to use for type binding: TYPE_BIND_DEFAULT_KEY -> default controlling model id, plus
   * one entry per bound field, e.g. `dc.language.iso` -> `edm_type`
   */
  private typeFields: Map<string, string>;

  constructor(
    componentService: DynamicFormComponentService,
    validationService: DynamicFormValidationService,
    protected rowParser: RowParser,
    @Optional() protected configService: ConfigurationDataService,
  ) {
    super(componentService, validationService);
    this.formModels = new Map();
    this.formGroups = new Map();
    this.typeFields = new Map();
    this.typeBindModel = new Map();
    this.typeBindParsedRows = [];
    this.typeBindModelUpdates = new Subject<string>();

    this.typeFields.set(TYPE_BIND_DEFAULT_KEY, TYPE_BIND_DEFAULT_MODEL_ID);
    // without a config service the type field map can never change
    this.typeBindConfigLoaded = hasNoValue(this.configService);
    // If optional config service was passed, perform an initial set of type field (default dc_type) for type binds
    if (hasValue(this.configService)) {
      this.setTypeBindFieldFromConfig();
    }
  }

  createDynamicFormControlEvent(control: UntypedFormControl, group: UntypedFormGroup, model: DynamicFormControlModel, type: string): DynamicFormControlEvent {
    const $event = {
      value: (model as any).value,
      autoSave: false,
    };
    const context: DynamicFormArrayGroupModel = (model?.parent instanceof DynamicFormArrayGroupModel) ? model?.parent : null;
    return { $event, context, control: control, group: group, model: model, type };
  }

  /**
   * Get the model of the field controlling the type binding of a bound field, falling back to the
   * default one when the target isn't part of the current form.
   *
   * @param typeBindFieldRef the bound field's own metadata name (mapped through
   *   `submit.type-bind.field`), or the controlling model id when `<type-bind field="...">` is set
   */
  getTypeBindModel(typeBindFieldRef?: string): DynamicFormControlModel | undefined {
    return this.typeBindModel.get(this.resolveTypeBindModelId(typeBindFieldRef))
      ?? this.typeBindModel.get(this.getDefaultTypeBindModelId());
  }

  /**
   * Which model id a type bind reference points at, from configuration only. Unlike
   * {@link getTypeBindModel} the answer doesn't depend on what has been parsed so far.
   */
  resolveTypeBindModelId(typeBindFieldRef?: string): string {
    return this.typeFields.get(typeBindFieldRef) ?? typeBindFieldRef ?? this.getDefaultTypeBindModelId();
  }

  /**
   * Model id of the default controlling field
   */
  private getDefaultTypeBindModelId(): string {
    return this.typeFields.get(TYPE_BIND_DEFAULT_KEY) ?? TYPE_BIND_DEFAULT_MODEL_ID;
  }

  setTypeBindModel(model: DynamicFormControlModel) {
    if (this.typeBindModel.get(model.id) === model) {
      return;
    }
    this.typeBindModel.set(model.id, model);
    this.typeBindModelUpdates.next(model.id);
  }

  /**
   * Emits the id of every type bind model as it is registered, so fields whose controlling model is
   * parsed later can still attach to it.
   */
  getTypeBindModelUpdates(): Observable<string> {
    return this.typeBindModelUpdates.asObservable();
  }

  findById(id: string, groupModel: DynamicFormControlModel[], arrayIndex = null): DynamicFormControlModel | null {

    let result = null;
    const findByIdFn = (findId: string, findGroupModel: DynamicFormControlModel[], findArrayIndex): void => {

      for (const controlModel of findGroupModel) {

        if (controlModel.id === findId) {

          if (this.isArrayGroup(controlModel) && isNotNull(findArrayIndex)) {
            result = (controlModel as DynamicFormArrayModel).get(findArrayIndex);
          } else {
            result = controlModel;
          }
          break;
        }

        if (this.isConcatGroup(controlModel)) {
          if (controlModel.id.match(new RegExp(findId + CONCAT_GROUP_SUFFIX))) {
            result = (controlModel as DynamicConcatModel);
            break;
          }
        }

        if (this.isGroup(controlModel)) {
          findByIdFn(findId, (controlModel as DynamicFormGroupModel).group, findArrayIndex);
        }

        if (this.isArrayGroup(controlModel)
          && (isNull(findArrayIndex) || (controlModel as DynamicFormArrayModel).size > (findArrayIndex))) {
          const index = (isNull(findArrayIndex)) ? 0 : findArrayIndex;
          findByIdFn(findId, (controlModel as DynamicFormArrayModel).get(index).group, index);
        }
      }
    };

    findByIdFn(id, groupModel, arrayIndex);

    return result;
  }

  clearAllModelsValue(groupModel: DynamicFormControlModel[]): void {

    const iterateControlModels = (findGroupModel: DynamicFormControlModel[]): void => {

      for (const controlModel of findGroupModel) {

        if (this.isGroup(controlModel)) {
          iterateControlModels((controlModel as DynamicFormGroupModel).group);
          continue;
        }

        if (this.isArrayGroup(controlModel)) {
          iterateControlModels((controlModel as DynamicFormArrayModel).groupFactory());
          continue;
        }

        if (controlModel.hasOwnProperty('valueChanges')) {
          (controlModel as any).value = undefined;
        }
      }
    };

    iterateControlModels(groupModel);
  }

  getValueFromModel(groupModel: DynamicFormControlModel[]): void {

    let result = Object.create({});

    const customizer = (objValue, srcValue) => {
      if (Array.isArray(objValue)) {
        return objValue.concat(srcValue);
      }
    };

    const normalizeValue = (controlModel, controlValue, controlModelIndex) => {
      const controlLanguage = (controlModel as DsDynamicInputModel).hasLanguages ? (controlModel as DsDynamicInputModel).language : null;

      if (controlModel?.metadataValue?.authority?.includes(VIRTUAL_METADATA_PREFIX)) {
        return controlModel.metadataValue;
      }

      if (isString(controlValue)) {
        return new FormFieldMetadataValueObject(controlValue, controlLanguage, null, null, controlModelIndex);
      } else if (isNgbDateStruct(controlValue)) {
        return new FormFieldMetadataValueObject(dateToString(controlValue));
      } else if (isObject(controlValue)) {
        const authority = (controlValue as any).authority || (controlValue as any).id || null;
        const place = controlModelIndex || (controlValue as any).place;
        if (isNgbDateStruct(controlValue)) {
          return new FormFieldMetadataValueObject(controlValue, controlLanguage, authority, controlValue as any, place);
        } else {
          return new FormFieldMetadataValueObject((controlValue as any).value, controlLanguage, authority, (controlValue as any).display, place, (controlValue as any).confidence);
        }
      }
      return controlValue;
    };

    const iterateControlModels = (findGroupModel: DynamicFormControlModel[], controlModelIndex: number = 0): void => {
      let iterateResult = Object.create({});

      // Iterate over all group's controls
      for (const controlModel of findGroupModel) {

        if (this.isRowGroup(controlModel) && !this.isCustomOrListGroup(controlModel)) {
          iterateResult = mergeWith(iterateResult, iterateControlModels((controlModel as DynamicFormGroupModel).group), customizer);
          continue;
        }

        if (this.isGroup(controlModel) && !this.isCustomOrListGroup(controlModel)) {
          iterateResult[controlModel.name] = iterateControlModels((controlModel as DynamicFormGroupModel).group);
          continue;
        }

        if (this.isRowArrayGroup(controlModel)) {
          for (const arrayItemModel of (controlModel as DynamicRowArrayModel).groups) {
            iterateResult = mergeWith(iterateResult, iterateControlModels(arrayItemModel.group, arrayItemModel.index), customizer);
          }
          continue;
        }

        if (this.isArrayGroup(controlModel)) {
          iterateResult[controlModel.name] = [];
          for (const arrayItemModel of (controlModel as DynamicFormArrayModel).groups) {
            iterateResult[controlModel.name].push(iterateControlModels(arrayItemModel.group, arrayItemModel.index));
          }
          continue;
        }

        let controlId;
        // Get the field's name
        if (this.isQualdropGroup(controlModel)) {
          // If is instance of DynamicQualdropModel take the qualdrop id as field's name
          controlId = (controlModel as DynamicQualdropModel).qualdropId;
        } else {
          controlId = controlModel.name;
        }

        if (this.isRelationGroup(controlModel)) {
          const values = (controlModel as DynamicRelationGroupModel).getGroupValue();
          values.forEach((groupValue, groupIndex) => {
            const newGroupValue = Object.create({});
            Object.keys(groupValue)
              .forEach((key) => {
                const normValue = normalizeValue(controlModel, groupValue[key], groupIndex);
                if (isNotEmpty(normValue) && normValue.hasValue()) {
                  if (iterateResult.hasOwnProperty(key)) {
                    iterateResult[key].push(normValue);
                  } else {
                    iterateResult[key] = [normValue];
                  }
                }
              });
          });
        } else if (isNotUndefined((controlModel as any).value) && isNotEmpty((controlModel as any).value)) {
          const controlArrayValue = [];
          // Normalize control value as an array of FormFieldMetadataValueObject
          const values = Array.isArray((controlModel as any).value) ? (controlModel as any).value : [(controlModel as any).value];
          values.forEach((controlValue) => {
            controlArrayValue.push(normalizeValue(controlModel, controlValue, controlModelIndex));
          });

          if (controlId && iterateResult.hasOwnProperty(controlId) && isNotNull(iterateResult[controlId])) {
            iterateResult[controlId] = iterateResult[controlId].concat(controlArrayValue);
          } else {
            iterateResult[controlId] = isNotEmpty(controlArrayValue) ? controlArrayValue : null;
          }
        }

      }

      return iterateResult;
    };

    result = iterateControlModels(groupModel);

    return result;
  }

  modelFromConfiguration(submissionId: string, json: string | SubmissionFormsModel, scopeUUID: string, sectionData: any = {},
    submissionScope?: string, readOnly = false, typeBindModel = null,
    isInnerForm = false): DynamicFormControlModel[] | never {
    let rows: DynamicFormControlModel[] = [];
    const rawData = typeof json === 'string' ? JSON.parse(json, parseReviver) : json;
    if (rawData.rows && !isEmpty(rawData.rows)) {
      rawData.rows.forEach((currentRow) => {
        const rowParsed = this.rowParser.parse(submissionId, currentRow, scopeUUID, sectionData, submissionScope,
          readOnly, this.getTypeField());
        if (isNotNull(rowParsed)) {
          if (Array.isArray(rowParsed)) {
            rows = rows.concat(rowParsed);
          } else {
            rows.push(rowParsed);
          }
        }
      });
    }

    this.resetTypeBindModelsOnSubmissionChange(submissionId);

    if (hasValue(typeBindModel)) {
      this.setTypeBindModel(typeBindModel);
    } else {
      if (!this.typeBindConfigLoaded) {
        // bounded on purpose: once the property is in, every controlling id is known at parse time
        this.typeBindParsedRows.push(rows);
      }
      this.registerTypeBindModels(this.getTypeBindModelIds(rawData), rows);
    }
    return rows;
  }

  /**
   * Drop the models registered by another submission. The registry has to survive across sections of
   * one submission (a controlling field may live in another section), but not across submissions.
   */
  private resetTypeBindModelsOnSubmissionChange(submissionId: string): void {
    if (this.typeBindModelSubmissionId !== submissionId) {
      this.typeBindModelSubmissionId = submissionId;
      this.typeBindModel.clear();
      this.typeBindParsedRows = [];
    }
  }

  /**
   * Register every model of the given rows whose id is one of the given controlling field ids
   */
  private registerTypeBindModels(modelIds: string[], rows: DynamicFormControlModel[]): void {
    modelIds.forEach((typeBindModelId: string) => {
      const foundModel = this.findById(typeBindModelId, rows);
      if (hasValue(foundModel)) {
        this.setTypeBindModel(foundModel);
      }
    });
  }

  /**
   * Ids of every model that can control type binding here: the `submit.type-bind.field` values plus
   * every `<type-bind field="...">` of this configuration, read straight from the REST payload so
   * they are known even before that property arrives.
   */
  private getTypeBindModelIds(rawData: any): string[] {
    const ids = new Set<string>(this.typeFields.values());
    const collectFromRows = (formRows: FormRowModel[]): void => {
      (formRows || []).forEach((formRow: FormRowModel) => (formRow?.fields || []).forEach((field: FormFieldModel) => {
        // trim like FieldParser.getTypeBindFieldRef, or a padded value registers ' edm_type '
        const typeBindField = field?.typeBindField?.trim();
        if (isNotEmpty(typeBindField)) {
          ids.add(typeBindField.replace(/\./g, '_'));
        }
        collectFromRows(field?.rows);
      }));
    };
    collectFromRows(rawData?.rows);
    return Array.from(ids);
  }

  isModelInCustomGroup(model: DynamicFormControlModel): boolean {
    return this.isCustomGroup((model as any).parent);
  }

  hasArrayGroupValue(model: DynamicFormControlModel): boolean {
    return model && (this.isListGroup(model) || model.type === DYNAMIC_FORM_CONTROL_TYPE_TAG);
  }

  hasMappedGroupValue(model: DynamicFormControlModel): boolean {
    return (this.isQualdropGroup((model as any).parent)
      || this.isRelationGroup((model as any).parent));
  }

  isGroup(model: DynamicFormControlModel): boolean {
    return model && (model.type === DYNAMIC_FORM_CONTROL_TYPE_GROUP || model.type === DYNAMIC_FORM_CONTROL_TYPE_CHECKBOX_GROUP);
  }

  isQualdropGroup(model: DynamicFormControlModel): boolean {
    return (model && model.type === DYNAMIC_FORM_CONTROL_TYPE_GROUP && hasValue((model as any).qualdropId));
  }

  isCustomGroup(model: DynamicFormControlModel): boolean {
    return model && ((model as any).type === DYNAMIC_FORM_CONTROL_TYPE_GROUP && (model as any).isCustomGroup === true);
  }

  isConcatGroup(model: DynamicFormControlModel): boolean {
    return this.isCustomGroup(model) && (model.id.indexOf(CONCAT_GROUP_SUFFIX) !== -1);
  }

  isRowGroup(model: DynamicFormControlModel): boolean {
    return model && ((model as any).type === DYNAMIC_FORM_CONTROL_TYPE_GROUP && (model as any).isRowGroup === true);
  }

  isCustomOrListGroup(model: DynamicFormControlModel): boolean {
    return model &&
      (this.isCustomGroup(model)
        || this.isListGroup(model));
  }

  isListGroup(model: DynamicFormControlModel): boolean {
    return model &&
      ((model.type === DYNAMIC_FORM_CONTROL_TYPE_CHECKBOX_GROUP && (model as any).isListGroup === true)
        || (model.type === DYNAMIC_FORM_CONTROL_TYPE_RADIO_GROUP && (model as any).isListGroup === true));
  }

  isRelationGroup(model: DynamicFormControlModel): boolean {
    return model && model.type === DYNAMIC_FORM_CONTROL_TYPE_RELATION_GROUP;
  }

  isRowArrayGroup(model: DynamicFormControlModel): boolean {
    return model.type === DYNAMIC_FORM_CONTROL_TYPE_ARRAY && (model as any).isRowArray === true;
  }

  isArrayGroup(model: DynamicFormControlModel): boolean {
    return model.type === DYNAMIC_FORM_CONTROL_TYPE_ARRAY;
  }

  isInputModel(model: DynamicFormControlModel): boolean {
    return model.type === DYNAMIC_FORM_CONTROL_TYPE_INPUT;
  }

  getFormControlById(id: string, formGroup: UntypedFormGroup, groupModel: DynamicFormControlModel[], index = 0): AbstractControl {
    const fieldModel = this.findById(id, groupModel, index);
    return isNotEmpty(fieldModel) ? formGroup.get(this.getPath(fieldModel)) : null;
  }

  getFormControlByModel(formGroup: UntypedFormGroup, fieldModel: DynamicFormControlModel): AbstractControl {
    return isNotEmpty(fieldModel) ? formGroup.get(this.getPath(fieldModel)) : null;
  }

  /**
   * Note (discovered while debugging) this is not the ID as used in the form,
   * but the first part of the path needed in a patch operation:
   * e.g. add foo/0 -> the id is 'foo'
   */
  getId(model: DynamicPathable): string {
    let tempModel: DynamicFormControlModel;

    if (this.isArrayGroup(model as DynamicFormControlModel)) {
      return model.index.toString();
    } else if (this.isModelInCustomGroup(model as DynamicFormControlModel)) {
      tempModel = (model as any).parent;
    } else {
      tempModel = (model as any);
    }

    return (tempModel.id !== tempModel.name) ? tempModel.name : tempModel.id;
  }

  /**
   * If present, remove form model from formModels map
   * @param id id of model
   */
  removeFormModel(id: string): void {
    if (this.formModels.has(id)) {
      this.formModels.delete(id);
    }
  }

  /**
   * Add new form model to formModels map
   * @param id id of model
   * @param formGroup FormGroup
   */
  addFormGroups(id: string, formGroup: UntypedFormGroup): void {
    this.formGroups.set(id, formGroup);
  }

  /**
   * If present, remove form model from formModels map
   * @param id id of model
   */
  removeFormGroup(id: string): void {
    if (this.formGroups.has(id)) {
      this.formGroups.delete(id);
    }
  }

  /**
   * Calculate the metadata list related to the event.
   * @param event
   */
  getMetadataIdsFromEvent(event: DynamicFormControlEvent): string[] {

    let model = event.model;
    while (model.parent) {
      model = model.parent as any;
    }

    const iterateControlModels = (findGroupModel: DynamicFormControlModel[], controlModelIndex: number = 0): string[] => {
      let iterateResult = Object.create({});

      // Iterate over all group's controls
      for (const controlModel of findGroupModel) {

        if (this.isRowGroup(controlModel) && !this.isCustomOrListGroup(controlModel)) {
          iterateResult = mergeWith(iterateResult, iterateControlModels((controlModel as DynamicFormGroupModel).group));
          continue;
        }

        if (this.isGroup(controlModel) && !this.isCustomOrListGroup(controlModel)) {
          iterateResult[controlModel.name] = iterateControlModels((controlModel as DynamicFormGroupModel).group);
          continue;
        }

        if (this.isRowArrayGroup(controlModel)) {
          for (const arrayItemModel of (controlModel as DynamicRowArrayModel).groups) {
            iterateResult = mergeWith(iterateResult, iterateControlModels(arrayItemModel.group, arrayItemModel.index));
          }
          continue;
        }

        if (this.isArrayGroup(controlModel)) {
          iterateResult[controlModel.name] = [];
          for (const arrayItemModel of (controlModel as DynamicFormArrayModel).groups) {
            iterateResult[controlModel.name].push(iterateControlModels(arrayItemModel.group, arrayItemModel.index));
          }
          continue;
        }

        let controlId;
        // Get the field's name
        if (this.isQualdropGroup(controlModel)) {
          // If is instance of DynamicQualdropModel take the qualdrop id as field's name
          controlId = (controlModel as DynamicQualdropModel).qualdropId;
        } else {
          controlId = controlModel.name;
        }

        if (this.isRelationGroup(controlModel)) {
          const values = (controlModel as DynamicRelationGroupModel).getGroupValue();
          values.forEach((groupValue, groupIndex) => {
            Object.keys(groupValue).forEach((key) => {
              iterateResult[key] = true;
            });
          });
        } else {
          iterateResult[controlId] = true;
        }

      }

      return iterateResult;
    };

    const result = iterateControlModels([model]);

    return Object.keys(result);
  }

  /**
   * Get the type bind field(s) from config, e.g.
   * `submit.type-bind.field = dc.type, dc.language.iso=>edm.type`: the default controlling field plus
   * one `<bound field>=><controlling field>` entry per overridden field. The property may be declared
   * in both dspace.cfg and local.cfg, so duplicates and order must not matter.
   */
  setTypeBindFieldFromConfig(): void {
    this.configService.findByPropertyName('submit.type-bind.field').pipe(
      getFirstCompletedRemoteData(),
    ).subscribe((remoteData: any) => {
      // whatever the outcome, the type field map cannot change any more
      this.typeBindConfigLoaded = true;
      // make sure we got a success response from the backend
      if (!remoteData.hasSucceeded) {
        this.typeFields.set(TYPE_BIND_DEFAULT_KEY, TYPE_BIND_DEFAULT_MODEL_ID);
        this.typeBindParsedRows = [];
        return;
      }
      const typeFieldConfigValues: string[] = remoteData.payload.values || [];
      typeFieldConfigValues.forEach((rawValue: string) => {
        const typeFieldConfig = rawValue?.trim();
        if (isEmpty(typeFieldConfig)) {
          return;
        }
        if (!typeFieldConfig.includes(TYPE_BIND_FIELD_SEPARATOR)) {
          // `dc.type`: the default controlling field
          this.typeFields.set(TYPE_BIND_DEFAULT_KEY, typeFieldConfig.replace(/\./g, '_'));
          return;
        }
        // `dc.language.iso=>edm.type`: this field is controlled by another one
        const parts = typeFieldConfig.split(TYPE_BIND_FIELD_SEPARATOR).map((part: string) => part.trim());
        if (parts.length !== 2 || parts.some((part: string) => isEmpty(part))) {
          console.warn(`Ignoring malformed submit.type-bind.field value "${rawValue}", expected "<bound field>${TYPE_BIND_FIELD_SEPARATOR}<controlling field>"`);
          return;
        }
        this.typeFields.set(parts[0], parts[1].replace(/\./g, '_'));
      });
      if (hasNoValue(this.typeFields.get(TYPE_BIND_DEFAULT_KEY))) {
        this.typeFields.set(TYPE_BIND_DEFAULT_KEY, TYPE_BIND_DEFAULT_MODEL_ID);
      }
      // forms parsed before the property arrived didn't know the `A=>B` overrides yet
      const typeBindModelIds = Array.from(this.typeFields.values());
      this.typeBindParsedRows.forEach((rows: DynamicFormControlModel[]) => this.registerTypeBindModels(typeBindModelIds, rows));
      this.typeBindParsedRows = [];
    });
  }

  /**
   * Get the default type field. If it isn't already set, and a ConfigurationDataService is provided,
   * set (with subscribe) from back end. Otherwise, get/set a default "dc_type" value
   */
  getTypeField(): string {
    if (hasNoValue(this.typeFields.get(TYPE_BIND_DEFAULT_KEY))) {
      if (hasValue(this.configService)) {
        this.setTypeBindFieldFromConfig();
      } else {
        this.typeFields.set(TYPE_BIND_DEFAULT_KEY, TYPE_BIND_DEFAULT_MODEL_ID);
      }
    }
    return this.getDefaultTypeBindModelId();
  }

}
