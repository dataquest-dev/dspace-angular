/* eslint-disable max-classes-per-file */
/* eslint-disable @typescript-eslint/no-deprecated */
/* The directive injects NgForOf with @Host(), so @for cannot host it and NgForOf is not
   interchangeable here. */
/* eslint-disable @angular-eslint/template/prefer-control-flow */
import { NgForOf } from '@angular/common';
import { Component } from '@angular/core';
import {
  ComponentFixture,
  TestBed,
} from '@angular/core/testing';
import { By } from '@angular/platform-browser';

import { DSpaceObject } from '../core/shared/dspace-object.model';
import { NgForTrackByIdDirective } from './ng-for-track-by-id.directive';

const dso = (id: string): DSpaceObject => Object.assign(new DSpaceObject(), { id });

/**
 * The directive injects NgForOf with @Host(), so it only resolves when it sits on the same
 * element as ngForOf. The microsyntax form puts it on the child element instead, so the
 * expanded form is the only shape that can build. No template in src/ uses it.
 */
@Component({
  template: `
    <!-- eslint-disable-next-line @angular-eslint/template/prefer-control-flow -->
    <ng-template ngFor ngForTrackById [ngForOf]="objects" let-object>
      <span>{{ object.id }}</span>
    </ng-template>`,
  imports: [
    NgForOf,
    NgForTrackByIdDirective,
  ],
})
class TestComponent {
  objects: DSpaceObject[] = [dso('a'), dso('b')];
}

@Component({
  template: `
    <!-- eslint-disable-next-line @angular-eslint/template/prefer-control-flow -->
    <ng-template ngFor [ngForOf]="objects" let-object>
      <span>{{ object.id }}</span>
    </ng-template>`,
  imports: [
    NgForOf,
  ],
})
class UntrackedTestComponent {
  objects: DSpaceObject[] = [dso('a'), dso('b')];
}

describe('NgForTrackByIdDirective', () => {
  let fixture: ComponentFixture<TestComponent>;
  let component: TestComponent;

  const spans = (f: ComponentFixture<any>): HTMLElement[] =>
    f.debugElement.queryAll(By.css('span')).map((de) => de.nativeElement);

  beforeEach(() => {
    fixture = TestBed.configureTestingModule({
      imports: [TestComponent, UntrackedTestComponent],
    }).createComponent(TestComponent);

    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should keep the rendered elements when the objects are replaced by equal ids', () => {
    const before = spans(fixture);

    component.objects = [dso('a'), dso('b')];
    fixture.detectChanges();

    expect(spans(fixture)).toEqual(before);
  });

  it('should replace the rendered elements when the ids change', () => {
    const before = spans(fixture);

    component.objects = [dso('c'), dso('d')];
    fixture.detectChanges();

    expect(spans(fixture)[0]).not.toBe(before[0]);
    expect(spans(fixture)[1]).not.toBe(before[1]);
  });

  it('should reuse the element of an id that moved and drop the one that left', () => {
    const before = spans(fixture);

    component.objects = [dso('b'), dso('c')];
    fixture.detectChanges();

    const after = spans(fixture);
    expect(after[0]).toBe(before[1]);
    expect(after).not.toContain(before[0]);
  });

  it('should be the directive that causes the reuse, not NgForOf itself', () => {
    const untracked = TestBed.createComponent(UntrackedTestComponent);
    untracked.detectChanges();
    const before = spans(untracked);

    untracked.componentInstance.objects = [dso('a'), dso('b')];
    untracked.detectChanges();

    expect(spans(untracked)[0]).not.toBe(before[0]);
  });
});
