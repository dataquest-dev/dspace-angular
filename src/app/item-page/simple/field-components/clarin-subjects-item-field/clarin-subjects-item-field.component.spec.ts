import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ClarinSubjectsItemFieldComponent } from './clarin-subjects-item-field.component';

describe('ClarinSubjectsItemFieldComponent', () => {
  let component: ClarinSubjectsItemFieldComponent;
  let fixture: ComponentFixture<ClarinSubjectsItemFieldComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ClarinSubjectsItemFieldComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ClarinSubjectsItemFieldComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
