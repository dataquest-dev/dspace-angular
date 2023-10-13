import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ClarinAllLicensesPageComponent } from './clarin-all-licenses-page.component';

describe('ClarinAllLicensesPageComponent', () => {
  let component: ClarinAllLicensesPageComponent;
  let fixture: ComponentFixture<ClarinAllLicensesPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ClarinAllLicensesPageComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ClarinAllLicensesPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
