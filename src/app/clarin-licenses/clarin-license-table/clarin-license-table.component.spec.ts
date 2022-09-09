import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ClarinLicenseTableComponent } from './clarin-license-table.component';

describe('ClarinLicenseTableComponent', () => {
  let component: ClarinLicenseTableComponent;
  let fixture: ComponentFixture<ClarinLicenseTableComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ClarinLicenseTableComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ClarinLicenseTableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
