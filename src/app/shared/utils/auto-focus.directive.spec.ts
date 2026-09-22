/* eslint-disable max-classes-per-file */
import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { AutoFocusDirective } from './auto-focus.directive';

/**
 * No template in src/ carries dsAutoFocus, so both documented shapes are built here, each on its
 * own host: ngAfterViewInit fires once per directive instance and the last one would win.
 */
@Component({
  template: `<input id="bare" dsAutoFocus>`,
  imports: [
    AutoFocusDirective,
  ],
})
class BareHostComponent {
}

@Component({
  template: `
    <div id="wrapper" dsAutoFocus autoFocusSelector="#inner">
      <input id="inner">
    </div>`,
  imports: [
    AutoFocusDirective,
  ],
})
class SelectorHostComponent {
}

@Component({
  template: `<input id="plain">`,
})
class NoDirectiveHostComponent {
}

describe('AutoFocusDirective', () => {

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [BareHostComponent, SelectorHostComponent, NoDirectiveHostComponent],
    });
    document.body.focus();
  });

  it('should focus the host element when no selector is given', () => {
    const fixture = TestBed.createComponent(BareHostComponent);
    expect(document.activeElement.id).not.toBe('bare');

    fixture.detectChanges();

    expect(document.activeElement.id).toBe('bare');
  });

  it('should focus the descendant named by autoFocusSelector', () => {
    const fixture = TestBed.createComponent(SelectorHostComponent);
    expect(document.activeElement.id).not.toBe('inner');

    fixture.detectChanges();

    expect(document.activeElement.id).toBe('inner');
  });

  it('should leave the focus alone when the directive is absent', () => {
    const fixture = TestBed.createComponent(NoDirectiveHostComponent);

    fixture.detectChanges();

    expect(document.activeElement.id).not.toBe('plain');
  });
});
