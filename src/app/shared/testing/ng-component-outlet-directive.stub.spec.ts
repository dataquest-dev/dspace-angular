/* eslint-disable max-classes-per-file */
import { NgComponentOutlet } from '@angular/common';
import { Component } from '@angular/core';
import {
  ComponentFixture,
  TestBed,
} from '@angular/core/testing';
import { By } from '@angular/platform-browser';

import { NgComponentOutletDirectiveStub } from './ng-component-outlet-directive.stub';

@Component({
  selector: 'ds-outlet-payload',
  template: `<span id="payload">rendered</span>`,
})
class PayloadComponent {
  static created = 0;

  constructor() {
    PayloadComponent.created++;
  }
}

/**
 * The stub exists so a component spec can keep an *ngComponentOutlet binding in its template
 * without instantiating what it points at. Both hosts are built, because the stub's promise is
 * only visible against the real NgComponentOutlet.
 */
@Component({
  template: `<ng-container *ngComponentOutlet="payload"></ng-container>`,
  imports: [
    NgComponentOutletDirectiveStub,
  ],
})
class StubbedHostComponent {
  payload = PayloadComponent;
}

@Component({
  template: `<ng-container *ngComponentOutlet="payload"></ng-container>`,
  imports: [
    NgComponentOutlet,
  ],
})
class RealHostComponent {
  payload = PayloadComponent;
}

describe('NgComponentOutletDirectiveStub', () => {
  let fixture: ComponentFixture<StubbedHostComponent>;

  beforeEach(() => {
    PayloadComponent.created = 0;
    TestBed.configureTestingModule({
      imports: [StubbedHostComponent, RealHostComponent],
    });
  });

  it('should accept the ngComponentOutlet binding the template carries', () => {
    fixture = TestBed.createComponent(StubbedHostComponent);
    fixture.detectChanges();

    const stub = fixture.debugElement
      .queryAllNodes(By.directive(NgComponentOutletDirectiveStub))[0]
      .injector.get(NgComponentOutletDirectiveStub);
    expect(stub.ngComponentOutlet).toBe(PayloadComponent);
  });

  it('should not instantiate the component it is pointed at', () => {
    fixture = TestBed.createComponent(StubbedHostComponent);
    fixture.detectChanges();

    expect(PayloadComponent.created).toBe(0);
    expect(fixture.nativeElement.querySelector('#payload')).toBeNull();
  });

  it('should stand in for a real NgComponentOutlet, which does instantiate it', () => {
    const real = TestBed.createComponent(RealHostComponent);
    real.detectChanges();

    expect(PayloadComponent.created).toBe(1);
    expect(real.nativeElement.querySelector('#payload')).not.toBeNull();
  });
});
