import { DsDynamicFormLayoutService } from './ds-dynamic-form-layout.service';
import { DynamicInputModel } from '@ng-dynamic-forms/core';

describe('DsDynamicFormLayoutService', () => {
  let service: DsDynamicFormLayoutService;

  beforeEach(() => {
    service = new DsDynamicFormLayoutService();
  });

  it('should return an element ID that includes the base model id', () => {
    const model = new DynamicInputModel({ id: 'test_field' });
    const elementId = service.getElementId(model);
    expect(elementId).toContain('test_field');
  });

  it('should return the same element ID for the same model instance', () => {
    const model = new DynamicInputModel({ id: 'test_field' });
    const id1 = service.getElementId(model);
    const id2 = service.getElementId(model);
    expect(id1).toEqual(id2);
  });

  it('should return different element IDs for different model instances with the same id', () => {
    const model1 = new DynamicInputModel({ id: 'same_id' });
    const model2 = new DynamicInputModel({ id: 'same_id' });
    const id1 = service.getElementId(model1);
    const id2 = service.getElementId(model2);
    expect(id1).not.toEqual(id2);
    // Both should contain the base id
    expect(id1).toContain('same_id');
    expect(id2).toContain('same_id');
  });

  it('should return different element IDs for different model instances with different ids', () => {
    const model1 = new DynamicInputModel({ id: 'field_a' });
    const model2 = new DynamicInputModel({ id: 'field_b' });
    const id1 = service.getElementId(model1);
    const id2 = service.getElementId(model2);
    expect(id1).not.toEqual(id2);
  });
});
