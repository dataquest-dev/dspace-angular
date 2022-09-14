import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditLicenseFormComponent } from './edit-license-form.component';

describe('EditLicenseFormComponent', () => {
  let component: EditLicenseFormComponent;
  let fixture: ComponentFixture<EditLicenseFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ EditLicenseFormComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(EditLicenseFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
