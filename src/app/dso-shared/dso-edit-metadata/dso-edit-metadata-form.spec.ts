import { DsoEditMetadataChangeType, DsoEditMetadataForm, DsoEditMetadataValue } from './dso-edit-metadata-form';
import { DSpaceObject } from '../../core/shared/dspace-object.model';
import { MetadataValue } from '../../core/shared/metadata.models';
import { ArrayMoveChangeAnalyzer } from '../../core/data/array-move-change-analyzer.service';
import { Operation } from 'fast-json-patch';

describe('DsoEditMetadataForm', () => {
  let form: DsoEditMetadataForm;
  let dso: DSpaceObject;

  beforeEach(() => {
    dso = Object.assign(new DSpaceObject(), {
      metadata: {
        'dc.title': [
          Object.assign(new MetadataValue(), {
            value: 'Test Title',
            language: 'en',
            place: 0,
          }),
        ],
        'dc.subject': [
          Object.assign(new MetadataValue(), {
            value: 'Subject One',
            language: 'en',
            place: 0,
          }),
          Object.assign(new MetadataValue(), {
            value: 'Subject Two',
            language: 'en',
            place: 1,
          }),
          Object.assign(new MetadataValue(), {
            value: 'Subject Three',
            language: 'en',
            place: 2,
          }),
        ],
      },
    });
    form = new DsoEditMetadataForm(dso.metadata);
  });


  describe('adding a new value', () => {
    beforeEach(() => {
      form.add();
    });

    it('should add an empty value to \"newValue\" with no place yet and editing set to true', () => {
      expect(form.newValue).toBeDefined();
      expect(form.newValue.originalValue.place).toBeUndefined();
      expect(form.newValue.newValue.place).toBeUndefined();
      expect(form.newValue.editing).toBeTrue();
    });

    it('should not mark the form as changed yet', () => {
      expect(form.hasChanges()).toEqual(false);
    });

    describe('and assigning a value and metadata field to it', () => {
      let mdField: string;
      let value: string;
      let expectedPlace: number;

      beforeEach(() => {
        mdField = 'dc.subject';
        value = 'Subject Four';
        form.newValue.newValue.value = value;
        form.setMetadataField(mdField);
        expectedPlace = form.fields[mdField].length - 1;
      });

      it('should add the new value to the values of the relevant field', () => {
        expect(form.fields[mdField][expectedPlace].newValue.value).toEqual(value);
      });

      it('should set its editing flag to false', () => {
        expect(form.fields[mdField][expectedPlace].editing).toBeFalse();
      });

      it('should set newValue.place for ADD operation but leave originalValue.place undefined', () => {
        expect(form.fields[mdField][expectedPlace].newValue.place).toEqual(expectedPlace);
        expect(form.fields[mdField][expectedPlace].originalValue.place).toBeUndefined();
      });

      it('should clear \"newValue\"', () => {
        expect(form.newValue).toBeUndefined();
      });

      it('should mark the form as changed', () => {
        expect(form.hasChanges()).toEqual(true);
      });

      describe('discard', () => {
        beforeEach(() => {
          form.discard();
        });

        it('should remove the new value', () => {
          expect(form.fields[mdField][expectedPlace]).toBeUndefined();
        });

        it('should mark the form as unchanged again', () => {
          expect(form.hasChanges()).toEqual(false);
        });

        describe('reinstate', () => {
          beforeEach(() => {
            form.reinstate();
          });

          it('should re-add the new value', () => {
            expect(form.fields[mdField][expectedPlace].newValue.value).toEqual(value);
          });

          it('should mark the form as changed once again', () => {
            expect(form.hasChanges()).toEqual(true);
          });
        });
      });
    });
  });

  describe('removing a value entirely (not just marking deleted)', () => {
    it('should remove the value on the correct index', () => {
      form.remove('dc.subject', 1);
      expect(form.fields['dc.subject'].length).toEqual(2);
      expect(form.fields['dc.subject'][0].newValue.value).toEqual('Subject One');
      expect(form.fields['dc.subject'][1].newValue.value).toEqual('Subject Three');
    });
  });

  describe('moving a value', () => {
    beforeEach(() => {
      form.fields['dc.subject'][0].newValue.place = form.fields['dc.subject'][1].originalValue.place;
      form.fields['dc.subject'][1].newValue.place = form.fields['dc.subject'][0].originalValue.place;
      form.fields['dc.subject'][0].confirmChanges();
      form.fields['dc.subject'][1].confirmChanges();
    });

    it('should mark the value as changed', () => {
      expect(form.fields['dc.subject'][0].hasChanges()).toEqual(true);
      expect(form.fields['dc.subject'][1].hasChanges()).toEqual(true);
    });

    it('should mark the form as changed', () => {
      expect(form.hasChanges()).toEqual(true);
    });

    describe('discard', () => {
      beforeEach(() => {
        form.discard();
      });

      it('should reset the moved values their places to their original values', () => {
        expect(form.fields['dc.subject'][0].newValue.place).toEqual(form.fields['dc.subject'][0].originalValue.place);
        expect(form.fields['dc.subject'][1].newValue.place).toEqual(form.fields['dc.subject'][1].originalValue.place);
      });

      it('should mark the form as unchanged again', () => {
        expect(form.hasChanges()).toEqual(false);
      });

      describe('reinstate', () => {
        beforeEach(() => {
          form.reinstate();
        });

        it('should move the values to their new places again', () => {
          expect(form.fields['dc.subject'][0].newValue.place).toEqual(form.fields['dc.subject'][1].originalValue.place);
          expect(form.fields['dc.subject'][1].newValue.place).toEqual(form.fields['dc.subject'][0].originalValue.place);
        });

        it('should mark the form as changed once again', () => {
          expect(form.hasChanges()).toEqual(true);
        });
      });
    });
  });

  describe('marking a value deleted', () => {
    beforeEach(() => {
      form.fields['dc.title'][0].change = DsoEditMetadataChangeType.REMOVE;
    });

    it('should mark the value as changed', () => {
      expect(form.fields['dc.title'][0].hasChanges()).toEqual(true);
    });

    it('should mark the form as changed', () => {
      expect(form.hasChanges()).toEqual(true);
    });

    describe('discard', () => {
      beforeEach(() => {
        form.discard();
      });

      it('should remove the deleted mark from the value', () => {
        expect(form.fields['dc.title'][0].change).toBeUndefined();
      });

      it('should mark the form as unchanged again', () => {
        expect(form.hasChanges()).toEqual(false);
      });

      describe('reinstate', () => {
        beforeEach(() => {
          form.reinstate();
        });

        it('should re-mark the value as deleted', () => {
          expect(form.fields['dc.title'][0].change).toEqual(DsoEditMetadataChangeType.REMOVE);
        });

        it('should mark the form as changed once again', () => {
          expect(form.hasChanges()).toEqual(true);
        });
      });
    });
  });

  describe('editing a value', () => {
    const value = 'New title';

    beforeEach(() => {
      form.fields['dc.title'][0].editing = true;
      form.fields['dc.title'][0].newValue.value = value;
    });

    it('should not mark the form as changed yet', () => {
      expect(form.hasChanges()).toEqual(false);
    });

    describe('and confirming the changes', () => {
      beforeEach(() => {
        form.fields['dc.title'][0].confirmChanges(true);
      });

      it('should mark the value as changed', () => {
        expect(form.fields['dc.title'][0].hasChanges()).toEqual(true);
      });

      it('should mark the form as changed', () => {
        expect(form.hasChanges()).toEqual(true);
      });

      describe('discard', () => {
        beforeEach(() => {
          form.discard();
        });

        it('should reset the changed value to its original value', () => {
          expect(form.fields['dc.title'][0].newValue.value).toEqual(form.fields['dc.title'][0].originalValue.value);
        });

        it('should mark the form as unchanged again', () => {
          expect(form.hasChanges()).toEqual(false);
        });

        describe('reinstate', () => {
          beforeEach(() => {
            form.reinstate();
          });

          it('should put the changed value back in place', () => {
            expect(form.fields['dc.title'][0].newValue.value).toEqual(value);
          });

          it('should mark the form as changed once again', () => {
            expect(form.hasChanges()).toEqual(true);
          });
        });
      });
    });
  });

  describe('UPDATE to ADD conversion logic', () => {
    let moveAnalyzer: ArrayMoveChangeAnalyzer<number>;
    let operations: Operation[];

    beforeEach(() => {
      moveAnalyzer = new ArrayMoveChangeAnalyzer();
    });

    describe('when UPDATE operation has undefined originalValue.place', () => {
      beforeEach(() => {
        // Simulate an UPDATE operation with undefined originalValue.place
        const metadataValue = new DsoEditMetadataValue(new MetadataValue());
        metadataValue.originalValue.place = undefined;
        metadataValue.originalValue.value = '';
        metadataValue.newValue.value = 'New Author Name';
        metadataValue.newValue.language = null;
        metadataValue.change = DsoEditMetadataChangeType.UPDATE;

        form.fields['dc.contributor.author'] = [metadataValue];
        operations = form.getOperations(moveAnalyzer);
      });

      it('should convert UPDATE to ADD operation', () => {
        expect(operations.length).toBe(1);
        expect(operations[0].op).toBe('add');
        expect(operations[0].path).toBe('/metadata/dc.contributor.author/-');
        expect((operations[0] as any).value).toEqual({
          value: 'New Author Name',
          language: null
        });
      });
    });

    describe('when UPDATE operation has empty originalValue.value', () => {
      beforeEach(() => {
        // Simulate an UPDATE operation with empty originalValue.value
        const metadataValue = new DsoEditMetadataValue(new MetadataValue());
        metadataValue.originalValue.place = 1;
        metadataValue.originalValue.value = '';
        metadataValue.newValue.value = 'New Author Name';
        metadataValue.newValue.language = null;
        metadataValue.change = DsoEditMetadataChangeType.UPDATE;

        form.fields['dc.contributor.author'] = [metadataValue];
        operations = form.getOperations(moveAnalyzer);
      });

      it('should convert UPDATE to ADD operation', () => {
        expect(operations.length).toBe(1);
        expect(operations[0].op).toBe('add');
        expect(operations[0].path).toBe('/metadata/dc.contributor.author/-');
        expect((operations[0] as any).value).toEqual({
          value: 'New Author Name',
          language: null
        });
      });
    });

    describe('when UPDATE operation has valid originalValue.place and content', () => {
      beforeEach(() => {
        // Simulate a valid UPDATE operation
        const metadataValue = new DsoEditMetadataValue(new MetadataValue());
        metadataValue.originalValue.place = 0;
        metadataValue.originalValue.value = 'Original Author';
        metadataValue.originalValue.language = 'en';
        metadataValue.newValue.value = 'Updated Author';
        metadataValue.newValue.language = 'en';
        metadataValue.change = DsoEditMetadataChangeType.UPDATE;

        form.fields['dc.contributor.author'] = [metadataValue];
        operations = form.getOperations(moveAnalyzer);
      });

      it('should generate REPLACE operation', () => {
        expect(operations.length).toBe(1);
        expect(operations[0].op).toBe('replace');
        expect(operations[0].path).toBe('/metadata/dc.contributor.author/0');
        expect((operations[0] as any).value).toEqual({
          value: 'Updated Author',
          language: 'en'
        });
      });
    });
  });

  describe('ORCID author operations', () => {
    let moveAnalyzer: ArrayMoveChangeAnalyzer<number>;
    let operations: Operation[];

    beforeEach(() => {
      moveAnalyzer = new ArrayMoveChangeAnalyzer();
    });

    describe('ADD operation for ORCID author', () => {
      beforeEach(() => {
        const metadataValue = new DsoEditMetadataValue(new MetadataValue());
        metadataValue.newValue.value = 'Smith, John';
        metadataValue.newValue.language = null;
        metadataValue.newValue.authority = '0000-0000-0000-0000';
        metadataValue.newValue.confidence = 600;
        metadataValue.change = DsoEditMetadataChangeType.ADD;

        form.fields['dc.contributor.author'] = [metadataValue];
        operations = form.getOperations(moveAnalyzer);
      });

      it('should include authority and confidence for ORCID author', () => {
        expect(operations.length).toBe(1);
        expect(operations[0].op).toBe('add');
        expect((operations[0] as any).value).toEqual({
          value: 'Smith, John',
          language: null,
          authority: '0000-0000-0000-0000',
          confidence: 600
        });
      });
    });

    describe('ADD operation for non-ORCID author', () => {
      beforeEach(() => {
        const metadataValue = new DsoEditMetadataValue(new MetadataValue());
        metadataValue.newValue.value = 'Doe, Jane';
        metadataValue.newValue.language = null;
        metadataValue.newValue.authority = '';
        metadataValue.newValue.confidence = null;
        metadataValue.change = DsoEditMetadataChangeType.ADD;

        form.fields['dc.contributor.author'] = [metadataValue];
        operations = form.getOperations(moveAnalyzer);
      });

      it('should not include authority and confidence for non-ORCID author', () => {
        expect(operations.length).toBe(1);
        expect(operations[0].op).toBe('add');
        expect((operations[0] as any).value).toEqual({
          value: 'Doe, Jane',
          language: null
        });
      });
    });

    describe('REPLACE operation for ORCID author', () => {
      beforeEach(() => {
        const metadataValue = new DsoEditMetadataValue(new MetadataValue());
        metadataValue.originalValue.place = 0;
        metadataValue.originalValue.value = 'Smith, John';
        metadataValue.originalValue.authority = '0000-0000-0000-0000';
        metadataValue.originalValue.confidence = 600;
        metadataValue.newValue.value = 'Smith, John A.';
        metadataValue.newValue.language = null;
        metadataValue.newValue.authority = '0000-0000-0000-0000';
        metadataValue.newValue.confidence = 600;
        metadataValue.change = DsoEditMetadataChangeType.UPDATE;

        form.fields['dc.contributor.author'] = [metadataValue];
        operations = form.getOperations(moveAnalyzer);
      });

      it('should include authority and confidence for ORCID author in REPLACE', () => {
        expect(operations.length).toBe(1);
        expect(operations[0].op).toBe('replace');
        expect(operations[0].path).toBe('/metadata/dc.contributor.author/0');
        expect((operations[0] as any).value).toEqual({
          value: 'Smith, John A.',
          language: null,
          authority: '0000-0000-0000-0000',
          confidence: 600
        });
      });
    });
  });

  describe('confidence value handling', () => {
    let moveAnalyzer: ArrayMoveChangeAnalyzer<number>;
    let operations: Operation[];

    beforeEach(() => {
      moveAnalyzer = new ArrayMoveChangeAnalyzer();
    });

    describe('when confidence is -1', () => {
      beforeEach(() => {
        const metadataValue = new DsoEditMetadataValue(new MetadataValue());
        metadataValue.newValue.value = 'Smith, John';
        metadataValue.newValue.language = null;
        metadataValue.newValue.authority = '0000-0000-0000-0000';
        metadataValue.newValue.confidence = -1;
        metadataValue.change = DsoEditMetadataChangeType.ADD;

        form.fields['dc.contributor.author'] = [metadataValue];
        operations = form.getOperations(moveAnalyzer);
      });

      it('should convert -1 confidence to null', () => {
        expect(operations.length).toBe(1);
        expect((operations[0] as any).value.confidence).toBeNull();
      });
    });

    describe('when confidence is undefined', () => {
      beforeEach(() => {
        const metadataValue = new DsoEditMetadataValue(new MetadataValue());
        metadataValue.newValue.value = 'Smith, John';
        metadataValue.newValue.language = null;
        metadataValue.newValue.authority = '0000-0000-0000-0000';
        metadataValue.newValue.confidence = undefined;
        metadataValue.change = DsoEditMetadataChangeType.ADD;

        form.fields['dc.contributor.author'] = [metadataValue];
        operations = form.getOperations(moveAnalyzer);
      });

      it('should convert undefined confidence to null', () => {
        expect(operations.length).toBe(1);
        expect((operations[0] as any).value.confidence).toBeNull();
      });
    });

    describe('when confidence is a valid number', () => {
      beforeEach(() => {
        const metadataValue = new DsoEditMetadataValue(new MetadataValue());
        metadataValue.newValue.value = 'Smith, John';
        metadataValue.newValue.language = null;
        metadataValue.newValue.authority = '0000-0000-0000-0000';
        metadataValue.newValue.confidence = 600;
        metadataValue.change = DsoEditMetadataChangeType.ADD;

        form.fields['dc.contributor.author'] = [metadataValue];
        operations = form.getOperations(moveAnalyzer);
      });

      it('should preserve valid confidence value', () => {
        expect(operations.length).toBe(1);
        expect((operations[0] as any).value.confidence).toBe(600);
      });
    });
  });

  describe('REMOVE operation validation', () => {
    let moveAnalyzer: ArrayMoveChangeAnalyzer<number>;
    let operations: Operation[];

    beforeEach(() => {
      moveAnalyzer = new ArrayMoveChangeAnalyzer();
    });

    describe('when REMOVE operation has invalid originalValue.place', () => {
      beforeEach(() => {
        const metadataValue = new DsoEditMetadataValue(new MetadataValue());
        metadataValue.originalValue.place = undefined;
        metadataValue.originalValue.value = 'Some Author';
        metadataValue.change = DsoEditMetadataChangeType.REMOVE;

        form.fields['dc.contributor.author'] = [metadataValue];
        operations = form.getOperations(moveAnalyzer);
      });

      it('should skip REMOVE operation with invalid place', () => {
        expect(operations.length).toBe(0);
      });
    });

    describe('when REMOVE operation has valid originalValue.place', () => {
      beforeEach(() => {
        const metadataValue = new DsoEditMetadataValue(new MetadataValue());
        metadataValue.originalValue.place = 1;
        metadataValue.originalValue.value = 'Some Author';
        metadataValue.change = DsoEditMetadataChangeType.REMOVE;

        form.fields['dc.contributor.author'] = [metadataValue];
        operations = form.getOperations(moveAnalyzer);
      });

      it('should generate REMOVE operation', () => {
        expect(operations.length).toBe(1);
        expect(operations[0].op).toBe('remove');
        expect(operations[0].path).toBe('/metadata/dc.contributor.author/1');
      });
    });
  });

  describe('setMetadataField for ADD operations', () => {
    beforeEach(() => {
      form.add();
      form.newValue.newValue.value = 'Test Value';
    });

    describe('when setting field for ADD operation', () => {
      beforeEach(() => {
        form.setMetadataField('dc.test');
      });

      it('should not set originalValue.place for ADD operations', () => {
        const addedValue = form.fields['dc.test'][0];
        expect(addedValue.originalValue.place).toBeUndefined();
      });

      it('should set newValue.place for ADD operations', () => {
        const addedValue = form.fields['dc.test'][0];
        expect(addedValue.newValue.place).toBe(0);
      });

      it('should maintain ADD change type', () => {
        const addedValue = form.fields['dc.test'][0];
        expect(addedValue.change).toBe(DsoEditMetadataChangeType.ADD);
      });
    });
  });

  describe('operation ordering and processing', () => {
    let moveAnalyzer: ArrayMoveChangeAnalyzer<number>;
    let operations: Operation[];

    beforeEach(() => {
      moveAnalyzer = new ArrayMoveChangeAnalyzer();
    });

    describe('multiple operations on same field', () => {
      beforeEach(() => {
        // Create multiple operations: UPDATE, REMOVE, ADD
        const updateValue = new DsoEditMetadataValue(new MetadataValue());
        updateValue.originalValue.place = 0;
        updateValue.originalValue.value = 'Original';
        updateValue.newValue.value = 'Updated';
        updateValue.change = DsoEditMetadataChangeType.UPDATE;

        const removeValue = new DsoEditMetadataValue(new MetadataValue());
        removeValue.originalValue.place = 1;
        removeValue.originalValue.value = 'To Remove';
        removeValue.change = DsoEditMetadataChangeType.REMOVE;

        const addValue = new DsoEditMetadataValue(new MetadataValue());
        addValue.newValue.value = 'New Value';
        addValue.change = DsoEditMetadataChangeType.ADD;

        form.fields['dc.test'] = [updateValue, removeValue, addValue];
        operations = form.getOperations(moveAnalyzer);
      });

      it('should generate operations in correct order: replace, remove, add', () => {
        expect(operations.length).toBe(3);
        expect(operations[0].op).toBe('replace');
        expect(operations[1].op).toBe('remove');
        expect(operations[2].op).toBe('add');
      });

      it('should use correct paths for each operation type', () => {
        expect(operations[0].path).toBe('/metadata/dc.test/0'); // replace
        expect(operations[1].path).toBe('/metadata/dc.test/1'); // remove
        expect(operations[2].path).toBe('/metadata/dc.test/-'); // add
      });
    });
  });
});
