import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ClarinDescriptionItemFieldComponent } from './clarin-description-item-field.component';

describe('ClarinDescriptionItemFieldComponent', () => {
  let component: ClarinDescriptionItemFieldComponent;
  let fixture: ComponentFixture<ClarinDescriptionItemFieldComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ClarinDescriptionItemFieldComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ClarinDescriptionItemFieldComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
