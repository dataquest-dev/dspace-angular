import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HandleGlobalActionsComponent } from './handle-global-actions.component';

describe('HandleGlobalActionsComponent', () => {
  let component: HandleGlobalActionsComponent;
  let fixture: ComponentFixture<HandleGlobalActionsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ HandleGlobalActionsComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(HandleGlobalActionsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
