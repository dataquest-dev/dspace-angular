import { NO_ERRORS_SCHEMA } from '@angular/core';
import {
  ComponentFixture,
  TestBed,
  waitForAsync,
} from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideMockStore } from '@ngrx/store/testing';
import { TranslateModule } from '@ngx-translate/core';

import { LogoutPageComponent } from './logout-page.component';

describe('LogoutPageComponent', () => {
  let comp: LogoutPageComponent;
  let fixture: ComponentFixture<LogoutPageComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [
        TranslateModule.forRoot(),
        LogoutPageComponent,
      ],
      providers: [
        provideMockStore(),
      ],
      schemas: [NO_ERRORS_SCHEMA],
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(LogoutPageComponent);
    comp = fixture.componentInstance; // SearchPageComponent test instance
    fixture.detectChanges();
  });

  it('should create instance', () => {
    expect(comp).toBeDefined();
  });

  it('should show the CLARIN logo linking to clarin.eu', () => {
    const logo = fixture.debugElement.query(By.css('img.clarin-logo'));
    expect(logo?.nativeElement.getAttribute('src')).toBe('assets/images/clarin-logo.svg');
    expect(logo?.parent.nativeElement.getAttribute('href')).toBe('https://www.clarin.eu/');
  });

});
