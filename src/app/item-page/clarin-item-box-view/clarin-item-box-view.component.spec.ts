import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ClarinItemBoxViewComponent } from './clarin-item-box-view.component';

describe('ClarinItemBoxViewComponent', () => {
  let component: ClarinItemBoxViewComponent;
  let fixture: ComponentFixture<ClarinItemBoxViewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ClarinItemBoxViewComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ClarinItemBoxViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
