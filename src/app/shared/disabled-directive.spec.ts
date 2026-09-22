/* eslint-disable max-classes-per-file */
import {
  Component,
  DebugElement,
} from '@angular/core';
import {
  ComponentFixture,
  TestBed,
} from '@angular/core/testing';
import { By } from '@angular/platform-browser';

import { BtnDisabledDirective } from './btn-disabled.directive';

@Component({
  template: `
    <button [dsBtnDisabled]="isDisabled">Test Button</button>
  `,
  imports: [
    BtnDisabledDirective,
  ],
})
class TestComponent {
  isDisabled = false;
}

describe('DisabledDirective', () => {
  let component: TestComponent;
  let fixture: ComponentFixture<TestComponent>;
  let button: DebugElement;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [BtnDisabledDirective, TestComponent],
    });
    fixture = TestBed.createComponent(TestComponent);
    component = fixture.componentInstance;
    button = fixture.debugElement.query(By.css('button'));
    fixture.detectChanges();
  });

  it('should bind aria-disabled to false initially', () => {
    expect(button.nativeElement.getAttribute('aria-disabled')).toBe('false');
    expect(button.nativeElement.classList.contains('disabled')).toBeFalse();
  });

  it('should bind aria-disabled to true and add disabled class when isDisabled is true', () => {
    component.isDisabled = true;
    fixture.detectChanges();

    expect(button.nativeElement.getAttribute('aria-disabled')).toBe('true');
    expect(button.nativeElement.classList.contains('disabled')).toBeTrue();
  });

  it('should bind aria-disabled to false and not have disabled class when isDisabled is false', () => {
    component.isDisabled = false;
    fixture.detectChanges();

    expect(button.nativeElement.getAttribute('aria-disabled')).toBe('false');
    expect(button.nativeElement.classList.contains('disabled')).toBeFalse();
  });

  it('should prevent click events when disabled', () => {
    component.isDisabled = true;
    fixture.detectChanges();

    let clickHandled = false;
    button.nativeElement.addEventListener('click', () => clickHandled = true);

    button.nativeElement.click();

    expect(clickHandled).toBeFalse();
  });

  it('should prevent Enter or Space keydown events when disabled', () => {
    component.isDisabled = true;
    fixture.detectChanges();

    let keydownHandled = false;
    button.nativeElement.addEventListener('keydown', () => keydownHandled = true);

    const enterEvent = new KeyboardEvent('keydown', { key: 'Enter', cancelable: true });
    const spaceEvent = new KeyboardEvent('keydown', { key: ' ', cancelable: true });

    button.nativeElement.dispatchEvent(enterEvent);
    button.nativeElement.dispatchEvent(spaceEvent);

    expect(keydownHandled).toBeFalse();
    expect(enterEvent.defaultPrevented).toBeTrue();
    expect(spaceEvent.defaultPrevented).toBeTrue();
  });

  it('should allow click and keydown events when not disabled', () => {
    let clickHandled = false;
    let keydownHandled = false;

    button.nativeElement.addEventListener('click', () => clickHandled = true);
    button.nativeElement.addEventListener('keydown', () => keydownHandled = true);

    button.nativeElement.click();

    const enterEvent = new KeyboardEvent('keydown', { key: 'Enter' });
    const spaceEvent = new KeyboardEvent('keydown', { key: ' ' });

    button.nativeElement.dispatchEvent(enterEvent);
    button.nativeElement.dispatchEvent(spaceEvent);

    expect(clickHandled).toBeTrue();
    expect(keydownHandled).toBeTrue();
  });
});

@Component({
  template: `
    <!-- eslint-disable-next-line dspace-angular-html/no-keydown-on-btn-disabled -->
    <button [dsBtnDisabled]="true" (keydown)="keydownHandled = true">Test Button</button>
  `,
  imports: [
    BtnDisabledDirective,
  ],
})
class TemplateKeydownComponent {
  keydownHandled = false;
}

describe('DisabledDirective with a (keydown) handler on the same element', () => {
  let component: TemplateKeydownComponent;
  let fixture: ComponentFixture<TemplateKeydownComponent>;
  let button: DebugElement;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [BtnDisabledDirective, TemplateKeydownComponent],
    });
    fixture = TestBed.createComponent(TemplateKeydownComponent);
    component = fixture.componentInstance;
    button = fixture.debugElement.query(By.css('button'));
    fixture.detectChanges();
  });

  /**
   * Angular chains this listener onto the directive's host listener for the same event instead of
   * adding a second DOM listener, so stopImmediatePropagation() cannot reach it. The lint rule
   * dspace-angular-html/no-keydown-on-btn-disabled exists to keep this combination out of templates.
   */
  it('runs the handler anyway, which is why the combination is not allowed', () => {
    button.nativeElement.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', cancelable: true }));

    expect(component.keydownHandled).toBeTrue();
  });
});
