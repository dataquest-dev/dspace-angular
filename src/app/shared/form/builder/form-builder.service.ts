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
 * The key under which the default type bind field is stored in the type field map, e.g.
 * {'default' -> 'dc_type'}
 */
export const TYPE_BIND_DEFAULT_KEY = 'default';

/**
 * Separator used by the `submit.type-bind.field` property to bind one metadata field to a
 * controlling field other than the default one, e.g. `dc.language.iso=>edm.type`
 */
const TYPE_BIND_FIELD_SEPARATOR = '=>';

@Injectable({ providedIn: 'root' })
export class FormBuilderService extends DynamicFormService {

  /**
   * This map contains the models that control type binding, keyed by model id (`dc_type`, `edm_type`)
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
   * The fields to use for type binding: TYPE_BIND_DEFAULT_KEY -> the default controlling model id,
   * plus one entry per metadata field that is controlled by another field, e.g.
   * `dc.language.iso` -> `edm_type`
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
    this.typeBindModelUpdates = new Subject<string>();

    this.typeFields.set(TYPE_BIND_DEFAULT_KEY, 'dc_type');
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
   * Get the model of the field that controls the type binding of a bound field.
   *
   * @param typeBindFieldRef either the metadata name of the bound field itself - resolved through the
   *   `submit.type-bind.field` map, e.g. `dc.language.iso` -> `edm_type` - or, when the submission form
   *   declares `<type-bind field="edm.type">`, the id of the controlling model itself. When it resolves
   *   to a model that is not part of the current form, the default (usually `dc_type`) model is returned.
   */
  getTypeBindModel(typeBindFieldRef?: string): DynamicFormControlModel {
    const defaultModelId = this.typeFields.get(TYPE_BIND_DEFAULT_KEY);
    const modelId = this.typeFields.get(typeBindFieldRef) ?? typeBindFieldRef ?? defaultModelId;
    return this.typeBindModel.get(modelId) ?? this.typeBindModel.get(defaultModelId);
  }

  setTypeBindModel(model: DynamicFormControlModel) {
    this.typeBindModel.set(model.id, model);
    this.typeBindModelUpdates.next(model.id);
  }

  /**
   * Emits the id of every type bind model as soon as it is registered, so that fields whose
   * controlling model is only parsed later - e.g. because it lives in another form section - can
   * still attach to it.
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

    if (hasValue(typeBindModel)) {
      this.setTypeBindModel(typeBindModel);
    } else {
      this.getTypeBindModelIds(rawData).forEach((typeBindModelId: string) => {
        const foundModel = this.findById(typeBindModelId, rows);
        if (hasValue(foundModel)) {
          this.setTypeBindModel(foundModel);
        }
      });
    }
    return rows;
  }

  /**
   * Collect the ids of every model that can control type binding for the given form configuration:
   * all values of the `submit.type-bind.field` map (the default field plus each `A=>B` override) and
   * every `<type-bind field="...">` declared by a field of this configuration. The latter is read
   * straight from the REST payload, so a controlling model is registered even when the configuration
   * property has not been fetched yet.
   */
  private getTypeBindModelIds(rawData: any): string[] {
    const ids = new Set<string>(this.typeFields.values());
    const collectFromRows = (formRows: FormRowModel[]): void => {
      (formRows || []).forEach((formRow: FormRowModel) => (formRow?.fields || []).forEach((field: FormFieldModel) => {
        if (isNotEmpty(field?.typeBindField)) {
          ids.add(field.typeBindField.replace(/\./g, '_'));
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
   * Get the type bind field(s) from config.
   *
   * `submit.type-bind.field` holds the default controlling field and, optionally, one
   * `<bound field>=><controlling field>` entry per field that is controlled by another field, e.g.
   * `submit.type-bind.field = dc.type, dc.language.iso=>edm.type`. The property may legitimately be
   * declared more than once (dspace.cfg + local.cfg), so duplicated values must be tolerated and the
   * order of the values must not matter.
   */
  setTypeBindFieldFromConfig(): void {
    this.configService.findByPropertyName('submit.type-bind.field').pipe(
      getFirstCompletedRemoteData(),
    ).subscribe((remoteData: any) => {
      // make sure we got a success response from the backend
      if (!remoteData.hasSucceeded) {
        this.typeFields.set(TYPE_BIND_DEFAULT_KEY, 'dc_type');
        return;
      }
      const typeFieldConfigValues: string[] = remoteData.payload.values || [];
      typeFieldConfigValues.forEach((typeFieldConfig: string) => {
        if (typeFieldConfig.includes(TYPE_BIND_FIELD_SEPARATOR)) {
          // `dc.language.iso=>edm.type`: this metadata field is controlled by another field
          const [boundField, controllingField] = typeFieldConfig.split(TYPE_BIND_FIELD_SEPARATOR);
          if (isNotEmpty(boundField?.trim()) && isNotEmpty(controllingField?.trim())) {
            this.typeFields.set(boundField.trim(), controllingField.trim().replace(/\./g, '_'));
          }
        } else if (isNotEmpty(typeFieldConfig?.trim())) {
          // `dc.type`: the default controlling field. A duplicated value just overwrites itself.
          this.typeFields.set(TYPE_BIND_DEFAULT_KEY, typeFieldConfig.trim().replace(/\./g, '_'));
        }
      });
      if (hasNoValue(this.typeFields.get(TYPE_BIND_DEFAULT_KEY))) {
        this.typeFields.set(TYPE_BIND_DEFAULT_KEY, 'dc_type');
      }
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
        this.typeFields.set(TYPE_BIND_DEFAULT_KEY, 'dc_type');
      }
    }
    return this.typeFields.get(TYPE_BIND_DEFAULT_KEY);
  }

}
