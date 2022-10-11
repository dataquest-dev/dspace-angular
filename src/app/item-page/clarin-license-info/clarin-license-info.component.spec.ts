import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ClarinLicenseInfoComponent } from './clarin-license-info.component';

describe('ClarinLicenseInfoComponent', () => {
  let component: ClarinLicenseInfoComponent;
  let fixture: ComponentFixture<ClarinLicenseInfoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ClarinLicenseInfoComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ClarinLicenseInfoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
