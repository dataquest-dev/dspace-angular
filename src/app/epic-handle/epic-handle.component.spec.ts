import { NO_ERRORS_SCHEMA } from '@angular/core';
import {
  ComponentFixture,
  TestBed,
} from '@angular/core/testing';
import { TranslateModule } from '@ngx-translate/core';

import { EpicHandleComponent } from './epic-handle.component';
import { EpicHandleTableComponent } from './epic-handle-table/epic-handle-table.component';

describe('EpicHandlePageComponent', () => {
  let component: EpicHandleComponent;
  let fixture: ComponentFixture<EpicHandleComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        TranslateModule.forRoot(),
        EpicHandleComponent,
      ],
      schemas: [NO_ERRORS_SCHEMA],
    })
      .overrideComponent(EpicHandleComponent, {
        remove: { imports: [EpicHandleTableComponent] },
      })
      .compileComponents();

    fixture = TestBed.createComponent(EpicHandleComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
