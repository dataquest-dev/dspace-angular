import {
  ComponentFixture,
  TestBed,
} from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';

import { ShareSubmissionPageComponent } from './share-submission-page.component';

describe('ShareSubmissionPageComponent', () => {
  let component: ShareSubmissionPageComponent;
  let fixture: ComponentFixture<ShareSubmissionPageComponent>;
  let activatedRoute;

  beforeEach(async () => {
    activatedRoute = {
      snapshot: {
        queryParams: new Map([
          ['shareToken', 'fake-share-token'],
        ]),
      },
    };

    await TestBed.configureTestingModule({
      imports: [
        ShareSubmissionPageComponent,
        TranslateModule.forRoot(),
      ],
      providers: [
        { provide: ActivatedRoute, useValue: activatedRoute },
      ],
    })
      .compileComponents();

    fixture = TestBed.createComponent(ShareSubmissionPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should say the email with the link was sent', () => {
    expect(fixture.nativeElement.textContent).toContain('share.submission.page.share-link.message.end');
    expect(fixture.nativeElement.textContent).not.toContain('share.submission.page.share-link.message.end.not-sent');
  });

  it('should not promise an email when it was not sent', () => {
    activatedRoute.snapshot.queryParams = { changeSubmitterLink: 'https://share.link', emailSent: 'false' };
    fixture = TestBed.createComponent(ShareSubmissionPageComponent);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('share.submission.page.share-link.message.end.not-sent');
  });
});
