import { Component, Input, OnChanges } from '@angular/core';

import { TranslateService } from '@ngx-translate/core';
import { Observable, of as observableOf, Subscription } from 'rxjs';
import { first, take } from 'rxjs/operators';

import { SectionsService } from '../../sections/sections.service';
import { hasValue, isEmpty, isNotEmpty } from '../../../shared/empty.util';
import { normalizeSectionData } from '../../../core/submission/submission-response-parsing.service';
import { SubmissionService } from '../../submission.service';
import { NotificationsService } from '../../../shared/notifications/notifications.service';
import { UploaderCompleteEvent } from '../../../shared/upload/uploader/uploader-complete-event.model';
import { UploaderError } from '../../../shared/upload/uploader/uploader-error.model';
import { UploaderOptions } from '../../../shared/upload/uploader/uploader-options.model';
import parseSectionErrors from '../../utils/parseSectionErrors';
import { SubmissionJsonPatchOperationsService } from '../../../core/submission/submission-json-patch-operations.service';
import { WorkspaceItem } from '../../../core/submission/models/workspaceitem.model';
import { SectionsType } from '../../sections/sections-type';

/**
 * This component represents the drop zone that provides to add files to the submission.
 */
@Component({
  selector: 'ds-submission-upload-files',
  templateUrl: './submission-upload-files.component.html',
})
export class SubmissionUploadFilesComponent implements OnChanges {

  /**
   * The collection id this submission belonging to
   * @type {string}
   */
  @Input() collectionId: string;

  /**
   * The submission id
   * @type {string}
   */
  @Input() submissionId: string;

  /**
   * The uploader configuration options
   * @type {UploaderOptions}
   */
  @Input() uploadFilesOptions: UploaderOptions;

  /**
   * A boolean representing if is possible to active drop zone over the document page
   * @type {boolean}
   */
  public enableDragOverDocument = true;

  /**
   * i18n message label
   * @type {string}
   */
  public dropOverDocumentMsg = 'submission.sections.upload.drop-message';

  /**
   * i18n message label
   * @type {string}
   */
  public dropMsg = 'submission.sections.upload.drop-message';

  /**
   * Array to track all subscriptions and unsubscribe them onDestroy
   * @type {Array}
   */
  private subs: Subscription[] = [];

  /**
   * A boolean representing if upload functionality is enabled
   * @type {boolean}
   */
  private uploadEnabled: Observable<boolean> = observableOf(false);

  /**
   * Save submission before to upload a file
   */
  public onBeforeUpload = () => {
    const sub: Subscription = this.operationsService.jsonPatchByResourceType(
      this.submissionService.getSubmissionObjectLinkName(),
      this.submissionId,
      'sections')
      .subscribe();
    this.subs.push(sub);
    return sub;
  };

  /**
   * Initialize instance variables
   *
   * @param {NotificationsService} notificationsService
   * @param {SubmissionJsonPatchOperationsService} operationsService
   * @param {SectionsService} sectionService
   * @param {SubmissionService} submissionService
   * @param {TranslateService} translate
   */
  constructor(private notificationsService: NotificationsService,
              private operationsService: SubmissionJsonPatchOperationsService,
              private sectionService: SectionsService,
              private submissionService: SubmissionService,
              private translate: TranslateService) {
  }

  /**
   * Check if upload functionality is enabled
   */
  ngOnChanges() {
    this.uploadEnabled = this.sectionService.isSectionTypeAvailable(this.submissionId, SectionsType.Upload);
  }

  /**
   * Parse the submission object retrieved from REST after upload
   *
   * @param event
   *    The completed upload event, carrying the submission object retrieved from REST and the
   *    client-side name of the file that completed
   */
  public onCompleteItem(event: UploaderCompleteEvent) {
    const workspaceitem = event?.response as WorkspaceItem;
    const fileName = event?.fileName;
    // Checks if upload section is enabled so do upload
    this.subs.push(
      this.uploadEnabled
        .pipe(first())
        .subscribe((isUploadEnabled) => {
          if (isUploadEnabled && hasValue(workspaceitem)) {

            const { sections } = workspaceitem;
            const { errors } = workspaceitem;

            const errorsList = parseSectionErrors(errors);
            if (sections && isNotEmpty(sections)) {
              Object.keys(sections)
                .forEach((sectionId) => {
                  const sectionData = normalizeSectionData(sections[sectionId]);
                  const sectionErrors = errorsList[sectionId];
                  this.sectionService.isSectionType(this.submissionId, sectionId, SectionsType.Upload)
                      .pipe(take(1))
                      .subscribe((isUpload) => {
                        if (isUpload) {
                          // Look for errors on upload
                          if ((isEmpty(sectionErrors))) {
                            this.notificationsService.success(null, this.getNotificationContent('upload-successful', fileName));
                          } else {
                            this.notificationsService.error(null, this.getNotificationContent('upload-failed', fileName));
                          }
                        }
                      });
                  this.sectionService.updateSectionData(this.submissionId, sectionId, sectionData, sectionErrors, sectionErrors);
                });
            }

          }
        })
    );
  }

  /**
   * Show error notification on upload fails.
   *
   * The client-side size-limit rejection is discriminated FIRST, by comparing the emitted `response`
   * against the size-limit message the uploader produced with the very same ONE-ARGUMENT
   * `translate.instant(key)` call. Adding interpolation params to either side would make this `===`
   * silently false, with no compile error, so the comparison and both `instant()` arities must stay
   * exactly as they are. Only when that comparison fails is the default message built, and the
   * default message is the only one that carries the file name.
   *
   * @param error
   *    The upload error, carrying the file that failed to upload (when available)
   */
  public onUploadError(error?: UploaderError) {
    const errorMessageUploadLimit = this.translate.instant('submission.sections.upload.upload-failed.size-limit-exceeded');
    const isFileSizeLimitError = error?.response === errorMessageUploadLimit;
    // `onErrorItem` emits a ng2-file-upload FileItem (name under `file`), `onWhenAddingFileFailed`
    // emits a bare FileLikeObject (name at the top level), so both shapes have to be covered.
    const fileName = error?.item?.file?.name ?? error?.item?.name;

    this.notificationsService.error(null, isFileSizeLimitError
      ? errorMessageUploadLimit
      : this.getNotificationContent('upload-failed', fileName));
  }

  /**
   * Build the translated notification content for an upload outcome, including the file name when
   * available. Falls back to the generic (file-name-less) message when the file name is missing.
   * The `default` interpolate param is honoured by MissingTranslationHelper, so a locale that has not
   * yet translated the `-file` key renders the generic message rather than a raw dotted key.
   *
   * @param suffix
   *    The i18n key suffix within the upload section (e.g. `upload-successful`); the helper reads
   *    `<suffix>-file` when a file name is known and plain `<suffix>` otherwise
   * @param fileName
   *    The name of the file the notification refers to, if known
   */
  private getNotificationContent(suffix: string, fileName?: string): Observable<string> {
    return isNotEmpty(fileName)
      ? this.translate.get(`submission.sections.upload.${suffix}-file`, {
        fileName,
        default: this.translate.instant(`submission.sections.upload.${suffix}`),
      })
      : this.translate.get(`submission.sections.upload.${suffix}`);
  }

  /**
   * Unsubscribe from all subscriptions
   */
  ngOnDestroy() {
    this.subs
      .filter((subscription) => hasValue(subscription))
      .forEach((subscription) => subscription.unsubscribe());
  }
}
