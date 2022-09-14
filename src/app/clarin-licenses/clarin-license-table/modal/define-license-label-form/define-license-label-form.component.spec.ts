import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DefineLicenseLabelFormComponent } from './define-license-label-form.component';

describe('DefineLicenseLabelFormComponent', () => {
  let component: DefineLicenseLabelFormComponent;
  let fixture: ComponentFixture<DefineLicenseLabelFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DefineLicenseLabelFormComponent ]
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
});
