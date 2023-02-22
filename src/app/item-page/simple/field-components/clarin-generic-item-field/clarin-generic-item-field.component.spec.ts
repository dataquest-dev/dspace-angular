import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ClarinGenericItemFieldComponent } from './clarin-generic-item-field.component';

describe('ClarinGenericItemFieldComponent', () => {
  let component: ClarinGenericItemFieldComponent;
  let fixture: ComponentFixture<ClarinGenericItemFieldComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ClarinGenericItemFieldComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ClarinGenericItemFieldComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
