import { Component } from '@angular/core';
import {
  ComponentFixture,
  TestBed,
  waitForAsync,
} from '@angular/core/testing';
import { TranslateModule } from '@ngx-translate/core';

import { DsSelectComponent } from './ds-select.component';

/**
 * Two ds-select instances on one page - the situation that produced duplicate DOM ids
 * (a browse toolbar renders one per sort option, MyDSpace one per pool task).
 */
@Component({
  selector: 'ds-test-host',
  template: `
    <ds-select label="first.label"><span class="selection">A</span></ds-select>
    <ds-select label="second.label"><span class="selection">B</span></ds-select>
  `,
  imports: [
    DsSelectComponent,
  ],
})
class TestHostComponent {
}

describe('DsSelectComponent', () => {
  let component: DsSelectComponent;
  let fixture: ComponentFixture<DsSelectComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [
        TranslateModule.forRoot(),
        DsSelectComponent,
      ],
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DsSelectComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should not reference a label element when no label is set', () => {
    const button: HTMLElement = fixture.nativeElement.querySelector('button.selection');

    expect(button).toBeTruthy();
    expect(button.getAttribute('aria-describedby')).toBeNull();
    // the button still names its own menu
    const menu: HTMLElement = fixture.nativeElement.querySelector('[ngbDropdownMenu]');
    expect(menu.getAttribute('aria-labelledby')).toEqual(button.id);
  });

  describe('with two instances on the same page', () => {
    let hostFixture: ComponentFixture<TestHostComponent>;
    let hostElement: HTMLElement;

    beforeEach(() => {
      hostFixture = TestBed.createComponent(TestHostComponent);
      hostFixture.detectChanges();
      hostElement = hostFixture.nativeElement;
    });

    it('should not emit duplicate DOM ids', () => {
      const ids: string[] = Array.from(hostElement.querySelectorAll('[id]')).map((element: Element) => element.id);

      expect(ids.length).toBeGreaterThan(0);
      expect(ids.length).toEqual(new Set(ids).size);
    });

    it('should resolve every aria reference inside its own instance', () => {
      const selects: HTMLElement[] = Array.from(hostElement.querySelectorAll('ds-select'));
      expect(selects.length).toEqual(2);

      const buttonIds: string[] = [];
      selects.forEach((select: HTMLElement) => {
        const button: HTMLElement = select.querySelector('button.selection');
        const menu: HTMLElement = select.querySelector('[ngbDropdownMenu]');
        const describedBy: string = button.getAttribute('aria-describedby');

        expect(describedBy).toBeTruthy();
        // the label the button points at is this instance's own label ...
        expect(select.querySelector('[id="' + describedBy + '"]')).toBeTruthy();
        // ... and no other element in the document answers to that id
        expect(hostElement.querySelectorAll('[id="' + describedBy + '"]').length).toEqual(1);
        expect(menu.getAttribute('aria-labelledby')).toEqual(button.id);

        buttonIds.push(button.id);
      });

      expect(buttonIds[0]).not.toEqual(buttonIds[1]);
    });
  });
});
