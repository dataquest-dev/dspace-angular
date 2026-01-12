import {
  ChangeDetectionStrategy,
  NO_ERRORS_SCHEMA,
} from '@angular/core';
import {
  ComponentFixture,
  TestBed,
  waitForAsync,
} from '@angular/core/testing';
import { DomSanitizer } from '@angular/platform-browser';

import { ConfigurationDataService } from '../../../../../core/data/configuration-data.service';
import { ConfigurationProperty } from '../../../../../core/shared/configuration-property.model';
import { createSuccessfulRemoteDataObject$ } from '../../../../../shared/remote-data.utils';
import { ItemPageCitationFieldComponent } from './item-page-citation.component';

describe('ItemPageCitationFieldComponent', () => {
  let component: ItemPageCitationFieldComponent;
  let fixture: ComponentFixture<ItemPageCitationFieldComponent>;
  let sanitizer: DomSanitizer;
  const mockHandle = '123456789/3';
  let mockConfigurationDataService: ConfigurationDataService;

  mockConfigurationDataService = jasmine.createSpyObj('configurationDataService', {
    findByPropertyName: createSuccessfulRemoteDataObject$(Object.assign(new ConfigurationProperty(), {
      name: 'property',
      values: [
        'value',
      ],
    })),
  });

  beforeEach(waitForAsync(() => {
    void TestBed.configureTestingModule({
      imports: [ItemPageCitationFieldComponent],
      providers: [
        { provide: ConfigurationDataService, useValue: mockConfigurationDataService },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    })
      .overrideComponent(ItemPageCitationFieldComponent, {
        set: { changeDetection: ChangeDetectionStrategy.Default },
      })
      .compileComponents();

    sanitizer = TestBed.inject(DomSanitizer);
  }));

  beforeEach(waitForAsync(() => {
    fixture = TestBed.createComponent(ItemPageCitationFieldComponent);
    component = fixture.componentInstance;
    component.handle = mockHandle;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize citaceProURL$ and citaceProStatus$', () => {
    expect(component.citaceProURL$).toBeDefined();
    expect(component.citaceProStatus$).toBeDefined();
  });
});
