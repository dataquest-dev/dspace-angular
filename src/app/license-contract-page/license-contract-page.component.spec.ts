import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LicenseContractPageComponent } from './license-contract-page.component';

describe('LicenseContractPageComponent', () => {
  let component: LicenseContractPageComponent;
  let fixture: ComponentFixture<LicenseContractPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ LicenseContractPageComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(LicenseContractPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
