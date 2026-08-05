import { Deserialize } from 'cerialize';

import { FormFieldModel } from './form-field.model';

describe('FormFieldModel', () => {

  it('should deserialize the type bind configuration coming from submission-forms.xml', () => {
    // shape of a single field in GET /api/config/submissionforms/<name>
    const field = Deserialize({
      label: 'Pick the languages of the TEXT',
      mandatory: 'true',
      repeatable: true,
      selectableMetadata: [{ metadata: 'dc.language.iso' }],
      typeBind: ['TEXT'],
      typeBindField: 'edm.type',
    }, FormFieldModel) as FormFieldModel;

    expect(field.typeBind).toEqual(['TEXT']);
    // without @autoserialize on typeBindField the per-field binding is dropped before the parser sees it
    expect(field.typeBindField).toEqual('edm.type');
  });

  it('should leave typeBindField undefined when the field has no <type-bind field="...">', () => {
    const field = Deserialize({
      label: 'Title',
      mandatory: 'true',
      repeatable: false,
      selectableMetadata: [{ metadata: 'dc.title' }],
      typeBind: [],
    }, FormFieldModel) as FormFieldModel;

    expect(field.typeBindField).toBeUndefined();
  });
});
