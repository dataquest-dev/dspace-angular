import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HandleTablePageComponent } from './handle-table-page.component';

describe('HandleTableComponent', () => {
  let component: HandleTablePageComponent;
  let fixture: ComponentFixture<HandleTablePageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ HandleTablePageComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(HandleTablePageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
