import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ClarinSponsorItemFieldComponent } from './clarin-sponsor-item-field.component';

describe('ClarinSponsorItemFieldComponent', () => {
  let component: ClarinSponsorItemFieldComponent;
  let fixture: ComponentFixture<ClarinSponsorItemFieldComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ClarinSponsorItemFieldComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ClarinSponsorItemFieldComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
