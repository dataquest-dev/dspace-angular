import {
  ComponentFixture,
  TestBed,
  waitForAsync,
} from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';

import { ServerResponseService } from '../core/services/server-response.service';
import { PageInternalServerErrorComponent } from './page-internal-server-error.component';

describe('PageInternalServerErrorComponent', () => {
  let fixture: ComponentFixture<PageInternalServerErrorComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [
        TranslateModule.forRoot(),
        PageInternalServerErrorComponent,
      ],
      providers: [
        provideRouter([]),
        {
          provide: ServerResponseService,
          useValue: jasmine.createSpyObj('ServerResponseService', ['setInternalServerError']),
        },
      ],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PageInternalServerErrorComponent);
    fixture.detectChanges();
  });

  it('should render the home button as a router link', () => {
    const anchor: HTMLAnchorElement = fixture.debugElement.query(By.css('a.btn')).nativeElement;

    expect(anchor.getAttribute('href')).toEqual('/home');
  });
});
