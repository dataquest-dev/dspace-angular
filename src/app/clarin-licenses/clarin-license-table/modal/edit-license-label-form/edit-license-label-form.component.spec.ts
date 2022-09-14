import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditLicenseLabelFormComponent } from './edit-license-label-form.component';

describe('EditLicenseLabelFormComponent', () => {
  let component: EditLicenseLabelFormComponent;
  let fixture: ComponentFixture<EditLicenseLabelFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ EditLicenseLabelFormComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(EditLicenseLabelFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
