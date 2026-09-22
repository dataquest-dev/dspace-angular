import {
  fakeAsync,
  TestBed,
  tick,
} from '@angular/core/testing';
import { UntypedFormControl } from '@angular/forms';
import { of } from 'rxjs';

import { MetadataFieldDataService } from '../../core/data/metadata-field-data.service';
import { buildPaginatedList } from '../../core/data/paginated-list.model';
import { MetadataField } from '../../core/metadata/metadata-field.model';
import { PageInfo } from '../../core/shared/page-info.model';
import { createSuccessfulRemoteDataObject } from '../remote-data.utils';
import { MetadataFieldValidator } from './metadatafield-validator.directive';

const matches = (totalElements: number) => createSuccessfulRemoteDataObject(
  buildPaginatedList(
    Object.assign(new PageInfo(), { totalElements }),
    totalElements > 0 ? [new MetadataField()] : [],
  ),
);

describe('MetadataFieldValidator', () => {
  let validator: MetadataFieldValidator;
  let metadataFieldService: jasmine.SpyObj<MetadataFieldDataService>;

  /**
   * The app builds it the way validation-suggestions.component.ts does: an injected service whose
   * validate() is bound onto a reactive control's asyncValidators. Its [ngModel] selector is used
   * by no template in src/.
   */
  const control = (value: string) => new UntypedFormControl(value, {
    asyncValidators: [validator.validate.bind(validator)],
  });

  beforeEach(() => {
    metadataFieldService = jasmine.createSpyObj('MetadataFieldDataService', ['findByExactFieldName']);

    TestBed.configureTestingModule({
      providers: [
        MetadataFieldValidator,
        { provide: MetadataFieldDataService, useValue: metadataFieldService },
      ],
    });

    validator = TestBed.inject(MetadataFieldValidator);
  });

  it('should accept a name that matches exactly one metadata field', fakeAsync(() => {
    metadataFieldService.findByExactFieldName.and.returnValue(of(matches(1)));

    const c = control('dc.title');
    tick(500);

    expect(c.errors).toBeNull();
    expect(metadataFieldService.findByExactFieldName).toHaveBeenCalledWith('dc.title');
  }));

  it('should reject a name that matches no metadata field', fakeAsync(() => {
    metadataFieldService.findByExactFieldName.and.returnValue(of(matches(0)));

    const c = control('dc.nonexistent');
    tick(500);

    expect(c.errors).toEqual({ invalidMetadataField: { value: 'dc.nonexistent' } });
  }));

  it('should reject a name without a dot before asking the service', fakeAsync(() => {
    const c = control('title');
    tick(500);

    expect(c.errors).toEqual({ invalidMetadataField: { value: 'title' } });
    expect(metadataFieldService.findByExactFieldName).not.toHaveBeenCalled();
  }));

  it('should reject an empty value before asking the service', fakeAsync(() => {
    const c = control('');
    tick(500);

    expect(c.errors).toEqual({ invalidMetadataField: { value: '' } });
    expect(metadataFieldService.findByExactFieldName).not.toHaveBeenCalled();
  }));

  it('should hold the control pending until the debounce has elapsed', fakeAsync(() => {
    metadataFieldService.findByExactFieldName.and.returnValue(of(matches(1)));

    const c = control('dc.title');
    tick(499);
    expect(c.status).toBe('PENDING');

    tick(1);
    expect(c.status).toBe('VALID');
  }));
});
