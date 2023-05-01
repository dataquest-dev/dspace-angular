import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ClarinItemAuthorPreviewComponent } from './clarin-item-author-preview.component';

describe('ClarinItemAuthorPreviewComponent', () => {
  let component: ClarinItemAuthorPreviewComponent;
  let fixture: ComponentFixture<ClarinItemAuthorPreviewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ClarinItemAuthorPreviewComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ClarinItemAuthorPreviewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
