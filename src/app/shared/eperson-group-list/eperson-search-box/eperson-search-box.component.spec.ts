import {
  Component,
  NO_ERRORS_SCHEMA,
} from '@angular/core';
import {
  ComponentFixture,
  inject,
  TestBed,
  waitForAsync,
} from '@angular/core/testing';
import {
  FormsModule,
  ReactiveFormsModule,
  UntypedFormBuilder,
} from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';

import { createTestComponent } from '../../testing/utils.test';
import { SearchEvent } from '../eperson-group-list-event-type';
import { EpersonSearchBoxComponent } from './eperson-search-box.component';

describe('EpersonSearchBoxComponent test suite', () => {
  let comp: EpersonSearchBoxComponent;
  let compAsAny: any;
  let fixture: ComponentFixture<EpersonSearchBoxComponent>;
  let de;
  let formBuilder: UntypedFormBuilder;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [
        FormsModule,
        ReactiveFormsModule,
        TranslateModule.forRoot(),
        EpersonSearchBoxComponent,
        TestComponent,
      ],
      providers: [
        UntypedFormBuilder,
        EpersonSearchBoxComponent,
      ],
      schemas: [
        NO_ERRORS_SCHEMA,
      ],
    }).compileComponents();
  }));

  describe('', () => {
    let testComp: TestComponent;
    let testFixture: ComponentFixture<TestComponent>;

    // synchronous beforeEach
    beforeEach(() => {
      const html = `
        <ds-group-search-box></ds-group-search-box>`;

      testFixture = createTestComponent(html, TestComponent) as ComponentFixture<TestComponent>;
      testComp = testFixture.componentInstance;
    });

    afterEach(() => {
      testFixture.destroy();
    });

    it('should create EpersonSearchBoxComponent', inject([EpersonSearchBoxComponent], (app: EpersonSearchBoxComponent) => {

      expect(app).toBeDefined();

    }));
  });

  describe('', () => {
    beforeEach(() => {
      // initTestScheduler();
      fixture = TestBed.createComponent(EpersonSearchBoxComponent);
      formBuilder = TestBed.inject(UntypedFormBuilder);
      comp = fixture.componentInstance;
      compAsAny = fixture.componentInstance;
    });

    afterEach(() => {
      comp = null;
      compAsAny = null;
      de = null;
      fixture.destroy();
    });

    it('should reset the form', () => {
      comp.searchForm = formBuilder.group(({
        query: 'test',
      }));

      comp.reset();

      expect(comp.searchForm.controls.query.value).toBe('');
    });

    it('should label the scope select and the query input, each resolving to its own control', () => {
      fixture.detectChanges();
      const element: HTMLElement = fixture.nativeElement;
      const labels: HTMLLabelElement[] = Array.from(element.querySelectorAll('label'));

      expect(labels.length).toEqual(2);
      labels.forEach((label: HTMLLabelElement) => {
        expect(label.htmlFor).toBeTruthy();
        const control: HTMLElement = element.querySelector('[id="' + label.htmlFor + '"]');
        expect(control).toBeTruthy();
        expect(control.id).toEqual(label.htmlFor);
        // the label must not be rendered visibly (Bootstrap 5 dropped the old screen-reader class)
        expect(Array.from(label.classList)).toContain('visually-hidden');
      });
    });

    it('should name both controls from the translated keys rather than hardcoded English', () => {
      fixture.detectChanges();
      const input: HTMLInputElement = fixture.nativeElement.querySelector('input[name="query"]');
      const select: HTMLSelectElement = fixture.nativeElement.querySelector('select[name="scope"]');

      // TranslateModule.forRoot() with no catalogue echoes the key back, so the key is the observable value
      expect(input.getAttribute('aria-label')).toEqual('admin.access-control.epeople.search.input');
      expect(select.getAttribute('aria-label')).toEqual('admin.access-control.epeople.search.scope');
      // and the id is no longer the generic one that other components on the same page also used
      expect(input.id).toBeTruthy();
      expect(input.id).not.toEqual('query');
      expect(select.id).not.toEqual('scope');
    });

    it('should emit new search event', () => {
      const data = {
        scope: 'metadata',
        query: 'test',
      };

      const event: SearchEvent = {
        scope: 'metadata',
        query: 'test',
      };
      spyOn(comp.search, 'emit');

      comp.submit(data);

      expect(comp.search.emit).toHaveBeenCalledWith(event);
    });
  });
});

// declare a test component
@Component({
  selector: 'ds-test-cmp',
  template: ``,
  imports: [FormsModule,
    ReactiveFormsModule],
})
class TestComponent {

}
