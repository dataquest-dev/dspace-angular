import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HandlePageComponent } from './handle-page.component';

describe('HandleTableComponent', () => {
  let component: HandlePageComponent;
  let fixture: ComponentFixture<HandlePageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ HandlePageComponent ]
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
