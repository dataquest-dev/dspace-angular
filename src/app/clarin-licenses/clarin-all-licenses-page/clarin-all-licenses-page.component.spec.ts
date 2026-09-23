import {
  ComponentFixture,
  TestBed,
} from '@angular/core/testing';
import { TranslateModule } from '@ngx-translate/core';
import { of } from 'rxjs';

import { ClarinLicenseDataService } from '../../core/data/clarin/clarin-license-data.service';
import { buildPaginatedList } from '../../core/data/paginated-list.model';
import { ClarinLicense } from '../../core/shared/clarin/clarin-license.model';
import { ClarinLicenseLabel } from '../../core/shared/clarin/clarin-license-label.model';
import { PageInfo } from '../../core/shared/page-info.model';
import { createSuccessfulRemoteDataObject$ } from '../../shared/remote-data.utils';
import {
  createdLicenseRD$,
  mockLicenseRD$,
} from '../../shared/testing/clarin-license-mock';
import { ClarinAllLicensesPageComponent } from './clarin-all-licenses-page.component';

describe('ClarinAllLicensesPageComponent', () => {
  let component: ClarinAllLicensesPageComponent;
  let fixture: ComponentFixture<ClarinAllLicensesPageComponent>;
  let clarinLicenseDataService: ClarinLicenseDataService;

  function licenseWithLabel(name: string, label: string): ClarinLicense {
    return Object.assign(new ClarinLicense(), {
      name,
      clarinLicenseLabel: Object.assign(new ClarinLicenseLabel(), { label }),
    });
  }

  beforeEach(async () => {
    clarinLicenseDataService = jasmine.createSpyObj('clarinLicenseService', {
      findAll: mockLicenseRD$,
      create: createdLicenseRD$,
      put: createdLicenseRD$,
      searchBy: mockLicenseRD$,
      getLinkPath: of(''),
    });

    await TestBed.configureTestingModule({
      imports: [
        ClarinAllLicensesPageComponent,
        TranslateModule.forRoot(),
      ],
      providers: [
        { provide: ClarinLicenseDataService, useValue: clarinLicenseDataService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ClarinAllLicensesPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should list PUB licenses first and sort the rest by label', () => {
    (clarinLicenseDataService.findAll as jasmine.Spy).and.returnValue(
      createSuccessfulRemoteDataObject$(buildPaginatedList(new PageInfo(), [
        licenseWithLabel('res licence', 'RES'),
        licenseWithLabel('aca licence', 'ACA'),
        licenseWithLabel('pub licence', 'PUB'),
      ])));

    component.loadAllLicenses();

    expect(component.licensesRD$.value.map(license => license.name))
      .toEqual(['pub licence', 'aca licence', 'res licence']);
  });

  it('should stop showing the loading bar once the licences arrive', () => {
    component.isLoading = true;

    component.loadAllLicenses();

    expect(component.isLoading).toBeFalse();
  });

  it('should deserialize a required info string into objects', () => {
    const license = Object.assign(new ClarinLicense(), { requiredInfo: 'NAME,ADDRESS' as any });

    const requiredInfo = component.getRequiredInfo(license);

    expect(requiredInfo.map(info => info.name)).toEqual(['NAME', 'ADDRESS']);
  });
});
