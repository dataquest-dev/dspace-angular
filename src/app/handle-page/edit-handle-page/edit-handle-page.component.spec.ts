import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditHandlePageComponent } from './edit-handle-page.component';

describe('EditHandlePageComponent', () => {
  let component: EditHandlePageComponent;
  let fixture: ComponentFixture<EditHandlePageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ EditHandlePageComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(EditHandlePageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
