import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DefineLicenseFormComponent } from './define-license-form.component';
import {ClarinLicenseTableComponent} from '../../clarin-license-table.component';
import {defaultPagination} from '../../../clarin-license-table-pagination';
import {SharedModule} from '../../../../shared/shared.module';
import {CommonModule} from '@angular/common';
import {ReactiveFormsModule} from '@angular/forms';
import {TranslateModule} from '@ngx-translate/core';
import {RouterTestingModule} from '@angular/router/testing';
import {RequestService} from '../../../../core/data/request.service';
import {ClarinLicenseDataService} from '../../../../core/data/clarin/clarin-license-data.service';
import {ClarinLicenseLabelDataService} from '../../../../core/data/clarin/clarin-license-label-data.service';
import {PaginationService} from '../../../../core/pagination/pagination.service';
import {PaginationServiceStub} from '../../../../shared/testing/pagination-service.stub';
import {NotificationsService} from '../../../../shared/notifications/notifications.service';
import {NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';
import {HostWindowService} from '../../../../shared/host-window.service';
import {HostWindowServiceStub} from '../../../../shared/testing/host-window-service.stub';
import {NotificationsServiceStub} from '../../../../shared/testing/notifications-service.stub';
import {of as observableOf} from 'rxjs';
import {DomSanitizer} from '@angular/platform-browser';
import {mockLicenseLabelListRD$} from '../../../../shared/testing/clarin-license-mock';
import {FormBuilderService} from '../../../../shared/form/builder/form-builder.service';

describe('DefineLicenseFormComponent', () => {
  let component: DefineLicenseFormComponent;
  let fixture: ComponentFixture<DefineLicenseFormComponent>;

  let clarinLicenseLabelDataService: ClarinLicenseLabelDataService;
  let modalStub: NgbActiveModal;
  let sanitizerStub: DomSanitizer;

  beforeEach(async () => {
    clarinLicenseLabelDataService = jasmine.createSpyObj('clarinLicenseLabelService', {
      findAll: mockLicenseLabelListRD$
    });
    modalStub = jasmine.createSpyObj('modalService', ['close', 'open']);
    sanitizerStub = jasmine.createSpyObj('sanitizer', {
      bypassSecurityTrustUrl: null
    });

    await TestBed.configureTestingModule({
      imports: [
        SharedModule,
        CommonModule,
        ReactiveFormsModule,
        TranslateModule.forRoot(),
        RouterTestingModule.withRoutes([])
      ],
      declarations: [ DefineLicenseFormComponent ],
      providers: [
        { provide: ClarinLicenseLabelDataService, useValue: clarinLicenseLabelDataService },
        { provide: PaginationService, useValue: new PaginationServiceStub() },
        { provide: NgbActiveModal, useValue: modalStub },
        { provide: DomSanitizer, useValue: sanitizerStub },
        { provide: HostWindowService, useValue: new HostWindowServiceStub(0) },
      ],
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DefineLicenseFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should create clarinLicenseForm on init', () => {
    expect((component as any).clarinLicenseForm).not.toBeNull();
  });

  it('should load and assign extended and non extended clarin license labels options ' +
    'to the specific arrays on init',() => {
    expect((component as any).clarinLicenseLabelOptions).not.toBeNull();
    expect((component as any).extendedClarinLicenseLabelOptions).not.toBeNull();
    expect((component as any).clarinLicenseLabelOptions?.length).toBe(1);
    expect((component as any).extendedClarinLicenseLabelOptions?.length).toBe(1);
  });

  it('should submit call close with clarinLicenseForm values', () => {
    (component as DefineLicenseFormComponent).submitForm();
    expect((component as any).activeModal.close).toHaveBeenCalledWith(
      (component as DefineLicenseFormComponent).clarinLicenseForm.value);
  });
});
