import {
  ComponentFixture,
  TestBed,
} from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { of } from 'rxjs';

import { ConfigurationDataService } from '../core/data/configuration-data.service';
import { ActivatedRouteStub } from '../shared/testing/active-router.stub';
import { ContactPageComponent } from './contact-page.component';

describe('ContactPageComponent', () => {
  let component: ContactPageComponent;
  let fixture: ComponentFixture<ContactPageComponent>;
  let mockConfigService: any;

  beforeEach(async () => {
    mockConfigService = jasmine.createSpyObj(['findByPropertyName']);

    await TestBed.configureTestingModule({
      imports: [
        TranslateModule.forRoot(),
        ContactPageComponent,
      ],
      providers: [
        { provide: ConfigurationDataService, useValue: mockConfigService },
        { provide: ActivatedRoute, useValue: new ActivatedRouteStub() },
      ],
    })
      .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ContactPageComponent);
    component = fixture.componentInstance;
    mockConfigService.findByPropertyName.and.returnValue(of({
      payload: {
        values: ['test.email@example.com'],
      },
    }));
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should call findByPropertyName on init', () => {
    expect(mockConfigService.findByPropertyName).toHaveBeenCalledWith('mail.helpdesk');
  });

  it('should set emailToContact from service on init', () => {
    expect(component.emailToContact$.value).toBe('test.email@example.com');
  });
});
