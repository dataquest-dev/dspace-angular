import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CommonModule } from '@angular/common';
import { NO_ERRORS_SCHEMA } from '@angular/core';

import { StaticPageComponent } from './static-page.component';
import { HtmlContentService } from '../shared/html-content.service';
import { Router } from '@angular/router';
import { RouterMock } from '../shared/mocks/router.mock';
import { LocaleService } from '../core/locale/locale.service';
import { TranslateModule } from '@ngx-translate/core';
import { of } from 'rxjs';
import { APP_CONFIG } from '../../config/app-config.interface';
import { environment } from '../../environments/environment';
import { ClarinSafeHtmlPipe } from '../shared/utils/clarin-safehtml.pipe';
import { ServerResponseService } from '../core/services/server-response.service';

describe('StaticPageComponent', () => {
  let component: StaticPageComponent;
  let fixture: ComponentFixture<StaticPageComponent>;

  let htmlContentService: jasmine.SpyObj<HtmlContentService>;
  let localeService: any;
  let responseService: jasmine.SpyObj<ServerResponseService>;
  let appConfig: any;

  beforeEach(async () => {
    htmlContentService = jasmine.createSpyObj('htmlContentService', {
      fetchHtmlContent: of('<div id="idShouldNotBeRemoved">TEST MESSAGE</div>')
    });
    localeService = jasmine.createSpyObj('LocaleService', {
      getCurrentLanguageCode: jasmine.createSpy('getCurrentLanguageCode'),
    });
    responseService = jasmine.createSpyObj('responseService', ['setNotFound']);

    // Do not mutate the shared `environment` object - replacing `environment.ui` would
    // break any later spec that reads e.g. environment.ui.nameSpace
    appConfig = Object.assign({}, environment, {
      ui: {
        namespace: 'testNamespace'
      }
    });

    TestBed.configureTestingModule({
      declarations: [ StaticPageComponent, ClarinSafeHtmlPipe ],
      imports: [
        CommonModule,
        TranslateModule.forRoot()
      ],
      providers: [
        { provide: HtmlContentService, useValue: htmlContentService },
        { provide: Router, useValue: new RouterMock() },
        { provide: LocaleService, useValue: localeService },
        { provide: ServerResponseService, useValue: responseService },
        { provide: APP_CONFIG, useValue: appConfig }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    });

    localeService = TestBed.inject(LocaleService);
    localeService.getCurrentLanguageCode.and.returnValue('en');
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(StaticPageComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  // Load `TEST MESSAGE`
  it('should load html file content', async () => {
    await component.ngOnInit();
    expect(component.htmlContent.value).toBe('<div id="idShouldNotBeRemoved">TEST MESSAGE</div>');
    expect(component.contentState).toBe('found');
  });

  // When the file is missing, set a 404 status for SSR and switch to the not-found state
  it('should set 404 status when content is not found', async () => {
    htmlContentService.fetchHtmlContent.and.returnValue(of(''));
    await component.ngOnInit();
    expect(responseService.setNotFound).toHaveBeenCalled();
    expect(component.contentState).toBe('not-found');
  });
});
