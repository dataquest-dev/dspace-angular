
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HandleTableComponent } from './handle-table.component';

describe('HandleTableComponent', () => {
  let component: HandleTableComponent;
  let fixture: ComponentFixture<HandleTableComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ HandleTableComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(HandleTableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
