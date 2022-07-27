
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

  it('should initialize handleRoute', () => {
    //
  });

  it('should initialize paginationOptions', () => {
    //
  });

  it('should onInit should initialize handle table', () => {
    // call getAllHandles()
  });

  it('should update handles in pageChange', () => {
    //
  });

  it('should not allow to have two or more selected handles', () => {
    //
  });

  it('should redirect with selected handle', () => {
    //
  });

  it('should delete selected handle', () => {
    //
  });

  it('should refresh table after delete', () => {
    //
  });
});
