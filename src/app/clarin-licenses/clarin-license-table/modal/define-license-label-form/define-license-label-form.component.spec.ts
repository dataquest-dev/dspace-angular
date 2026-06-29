import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { By } from '@angular/platform-browser';
import { SharedModule } from '../../../../shared/shared.module';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { RouterTestingModule } from '@angular/router/testing';
import { HostWindowService } from '../../../../shared/host-window.service';
import { HostWindowServiceStub } from '../../../../shared/testing/host-window-service.stub';
import { DefineLicenseLabelFormComponent } from './define-license-label-form.component';
import { ClarinLicenseLabel } from '../../../../core/shared/clarin/clarin-license-label.model';

/**
 * The test class for the DefineLicenseLabelFormComponent
 */
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

  describe('edit mode', () => {
    let editComponent: DefineLicenseLabelFormComponent;
    let editFixture: ComponentFixture<DefineLicenseLabelFormComponent>;
    const mockLabel = Object.assign(new ClarinLicenseLabel(), {
      id: 1,
      label: 'PUB',
      title: 'Public',
      extended: true,
      icon: []
    });

    beforeEach(() => {
      editFixture = TestBed.createComponent(DefineLicenseLabelFormComponent);
      editComponent = editFixture.componentInstance;
      editComponent.clarinLicenseLabel = mockLabel;
      editFixture.detectChanges();
    });

    it('should detect edit mode when clarinLicenseLabel is set', () => {
      expect(editComponent.isEditMode).toBeTrue();
    });

    it('should pre-fill form with the provided label values', () => {
      const form = (editComponent as any).clarinLicenseLabelForm;
      expect(form.get('label').value).toBe('PUB');
      expect(form.get('title').value).toBe('Public');
      expect(form.get('extended').value).toBeTrue();
    });

    it('should close modal with updated label values on submit in edit mode', () => {
      editComponent.clarinLicenseLabelForm.patchValue({
        label: 'MOD',
        title: 'Modified title',
        extended: false
      });

      editComponent.submitForm();

      expect((editComponent as any).activeModal.close).toHaveBeenCalledWith(
        editComponent.clarinLicenseLabelForm.value
      );
    });

    it('should show the edit mode title in the template', () => {
      const title = editFixture.debugElement.query(By.css('.modal-title')).nativeElement as HTMLElement;

      expect(title.textContent).toContain('clarin.license.label.edit.title');
    });

    it('should display the icon note in edit mode', () => {
      const note = editFixture.debugElement.query(By.css('small.form-text')).nativeElement as HTMLElement;

      expect(note.textContent).toContain('clarin.license.label.edit.icon.note');
    });

    it('should be in create mode when no clarinLicenseLabel is provided', () => {
      expect(component.isEditMode).toBeFalse();
    });
  });

  it('should show the create mode title in the template when no label is provided', () => {
    const title = fixture.debugElement.query(By.css('.modal-title')).nativeElement as HTMLElement;

    expect(title.textContent).toContain('clarin.license.label.create.title');
  });
});
