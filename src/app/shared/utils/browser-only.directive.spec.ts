import {
  Component,
  PLATFORM_ID,
} from '@angular/core';
import {
  ComponentFixture,
  TestBed,
} from '@angular/core/testing';
import { By } from '@angular/platform-browser';

import { BrowserOnlyDirective } from './browser-only.directive';

/**
 * No template in src/ carries dsRenderOnlyForBrowser. It is a structural directive, so the only
 * shape that can build is the asterisk form on the element it guards.
 */
@Component({
  template: `
    <span id="always">always</span>
    <span id="guarded" *dsRenderOnlyForBrowser>browser only</span>`,
  imports: [
    BrowserOnlyDirective,
  ],
})
class TestComponent {
}

describe('BrowserOnlyDirective', () => {
  let fixture: ComponentFixture<TestComponent>;

  const build = (platformId: string) => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [TestComponent, BrowserOnlyDirective],
      providers: [
        { provide: PLATFORM_ID, useValue: platformId },
      ],
    });
    fixture = TestBed.createComponent(TestComponent);
    fixture.detectChanges();
  };

  it('should render the template on the browser platform', () => {
    build('browser');

    expect(fixture.debugElement.query(By.css('#guarded'))).not.toBeNull();
  });

  it('should render nothing on the server platform', () => {
    build('server');

    expect(fixture.debugElement.query(By.css('#guarded'))).toBeNull();
  });

  it('should leave the surrounding template alone on the server platform', () => {
    build('server');

    expect(fixture.debugElement.query(By.css('#always'))).not.toBeNull();
  });
});
