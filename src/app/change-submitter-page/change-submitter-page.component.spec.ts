import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ChangeSubmitterPageComponent } from './change-submitter-page.component';

describe('ChangeSubmitterPageComponent', () => {
  let component: ChangeSubmitterPageComponent;
  let fixture: ComponentFixture<ChangeSubmitterPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ChangeSubmitterPageComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ChangeSubmitterPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
