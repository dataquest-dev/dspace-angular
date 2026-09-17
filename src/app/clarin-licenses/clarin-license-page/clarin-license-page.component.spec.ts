import { NO_ERRORS_SCHEMA } from '@angular/core';
import {
  ComponentFixture,
  TestBed,
} from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { TranslateModule } from '@ngx-translate/core';

import { ClarinLicenseTableComponent } from '../clarin-license-table/clarin-license-table.component';
import { ClarinLicensePageComponent } from './clarin-license-page.component';

describe('ClarinLicensePageComponent', () => {
  let component: ClarinLicensePageComponent;
  let fixture: ComponentFixture<ClarinLicensePageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        ClarinLicensePageComponent,
        TranslateModule.forRoot(),
      ],
    })
      .overrideComponent(ClarinLicensePageComponent, {
        remove: { imports: [ClarinLicenseTableComponent] },
        add: { schemas: [NO_ERRORS_SCHEMA] },
      })
      .compileComponents();

    fixture = TestBed.createComponent(ClarinLicensePageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should host the licence table', () => {
    expect(fixture.debugElement.query(By.css('ds-clarin-license-table'))).toBeTruthy();
  });
});
