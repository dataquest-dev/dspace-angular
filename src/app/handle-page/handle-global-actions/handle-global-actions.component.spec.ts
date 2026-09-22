import {
  ComponentFixture,
  TestBed,
} from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';

import { HandleGlobalActionsComponent } from './handle-global-actions.component';

/**
 * The test class for testing the HandleGlobalActionsComponent.
 */
describe('HandleGlobalActionsComponent', () => {
  let component: HandleGlobalActionsComponent;
  let fixture: ComponentFixture<HandleGlobalActionsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        TranslateModule.forRoot(),
        HandleGlobalActionsComponent,
      ],
      providers: [
        provideRouter([]),
      ],
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
