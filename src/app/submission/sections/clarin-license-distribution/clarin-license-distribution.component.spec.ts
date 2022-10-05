import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ClarinLicenseDistributionComponent } from './clarin-license-distribution.component';

describe('ClarinLicenseDistributionComponent', () => {
  let component: ClarinLicenseDistributionComponent;
  let fixture: ComponentFixture<ClarinLicenseDistributionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ClarinLicenseDistributionComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ClarinLicenseDistributionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
