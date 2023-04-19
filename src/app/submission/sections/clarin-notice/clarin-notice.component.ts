import {Component, Inject, OnInit} from '@angular/core';
import {renderSectionFor} from '../sections-decorator';
import {SectionsType} from '../sections-type';
import {SectionModelComponent} from '../models/section.model';
import {SectionsService} from '../sections.service';
import {Observable, Subscription} from 'rxjs';
import {SectionDataObject} from '../models/section-data.model';
import {hasValue} from '../../../shared/empty.util';

@Component({
  selector: 'ds-clarin-notice',
  templateUrl: './clarin-notice.component.html',
  styleUrls: ['./clarin-notice.component.scss']
})
@renderSectionFor(SectionsType.clarinNotice)
export class SubmissionSectionClarinNoticeComponent extends SectionModelComponent {

  constructor(@Inject('collectionIdProvider') public injectedCollectionId: string,
              @Inject('sectionDataProvider') public injectedSectionData: SectionDataObject,
              @Inject('submissionIdProvider') public injectedSubmissionId: string) {
    super(injectedCollectionId, injectedSectionData, injectedSubmissionId);
  }

  /**
   * Array to track all subscriptions and unsubscribe them onDestroy
   * @type {Array}
   */
  protected subs: Subscription[] = [];
  protected sectionService: SectionsService;

  ngOnInit(): void {
    super.ngOnInit();
  }

  protected getSectionStatus(): Observable<boolean> {
    return undefined;
  }

  /**
   * Unsubscribe from all subscriptions
   */
  onSectionDestroy() {
    this.subs
      .filter((subscription) => hasValue(subscription))
      .forEach((subscription) => subscription.unsubscribe());
  }

  protected onSectionInit(): void {
    console.log('section init');
  }

}
