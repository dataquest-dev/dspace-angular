import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ClarinAllLicensesPageComponent } from './clarin-all-licenses-page.component';
import { createdLicenseRD$, mockLicenseRD$ } from '../../shared/testing/clarin-license-mock';
import { of as observableOf } from 'rxjs';
import { ClarinLicenseDataService } from '../../core/data/clarin/clarin-license-data.service';
import { TranslateModule } from '@ngx-translate/core';
import { createFailedRemoteDataObject$ } from '../../shared/remote-data.utils';

describe('ClarinAllLicensesPageComponent', () => {
  let component: ClarinAllLicensesPageComponent;
  let fixture: ComponentFixture<ClarinAllLicensesPageComponent>;
  let clarinLicenseDataService: ClarinLicenseDataService;

  beforeEach(async () => {
    clarinLicenseDataService = jasmine.createSpyObj('clarinLicenseService', {
      findAll: mockLicenseRD$,
      create: createdLicenseRD$,
      put: createdLicenseRD$,
      searchBy: mockLicenseRD$,
      getLinkPath: observableOf('')
    });

    await TestBed.configureTestingModule({
      declarations: [ ClarinAllLicensesPageComponent ],
      imports: [
        TranslateModule.forRoot(),
      ],
      providers: [
        { provide: ClarinLicenseDataService, useValue: clarinLicenseDataService },
      ]
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

  it('should load the licenses', () => {
    expect(component.isLoading).toBeFalse();
    expect(component.hasLoadError).toBeFalse();
    expect(component.licensesRD$.value.length).toBe(1);
  });

  it('should stop loading and show an error when the licenses fail to load', () => {
    (clarinLicenseDataService.findAll as jasmine.Spy).and.returnValue(createFailedRemoteDataObject$('error', 500));

    component.loadAllLicenses();
    fixture.detectChanges();

    expect(component.isLoading).toBeFalse();
    expect(fixture.nativeElement.querySelector('ds-loading')).toBeNull();
    expect(fixture.nativeElement.querySelector('ds-error')).not.toBeNull();
  });
});
