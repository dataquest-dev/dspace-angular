import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ClarinNavbarTopComponent } from './clarin-navbar-top.component';

describe('ClarinNavbarTopComponent', () => {
  let component: ClarinNavbarTopComponent;
  let fixture: ComponentFixture<ClarinNavbarTopComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ClarinNavbarTopComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ClarinNavbarTopComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
