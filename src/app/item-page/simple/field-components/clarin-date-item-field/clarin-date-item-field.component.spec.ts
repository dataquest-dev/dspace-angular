import {
  ComponentFixture,
  TestBed,
} from '@angular/core/testing';
import { By } from '@angular/platform-browser';

import { Item } from '../../../../core/shared/item.model';
import { ClarinDateService } from '../../../../shared/clarin-date.service';
import { createSuccessfulRemoteDataObject$ } from '../../../../shared/remote-data.utils';
import { createPaginatedList } from '../../../../shared/testing/utils.test';
import { ClarinDateItemFieldComponent } from './clarin-date-item-field.component';

describe('ClarinDateItemFieldComponent', () => {
  let component: ClarinDateItemFieldComponent;
  let fixture: ComponentFixture<ClarinDateItemFieldComponent>;
  let clarinDateService: ClarinDateService;

  const mockItem: Item = Object.assign(new Item(), {
    bundles: createSuccessfulRemoteDataObject$(createPaginatedList([])),
    metadata: {
      'dc.identifier.uri': [
        {
          language: 'en_US',
          value: 'some handle',
        },
      ],
    },
  });

  beforeEach(async () => {
    clarinDateService = jasmine.createSpyObj('clarinDateService', {
      composeItemDate: '2020-01-01',
    });

    await TestBed.configureTestingModule({
      imports: [
        ClarinDateItemFieldComponent,
      ],
      providers: [
        { provide: ClarinDateService, useValue: clarinDateService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ClarinDateItemFieldComponent);
    component = fixture.componentInstance;
    component.item = mockItem;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should compose the displayed date from the item', () => {
    expect(clarinDateService.composeItemDate).toHaveBeenCalledWith(mockItem);
    expect(component.updatedDateValue.value).toEqual('2020-01-01');
  });

  it('should render the composed date', () => {
    expect(fixture.debugElement.query(By.css('div')).nativeElement.textContent)
      .toContain('2020-01-01');
  });
});
