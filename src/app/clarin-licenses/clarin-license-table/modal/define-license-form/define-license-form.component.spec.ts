import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DefineLicenseFormComponent } from './define-license-form.component';

describe('DefineLicenseFormComponent', () => {
  let component: DefineLicenseFormComponent;
  let fixture: ComponentFixture<DefineLicenseFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DefineLicenseFormComponent ]
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
});
