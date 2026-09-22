import { Component } from '@angular/core';
import {
  ComponentFixture,
  fakeAsync,
  TestBed,
  tick,
} from '@angular/core/testing';
import { By } from '@angular/platform-browser';

import { DragClickDirective } from './drag-click.directive';

/**
 * Mirrors the only production usage, truncatable-part.component.html: the directive and the
 * (actualClick) listener sit on the same button, so the handler is reached through the template
 * binding rather than through a subscription the test adds itself.
 */
@Component({
  template: `
    <button
      dsDragClick
      (actualClick)="toggled = toggled + 1"
      role="button"
      tabindex="0"
    >toggle</button>`,
  imports: [
    DragClickDirective,
  ],
})
class TestComponent {
  toggled = 0;
}

describe('DragClickDirective', () => {
  let fixture: ComponentFixture<TestComponent>;
  let component: TestComponent;
  let button: HTMLElement;

  const press = (heldMs: number) => {
    button.dispatchEvent(new MouseEvent('mousedown'));
    tick(heldMs);
    button.dispatchEvent(new MouseEvent('mouseup'));
    fixture.detectChanges();
  };

  beforeEach(() => {
    fixture = TestBed.configureTestingModule({
      imports: [TestComponent, DragClickDirective],
    }).createComponent(TestComponent);

    component = fixture.componentInstance;
    fixture.detectChanges();
    button = fixture.debugElement.query(By.css('button')).nativeElement;
  });

  it('should call the template handler for a press shorter than 250ms', fakeAsync(() => {
    press(100);

    expect(component.toggled).toBe(1);
  }));

  it('should not call the template handler for a press of 250ms or longer', fakeAsync(() => {
    press(250);

    expect(component.toggled).toBe(0);
  }));

  it('should not call the template handler on a mouseup that had no mousedown', fakeAsync(() => {
    button.dispatchEvent(new MouseEvent('mouseup'));
    fixture.detectChanges();

    expect(component.toggled).toBe(0);
  }));

  it('should pass the mouseup event to the template handler', fakeAsync(() => {
    const directive = fixture.debugElement.query(By.directive(DragClickDirective))
      .injector.get(DragClickDirective);
    let emitted: any;
    directive.actualClick.subscribe((event) => emitted = event);

    press(100);

    expect(emitted instanceof MouseEvent).toBeTrue();
    expect(emitted.type).toBe('mouseup');
  }));
});
