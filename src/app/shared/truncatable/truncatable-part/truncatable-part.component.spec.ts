import {
  ChangeDetectionStrategy,
  NO_ERRORS_SCHEMA,
} from '@angular/core';
import {
  ComponentFixture,
  TestBed,
  waitForAsync,
} from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import {
  TranslateLoader,
  TranslateModule,
  TranslateService,
} from '@ngx-translate/core';
import { of } from 'rxjs';

import {
  NativeWindowRef,
  NativeWindowService,
} from '../../../core/services/window.service';
import { mockTruncatableService } from '../../mocks/mock-trucatable.service';
import { getMockTranslateService } from '../../mocks/translate.service.mock';
import { TranslateLoaderMock } from '../../mocks/translate-loader.mock';
import { TruncatableService } from '../truncatable.service';
import { TruncatablePartComponent } from './truncatable-part.component';

describe('TruncatablePartComponent', () => {
  let comp: TruncatablePartComponent;
  let fixture: ComponentFixture<TruncatablePartComponent>;
  let translateService: TranslateService;
  const id1 = '123';
  const id2 = '456';

  let truncatableService: any;

  beforeEach(waitForAsync(() => {
    translateService = getMockTranslateService();
    truncatableService = {
      isCollapsed: (id: string) => {
        if (id === id1) {
          return of(true);
        } else {
          return of(false);
        }
      },
    };
    void TestBed.configureTestingModule({
      imports: [NoopAnimationsModule,
        TranslateModule.forRoot({
          loader: {
            provide: TranslateLoader,
            useClass: TranslateLoaderMock,
          },
        }), TruncatablePartComponent],
      providers: [
        { provide: NativeWindowService, useValue: new NativeWindowRef() },
        { provide: TruncatableService, useValue: truncatableService },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).overrideComponent(TruncatablePartComponent, {
      set: { changeDetection: ChangeDetectionStrategy.Default },
    }).compileComponents();
  }));
  beforeEach(() => {
    fixture = TestBed.createComponent(TruncatablePartComponent);
    comp = fixture.componentInstance; // TruncatablePartComponent test instance
    fixture.detectChanges();
    truncatableService = (comp as any).filterService;
  });

  describe('When the item is collapsed', () => {
    beforeEach(() => {
      comp.id = id1;
      comp.minLines = 5;
      (comp as any).setLines();
      fixture.detectChanges();
    })
    ;

    it('lines should equal minlines', () => {
      expect((comp as any).lines).toEqual(comp.minLines.toString());
    });

    it('collapseButton should be hidden', () => {
      const a = fixture.debugElement.query(By.css('.collapseButton'));
      expect(a).toBeNull();
    });

    it('expandButton aria-expanded should be false', () => {
      const btn = fixture.debugElement.query(By.css('.expandButton'));
      expect(btn.nativeElement.getAttribute('aria-expanded')).toEqual('false');
    });
  });

  describe('When the item is expanded', () => {
    beforeEach(() => {
      comp.id = id2;
    })
    ;

    it('lines should equal maxlines when maxlines has a value', () => {
      comp.maxLines = 5;
      (comp as any).setLines();
      fixture.detectChanges();
      expect((comp as any).lines).toEqual(comp.maxLines.toString());
    });

    it('lines should equal \'none\' when maxlines has no value', () => {
      (comp as any).setLines();
      fixture.detectChanges();
      expect((comp as any).lines).toEqual('none');
    });

    it('collapseButton should be shown', () => {
      (comp as any).setLines();
      (comp as any).expandable = true;
      fixture.detectChanges();
      const a = fixture.debugElement.query(By.css('.collapseButton'));
      expect(a).not.toBeNull();
    });

    it('collapseButton aria-expanded should be true', () => {
      (comp as any).setLines();
      (comp as any).expandable = true;
      fixture.detectChanges();
      const btn = fixture.debugElement.query(By.css('.collapseButton'));
      expect(btn.nativeElement.getAttribute('aria-expanded')).toEqual('true');
    });
  });
});

describe('TruncatablePartComponent', () => {
  let comp: TruncatablePartComponent;
  let fixture: ComponentFixture<TruncatablePartComponent>;
  let translateService: TranslateService;
  const identifier = '1234567890';
  let truncatableService;
  beforeEach(waitForAsync(() => {
    translateService = getMockTranslateService();
    void TestBed.configureTestingModule({
      imports: [
        NoopAnimationsModule,
        TranslateModule.forRoot({
          loader: {
            provide: TranslateLoader,
            useClass: TranslateLoaderMock,
          },
        }),
        TruncatablePartComponent,
      ],
      providers: [
        { provide: NativeWindowService, useValue: new NativeWindowRef() },
        { provide: TruncatableService, useValue: mockTruncatableService },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).overrideComponent(TruncatablePartComponent, {
      set: { changeDetection: ChangeDetectionStrategy.Default },
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TruncatablePartComponent);
    comp = fixture.componentInstance; // TruncatablePartComponent test instance
    comp.id = identifier;
    fixture.detectChanges();
    truncatableService = (comp as any).service;
  });

  describe('When toggle is called', () => {
    beforeEach(() => {
      spyOn(truncatableService, 'toggle');
      comp.toggle();
    });

    it('should call toggle on the TruncatableService', () => {
      expect(truncatableService.toggle).toHaveBeenCalledWith(identifier);
    });
  });

  describe('externalToggle property', () => {
    it('should have default value of false', () => {
      expect(comp.externalToggle).toBe(false);
    });
  });

  describe('toggleWithoutId method', () => {
    it('should set expand to true and lines to none when expand parameter is true', () => {
      comp.expand = false;
      comp.expandable = false;
      comp.toggleWithoutId(true);
      expect(comp.expand).toBe(true);
      expect(comp.lines).toBe('none');
    });

    it('should set expand to false and lines to 1 when expand parameter is false', () => {
      comp.expand = true;
      comp.expandable = true;
      comp.toggleWithoutId(false);
      expect(comp.expand).toBe(false);
      expect(comp.lines).toBe('1');
    });

    it('should fall back to minLines when collapsing a part that has one', () => {
      comp.minLines = 3;
      comp.toggleWithoutId(false);
      expect(comp.lines).toBe('3');
    });

    it('should route through toggleWithoutId when the part has no id', () => {
      comp.id = undefined;
      spyOn(truncatableService, 'toggle');

      comp.toggle(undefined, true);

      expect(truncatableService.toggle).not.toHaveBeenCalled();
      expect(comp.expand).toBe(true);
      expect(comp.lines).toBe('none');
    });

    it('should stop the event from reaching the surrounding element', () => {
      const event = jasmine.createSpyObj('event', ['stopPropagation']);

      comp.toggle(event, true);

      expect(event.stopPropagation).toHaveBeenCalled();
    });
  });

  describe('truncated output', () => {
    const fakeContent = (scrollHeight: number, clientHeight: number) => ({
      nativeElement: {
        scrollHeight,
        clientHeight,
        classList: { add: () => undefined, remove: () => undefined },
      },
    });

    it('should emit true when the content overflows and false when it does not', () => {
      const emitted: boolean[] = [];
      comp.externalToggle = true;
      comp.truncated.subscribe((value: boolean) => emitted.push(value));

      (comp as any).content = fakeContent(100, 20);
      comp.truncateElement();
      (comp as any).content = fakeContent(20, 20);
      comp.truncateElement();

      expect(emitted).toEqual([true, false]);
    });

    it('should not re-emit while the truncated state is unchanged', () => {
      const emitted: boolean[] = [];
      comp.externalToggle = true;
      comp.truncated.subscribe((value: boolean) => emitted.push(value));

      (comp as any).content = fakeContent(100, 20);
      comp.truncateElement();
      comp.truncateElement();
      comp.truncateElement();

      expect(emitted).toEqual([true]);
    });

    it('should not emit at all while externalToggle is off', () => {
      const emitted: boolean[] = [];
      comp.externalToggle = false;
      comp.truncated.subscribe((value: boolean) => emitted.push(value));

      (comp as any).content = fakeContent(100, 20);
      comp.truncateElement();

      expect(emitted).toEqual([]);
    });
  });

  describe('When externalToggle is false (default behavior)', () => {
    beforeEach(() => {
      comp.externalToggle = false;
      // use id '1' to simulate collapsed state from mock service
      comp.id = '1';
      comp.minLines = 3;
      // re-evaluate lines after changing id
      (comp as any).setLines();
      fixture.detectChanges();
    });

    it('should display the traditional expand button', () => {
      const expandButton = fixture.debugElement.query(By.css('.expandButton'));
      expect(expandButton).not.toBeNull();
    });
  });

  describe('When externalToggle is true', () => {
    beforeEach(() => {
      comp.externalToggle = true;
      comp.minLines = 3;
      comp.expandable = false;
    });

    // NOTE: both assertions query `button`, not `.expandButton` / `.collapseButton`. The single
    // button in this template carries whichever of those two classes matches the current state, so
    // a class-specific query is satisfied by the *other* state and passes even when the button is
    // still rendered - which is how the fork's own version of these two tests is vacuous.
    it('should hide the traditional expand button', () => {
      comp.expand = false;
      fixture.detectChanges();

      expect(comp.isExpanded).toBeFalse();
      expect(fixture.debugElement.query(By.css('button'))).toBeNull();
    });

    it('should hide the traditional collapse button', () => {
      comp.expand = true;
      fixture.detectChanges();

      expect(comp.isExpanded).toBeTrue();
      expect(fixture.debugElement.query(By.css('button'))).toBeNull();
    });
  });

});
