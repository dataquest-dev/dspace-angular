import {
  ComponentFixture,
  TestBed,
} from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { of } from 'rxjs';

import { ConfigurationDataService } from '../../core/data/configuration-data.service';
import { ConfigurationProperty } from '../../core/shared/configuration-property.model';
import { HELP_DESK_PROPERTY } from '../../item-page/tombstone/tombstone.constants';
import { createSuccessfulRemoteDataObject$ } from '../../shared/remote-data.utils';
import { ActivatedRouteStub } from '../../shared/testing/active-router.stub';
import { DuplicateUserErrorComponent } from './duplicate-user-error.component';

describe('DuplicateUserErrorComponent', () => {
  let component: DuplicateUserErrorComponent;
  let fixture: ComponentFixture<DuplicateUserErrorComponent>;
  let mockConfigurationDataService: ConfigurationDataService;

  const activatedRouteStub = Object.assign(new ActivatedRouteStub(), {
    params: of({}),
  });

  mockConfigurationDataService = jasmine.createSpyObj('configurationDataService', {
    findByPropertyName: createSuccessfulRemoteDataObject$(Object.assign(new ConfigurationProperty(), {
      name: HELP_DESK_PROPERTY,
      values: [
        'email',
      ],
    })),
  });

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        TranslateModule.forRoot(),
        DuplicateUserErrorComponent,
      ],
      providers: [
        { provide: ActivatedRoute, useValue: activatedRouteStub },
        { provide: ConfigurationDataService, useValue: mockConfigurationDataService },
      ],
    })
      .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DuplicateUserErrorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
