import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ClarinLicenseAgreementPageComponent } from './clarin-license-agreement-page.component';

describe('ClarinLicenseAgreementPageComponent', () => {
  let component: ClarinLicenseAgreementPageComponent;
  let fixture: ComponentFixture<ClarinLicenseAgreementPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ClarinLicenseAgreementPageComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ClarinLicenseAgreementPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});