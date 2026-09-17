import { NO_ERRORS_SCHEMA } from '@angular/core';
import {
  ComponentFixture,
  TestBed,
} from '@angular/core/testing';
import { TranslateModule } from '@ngx-translate/core';

import { HandleGlobalActionsComponent } from './handle-global-actions/handle-global-actions.component';
import { HandlePageComponent } from './handle-page.component';
import { HandleTableComponent } from './handle-table/handle-table.component';

/**
 * The test class for the HandleTableComponent.
 */
describe('HandlePageComponent', () => {
  let component: HandlePageComponent;
  let fixture: ComponentFixture<HandlePageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        TranslateModule.forRoot(),
        HandlePageComponent,
      ],
      schemas: [NO_ERRORS_SCHEMA],
    })
      .overrideComponent(HandlePageComponent, {
        remove: { imports: [HandleTableComponent, HandleGlobalActionsComponent] },
      })
      .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(HandlePageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
