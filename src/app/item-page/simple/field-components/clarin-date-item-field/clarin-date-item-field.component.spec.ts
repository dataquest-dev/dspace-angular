import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ClarinDateItemFieldComponent } from './clarin-date-item-field.component';

describe('ClarinDateItemFieldComponent', () => {
  let component: ClarinDateItemFieldComponent;
  let fixture: ComponentFixture<ClarinDateItemFieldComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ClarinDateItemFieldComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ClarinDateItemFieldComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
