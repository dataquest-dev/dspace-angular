export const mockDynamicFormLayoutService = jasmine.createSpyObj('DynamicFormLayoutService', ['getElementId', 'getClass']);
mockDynamicFormLayoutService.getElementId.and.callFake((model: any) => model?.id ?? '');
mockDynamicFormLayoutService.getClass.and.returnValue('class');

export const mockDynamicFormValidationService = jasmine.createSpyObj('DynamicFormValidationService', {
  showErrorMessages: jasmine.createSpy('showErrorMessages')
});
