import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ClarinLicensePageComponent } from './clarin-license-page.component';

describe('ClarinLicensePageComponent', () => {
  let component: ClarinLicensePageComponent;
  let fixture: ComponentFixture<ClarinLicensePageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ClarinLicensePageComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ClarinLicensePageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
