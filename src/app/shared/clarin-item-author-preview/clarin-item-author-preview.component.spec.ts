import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ClarinItemAuthorPreviewComponent } from './clarin-item-author-preview.component';
import { ConfigurationDataService } from '../../core/data/configuration-data.service';
import { createSuccessfulRemoteDataObject$ } from '../remote-data.utils';

describe('ClarinItemAuthorPreviewComponent', () => {
  let component: ClarinItemAuthorPreviewComponent;
  let fixture: ComponentFixture<ClarinItemAuthorPreviewComponent>;

  const configurationServiceSpy = jasmine.createSpyObj('configurationService', {
    findByPropertyName: createSuccessfulRemoteDataObject$({ values: ['https://orcid.org'] }),
  });

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ClarinItemAuthorPreviewComponent ],
      providers: [
        { provide: ConfigurationDataService, useValue: configurationServiceSpy }
      ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ClarinItemAuthorPreviewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('assignOrcidDomainUrl should read orcid.domain-url from backend config', async () => {
    component.orcidDomainUrl = null;
    await component.assignOrcidDomainUrl();
    expect(component.orcidDomainUrl).toBe('https://orcid.org');
    expect(configurationServiceSpy.findByPropertyName).toHaveBeenCalledWith('orcid.domain-url');
  });
});
