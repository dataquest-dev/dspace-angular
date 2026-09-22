import { Component } from '@angular/core';
import {
  ComponentFixture,
  fakeAsync,
  TestBed,
  tick,
} from '@angular/core/testing';
import {
  FormsModule,
  NgForm,
} from '@angular/forms';
import { By } from '@angular/platform-browser';

import { InListValidator } from './in-list-validator.directive';

/**
 * The selector is [ngModel][dsInListValidator], so the directive only ever exists next to an
 * ngModel. Driving the control through the form proves the NG_VALIDATORS registration, which
 * calling validate() by hand would not. No template in src/ carries it.
 */
@Component({
  template: `
    <form>
      <input name="colour" [(ngModel)]="colour" [dsInListValidator]="list">
    </form>`,
  imports: [
    FormsModule,
    InListValidator,
  ],
})
class TestComponent {
  colour = '';
  list = ['red', 'green'];
}

describe('InListValidator', () => {
  let fixture: ComponentFixture<TestComponent>;
  let component: TestComponent;
  let form: NgForm;

  // The list is pushed into the directive before the value is set: a validator reads the input it
  // holds at the moment it runs, and setValue() runs it straight away.
  const setValue = (value: string) => {
    fixture.detectChanges();
    form.controls.colour.setValue(value);
    fixture.detectChanges();
    tick();
  };

  beforeEach(fakeAsync(() => {
    fixture = TestBed.configureTestingModule({
      imports: [TestComponent, FormsModule, InListValidator],
    }).createComponent(TestComponent);

    component = fixture.componentInstance;
    fixture.detectChanges();
    tick();
    form = fixture.debugElement.query(By.directive(NgForm)).injector.get(NgForm);
  }));

  it('should accept a value that is in the list', fakeAsync(() => {
    setValue('red');

    expect(form.controls.colour.errors).toBeNull();
  }));

  it('should reject a value that is not in the list', fakeAsync(() => {
    setValue('blue');

    expect(form.controls.colour.errors).toEqual({ inList: { value: 'blue' } });
  }));

  it('should reject an empty value even when the list is empty', fakeAsync(() => {
    component.list = [];
    setValue('');

    expect(form.controls.colour.errors).toEqual({ inList: { value: '' } });
  }));

  it('should accept any non-empty value when the list is empty', fakeAsync(() => {
    component.list = [];
    setValue('blue');

    expect(form.controls.colour.errors).toBeNull();
  }));

  it('should re-run when the list changes under an unchanged value', fakeAsync(() => {
    setValue('red');
    expect(form.controls.colour.errors).toBeNull();

    component.list = ['green'];
    fixture.detectChanges();
    form.controls.colour.updateValueAndValidity();
    tick();

    expect(form.controls.colour.errors).toEqual({ inList: { value: 'red' } });
  }));
});
