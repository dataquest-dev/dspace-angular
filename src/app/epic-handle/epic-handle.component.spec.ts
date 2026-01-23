import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EpicHandleComponent } from './epic-handle.component';
import { TranslateModule } from '@ngx-translate/core';

describe('EpicHandlePageComponent', () => {
  let component: EpicHandleComponent;
  let fixture: ComponentFixture<EpicHandleComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ EpicHandleComponent ],
      imports: [
        TranslateModule.forRoot(),
      ],
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
