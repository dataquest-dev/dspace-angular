import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ShareSubmissionPageComponent } from './share-submission-page.component';

describe('ShareSubmissionPageComponent', () => {
  let component: ShareSubmissionPageComponent;
  let fixture: ComponentFixture<ShareSubmissionPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ShareSubmissionPageComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ShareSubmissionPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
