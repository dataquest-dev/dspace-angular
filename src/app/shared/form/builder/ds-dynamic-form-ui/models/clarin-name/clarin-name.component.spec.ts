import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ClarinNameComponent } from './clarin-name.component';

describe('ClarinNameComponent', () => {
  let component: ClarinNameComponent;
  let fixture: ComponentFixture<ClarinNameComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ClarinNameComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ClarinNameComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
