import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SubmissionSectionClarinNoticeComponent } from './clarin-notice.component';

describe('SubmissionSectionClarinNoticeComponent', () => {
  let component: SubmissionSectionClarinNoticeComponent;
  let fixture: ComponentFixture<SubmissionSectionClarinNoticeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SubmissionSectionClarinNoticeComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SubmissionSectionClarinNoticeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
