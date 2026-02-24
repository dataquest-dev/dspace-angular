import { Injectable } from '@angular/core';
import { DynamicFormControlModel, DynamicFormLayoutService } from '@ng-dynamic-forms/core';

/**
 * Global counter to generate unique element IDs across all form instances.
 * This ensures that even when the same metadata field (e.g., metashare.ResourceInfo#ContentInfo.mediaType)
 * appears in multiple submission form sections rendered on the same page, the HTML element IDs are unique.
 */
let nextElementId = 0;

/**
 * WeakMap to cache the unique element ID suffix per model instance.
 * Using WeakMap ensures that when a model is garbage collected, its entry is automatically removed.
 */
const modelElementIdMap = new WeakMap<DynamicFormControlModel, number>();

/**
 * Custom DynamicFormLayoutService that overrides getElementId to produce globally unique HTML element IDs.
 *
 * The base DynamicFormLayoutService.getElementId generates IDs solely from model.id (and array group index),
 * which causes duplicate HTML IDs when the same metadata field appears in multiple submission form sections
 * on the same page. This custom service appends a unique numeric suffix to each model's element ID.
 */
@Injectable()
export class DsDynamicFormLayoutService extends DynamicFormLayoutService {

  /**
   * Returns a globally unique element ID for the given form control model.
   * The ID is computed by appending a unique numeric suffix to the base element ID.
   * The suffix is cached per model instance so that the same model always produces the same element ID.
   *
   * @param model the form control model
   * @returns a unique element ID string
   */
  getElementId(model: DynamicFormControlModel): string {
    if (!modelElementIdMap.has(model)) {
      modelElementIdMap.set(model, nextElementId++);
    }
    const baseId = super.getElementId(model);
    return `${baseId}_${modelElementIdMap.get(model)}`;
  }
}
