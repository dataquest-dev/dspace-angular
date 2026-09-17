import {
  ComponentFixture,
  TestBed,
} from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import {
  TranslateLoader,
  TranslateModule,
} from '@ngx-translate/core';

import { TranslateLoaderMock } from '../../../../shared/testing/translate-loader.mock';
import { mockItemWithMetadataFieldsAndValue } from '../specific-field/item-page-field.component.spec';
import { ClarinSponsorItemFieldComponent } from './clarin-sponsor-item-field.component';

describe('ClarinSponsorItemFieldComponent', () => {
  let component: ClarinSponsorItemFieldComponent;
  let fixture: ComponentFixture<ClarinSponsorItemFieldComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        ClarinSponsorItemFieldComponent,
        TranslateModule.forRoot({
          loader: {
            provide: TranslateLoader,
            useClass: TranslateLoaderMock,
          },
        }),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ClarinSponsorItemFieldComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render EU fund', () => {
    const PROJECT_CODE = 'EU project code';
    const ORGANIZATION = 'EU organization';
    const PROJECT_NAME = 'EU project name';
    const EU_FUND = `EU;${PROJECT_CODE};${ORGANIZATION};${PROJECT_NAME};info:eu-repo/grantAgreement/test/test/test/EU`;
    component.item = mockItemWithMetadataFieldsAndValue(['local.sponsor'], EU_FUND);
    fixture.detectChanges();

    expect(fixture.debugElement.query(By.css('#organization-value-0')).nativeElement.textContent).toContain(ORGANIZATION);
    expect(fixture.debugElement.query(By.css('#project-code-value-0')).nativeElement.textContent).toContain(PROJECT_CODE);
    expect(fixture.debugElement.query(By.css('#project-name-value-0')).nativeElement.textContent).toContain(PROJECT_NAME);
  });

  it('should render national fund', () => {
    const PROJECT_CODE = 'nationalFund project code';
    const ORGANIZATION = 'nationalFund organization';
    const PROJECT_NAME = 'nationalFund project name';
    const NATIONAL_FUND = `nationalFund;${PROJECT_CODE};${ORGANIZATION};${PROJECT_NAME};info:eu-repo/grantAgreement/test/test/test/EU`;

    component.item = mockItemWithMetadataFieldsAndValue(['local.sponsor'], NATIONAL_FUND) as any;
    fixture.detectChanges();
    expect(fixture.debugElement.query(By.css('#organization-value-0')).nativeElement.textContent).toContain(ORGANIZATION);
    expect(fixture.debugElement.query(By.css('#project-code-value-0')).nativeElement.textContent).toContain(PROJECT_CODE);
    expect(fixture.debugElement.query(By.css('#project-name-value-0')).nativeElement.textContent).toContain(PROJECT_NAME);
  });

  it('should show an error placeholder for a sponsor value with missing parts', () => {
    component.item = mockItemWithMetadataFieldsAndValue(['local.sponsor'], 'EU;only-project-code');
    fixture.detectChanges();

    expect(fixture.debugElement.query(By.css('#organization-value-0')).nativeElement.textContent)
      .toContain(component.ORGANIZATION_ERROR);
    expect(fixture.debugElement.query(By.css('#project-name-value-0')).nativeElement.textContent)
      .toContain(component.PROJECT_NAME_ERROR);
    expect(fixture.debugElement.query(By.css('#project-code-value-0')).nativeElement.textContent)
      .toContain('only-project-code');
  });
});
