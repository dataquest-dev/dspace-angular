import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NewHandlePageComponent } from './new-handle-page.component';

describe('NewHandlePageComponent', () => {
  let component: NewHandlePageComponent;
  let fixture: ComponentFixture<NewHandlePageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ NewHandlePageComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(NewHandlePageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
