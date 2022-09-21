import { ComponentFixture, TestBed } from '@angular/core/testing';

import {ClarinLicenseLabelDataService} from '../../../../core/data/clarin/clarin-license-label-data.service';
import {NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';
import {DomSanitizer} from '@angular/platform-browser';
import {mockLicenseLabelListRD$} from '../../../../shared/testing/clarin-license-mock';
import {SharedModule} from '../../../../shared/shared.module';
import {CommonModule} from '@angular/common';
import {ReactiveFormsModule} from '@angular/forms';
import {TranslateModule} from '@ngx-translate/core';
import {RouterTestingModule} from '@angular/router/testing';
import {PaginationService} from '../../../../core/pagination/pagination.service';
import {PaginationServiceStub} from '../../../../shared/testing/pagination-service.stub';
import {HostWindowService} from '../../../../shared/host-window.service';
import {HostWindowServiceStub} from '../../../../shared/testing/host-window-service.stub';
import {DefineLicenseLabelFormComponent} from './define-license-label-form.component';

describe('DefineLicenseLabelFormComponent', () => {
  let component: DefineLicenseLabelFormComponent;
  let fixture: ComponentFixture<DefineLicenseLabelFormComponent>;

  let modalStub: NgbActiveModal;

  beforeEach(async () => {
    modalStub = jasmine.createSpyObj('modalService', ['close', 'open']);


    await TestBed.configureTestingModule({
      imports: [
        SharedModule,
        CommonModule,
        ReactiveFormsModule,
        TranslateModule.forRoot(),
        RouterTestingModule.withRoutes([])
      ],
      declarations: [ DefineLicenseLabelFormComponent ],
      providers: [
        { provide: NgbActiveModal, useValue: modalStub },
        { provide: HostWindowService, useValue: new HostWindowServiceStub(0) },
      ],
    })
      .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DefineLicenseLabelFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should create clarinLicenseForm on init', () => {
    expect((component as any).clarinLicenseLabelForm).not.toBeNull();
  });

  it('should submit call close with clarinLicenseForm values', () => {
    (component as DefineLicenseLabelFormComponent).submitForm();
    expect((component as any).activeModal.close).toHaveBeenCalledWith(
      (component as DefineLicenseLabelFormComponent).clarinLicenseLabelForm.value);
  });
});

