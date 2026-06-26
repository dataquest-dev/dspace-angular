import { AsyncPipe } from '@angular/common';
import {
  Component,
  Inject,
  OnInit,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  TranslateModule,
  TranslateService,
} from '@ngx-translate/core';
import { NgToggleModule } from '@nth-cloud/ng-toggle';
import {
  BehaviorSubject,
  Observable,
  of,
  Subscription,
} from 'rxjs';

import { DSONameService } from '../../../core/breadcrumbs/dso-name.service';
import { CollectionDataService } from '../../../core/data/collection-data.service';
import { ConfigurationDataService } from '../../../core/data/configuration-data.service';
import { RemoteData } from '../../../core/data/remote-data';
import { JsonPatchOperationPathCombiner } from '../../../core/json-patch/builder/json-patch-operation-path-combiner';
import { Collection } from '../../../core/shared/collection.model';
import { ConfigurationProperty } from '../../../core/shared/configuration-property.model';
import { getRemoteDataPayload } from '../../../core/shared/operators';
import { HELP_DESK_PROPERTY } from '../../../item-page/tombstone/tombstone.constants';
import { hasValue } from '../../../shared/empty.util';
import { SectionModelComponent } from '../models/section.model';
import { SectionDataObject } from '../models/section-data.model';
import { SectionsService } from '../sections.service';


@Component({
  imports: [
    AsyncPipe,
    FormsModule,
    NgToggleModule,
    TranslateModule,
  ],
  selector: 'ds-clarin-notice',
  templateUrl: './clarin-notice.component.html',
  styleUrls: ['./clarin-notice.component.scss'],
})
export class SubmissionSectionClarinNoticeComponent extends SectionModelComponent implements OnInit {

  constructor(
              protected sectionService: SectionsService,
              private configurationDataService: ConfigurationDataService,
              private collectionDataService: CollectionDataService,
              private dsoNameService: DSONameService,
              private translateService: TranslateService,
              @Inject('collectionIdProvider') public injectedCollectionId: string,
              @Inject('sectionDataProvider') public injectedSectionData: SectionDataObject,
              @Inject('submissionIdProvider') public injectedSubmissionId: string) {
    super(injectedCollectionId, injectedSectionData, injectedSubmissionId);
  }

  /**
   * Array to track all subscriptions and unsubscribe them onDestroy
   * @type {Array}
   */
  protected subs: Subscription[] = [];

  /**
   * The mail for the help desk is loaded from the server.
   */
  helpDesk$: Observable<RemoteData<ConfigurationProperty>>;

  /**
   * The name of the current collection.
   */
  collectionName: BehaviorSubject<string> = new BehaviorSubject<string>('');

  toggleAcceptation = {
    handleColor: 'dark',
    handleOnColor: 'danger',
    handleOffColor: 'info',
    onColor: 'success',
    offColor: 'danger',
    onText: this.translateService.instant('submission.sections.clarin-notice.toggle.on-text'),
    offText: this.translateService.instant('submission.sections.clarin-notice.toggle.off-text'),
    disabled: false,
    size: 'sm',
    value: false,
  };

  protected pathCombiner: JsonPatchOperationPathCombiner;

  ngOnInit(): void {
    super.ngOnInit();
  }

  protected getSectionStatus(): Observable<boolean> {
    if (this.toggleAcceptation.value) {
      return of(true);
    }
    return of(false);
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
    this.helpDesk$ = this.configurationDataService.findByPropertyName(HELP_DESK_PROPERTY);

    this.collectionDataService.findById(this.collectionId)
      .pipe(getRemoteDataPayload())
      .subscribe((collection: Collection) => {
        this.collectionName.next(this.dsoNameService.getName(collection));
      });
  }

  onChange() {
    this.updateSectionStatus();
  }
}
