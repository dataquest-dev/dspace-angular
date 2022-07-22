import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ChangeHandlePrefixPageComponent } from './change-handle-prefix-page.component';

describe('ChangeHandlePrefixPageComponent', () => {
  let component: ChangeHandlePrefixPageComponent;
  let fixture: ComponentFixture<ChangeHandlePrefixPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ChangeHandlePrefixPageComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ChangeHandlePrefixPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
