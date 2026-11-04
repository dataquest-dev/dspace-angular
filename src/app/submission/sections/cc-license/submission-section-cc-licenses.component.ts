import { ChangeDetectorRef, Component, Inject, OnChanges, SimpleChanges, OnInit } from '@angular/core';
import { Observable, of as observableOf, Subscription, tap, Subject } from 'rxjs';
import { Field, Option, SubmissionCcLicence } from '../../../core/submission/models/submission-cc-license.model';
import {
  getFirstCompletedRemoteData, getFirstSucceededRemoteDataPayload,
  getRemoteDataPayload
} from '../../../core/shared/operators';
import { distinctUntilChanged, filter, map, take, debounceTime, switchMap, startWith, shareReplay } from 'rxjs/operators';
import { SubmissionCcLicenseDataService } from '../../../core/submission/submission-cc-license-data.service';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { renderSectionFor } from '../sections-decorator';
import { SectionsType } from '../sections-type';
import { SectionModelComponent } from '../models/section.model';
import { SectionDataObject } from '../models/section-data.model';
import { SectionsService } from '../sections.service';
import { WorkspaceitemSectionCcLicenseObject } from '../../../core/submission/models/workspaceitem-section-cc-license.model';
import { JsonPatchOperationPathCombiner } from '../../../core/json-patch/builder/json-patch-operation-path-combiner';
import { isNotEmpty, hasValue } from '../../../shared/empty.util';
import { JsonPatchOperationsBuilder } from '../../../core/json-patch/builder/json-patch-operations-builder';
import { SubmissionCcLicenseUrlDataService } from '../../../core/submission/submission-cc-license-url-data.service';
import {ConfigurationDataService} from '../../../core/data/configuration-data.service';
import { FindListOptions } from '../../../core/data/find-list-options.model';

/**
 * This component represents the submission section to select the Creative Commons license.
 */
@Component({
  selector: 'ds-submission-section-cc-licenses',
  templateUrl: './submission-section-cc-licenses.component.html',
  styleUrls: ['./submission-section-cc-licenses.component.scss']
})
@renderSectionFor(SectionsType.CcLicense)
export class SubmissionSectionCcLicensesComponent extends SectionModelComponent implements OnChanges, OnInit {

  /**
   * The form id
   * @type {string}
   */
  public formId: string;

  /**
   * A boolean representing if this section is loading
   * @type {boolean}
   */
  public isLoading = true;

  /**
   * The [JsonPatchOperationPathCombiner] object
   * @type {JsonPatchOperationPathCombiner}
   */
  protected pathCombiner: JsonPatchOperationPathCombiner;

  /**
   * The list of Subscriptions this component subscribes to.
   */
  private subscriptions: Subscription[] = [];

  /**
   * Cache of the available Creative Commons licenses.
   */
  submissionCcLicenses: SubmissionCcLicence[] = [];

  /**
   * Reference to NgbModal
   */
  protected modalRef: NgbModalRef;

  /**
   * Default jurisdiction configured
   */
  defaultJurisdiction: string;

  /**
   * The currently selected cc licence
   */
  selectedCcLicense: SubmissionCcLicence = new SubmissionCcLicence();

  /**
   * Options for paginated data loading
   */
  ccLicenceOptions: FindListOptions = {
    elementsPerPage: 20,
    currentPage: 1,
  };
  /**
   * Check to stop paginated search
   *
   * @private
   */
  private _isLastPage: boolean;

  /**
   * Subject to trigger CC license link updates with debouncing
   */
  private ccLicenseLinkTrigger$ = new Subject<void>();

  /**
   * Whether a remove of the stored uri is queued but not yet saved, so accepting the same license again
   * has to queue an add instead of being skipped as unchanged.
   */
  private uriRemoveQueued = false;

  /**
   * The Creative Commons link saved in the workspace item.
   */
  get storedCcLicenseLink(): string {
    return this.data.uri;
  }

  /**
   * The accepted state for the selected Creative Commons license.
   */
  get accepted(): boolean {
    if (this.data.accepted === undefined) {
      return !!this.data.uri;
    }
    return this.data.accepted;
  }

  ccLicenseLink$: Observable<string>;

  constructor(
    protected modalService: NgbModal,
    protected sectionService: SectionsService,
    protected submissionCcLicensesDataService: SubmissionCcLicenseDataService,
    protected submissionCcLicenseUrlDataService: SubmissionCcLicenseUrlDataService,
    protected operationsBuilder: JsonPatchOperationsBuilder,
    protected configService: ConfigurationDataService,
    protected ref: ChangeDetectorRef,
    @Inject('collectionIdProvider') public injectedCollectionId: string,
    @Inject('sectionDataProvider') public injectedSectionData: SectionDataObject,
    @Inject('submissionIdProvider') public injectedSubmissionId: string
  ) {
    super(
      injectedCollectionId,
      injectedSectionData,
      injectedSubmissionId,
    );
  }

  ngOnInit(): void {
    super.ngOnInit();
    // Initialize the debounced license link observable
    this.ccLicenseLink$ = this.ccLicenseLinkTrigger$.pipe(
      startWith(undefined), // Start with initial trigger
      debounceTime(300), // Debounce rapid clicks
      switchMap(() => this.getCcLicenseLink$() || observableOf(null)),
      shareReplay(1), // Cache the latest result
      distinctUntilChanged()
    );
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (hasValue(changes.sectionData) || hasValue(changes.submissionCcLicenses)) {
      // Trigger the debounced license link update
      this.ccLicenseLinkTrigger$.next();
    }
  }

  /**
   * The data of this section.
   */
  get data(): WorkspaceitemSectionCcLicenseObject {
    return this.sectionData.data as WorkspaceitemSectionCcLicenseObject;
  }

  /**
   * Select a given Creative Commons license.
   * @param ccLicense the Creative Commons license to select.
   */
  selectCcLicense(ccLicense: SubmissionCcLicence) {
    if (this.selectedCcLicense.id === ccLicense.id) {
      return;
    }
    this.selectedCcLicense = ccLicense;
    // A single update, as separate updates would each be compared against stale section data
    this.updateSectionData({
      ccLicense: {
        id: ccLicense.id,
        fields: {},
      },
      uri: undefined,
      accepted: false,
    });
    this.updateSectionStatus();
    // Trigger the debounced license link update
    this.ccLicenseLinkTrigger$.next();
  }

  /**
   * Get the selected Creative Commons license.
   */
  getSelectedCcLicense(): SubmissionCcLicence {
    if (!this.submissionCcLicenses || !this.data.ccLicense) {
      return null;
    }
    return this.submissionCcLicenses.filter((ccLicense) => ccLicense.id === this.data.ccLicense.id)[0];
  }

  /**
   * Select an option for a given license field.
   * @param ccLicense   the related Creative Commons license.
   * @param field       the field for which to select an option.
   * @param option      the option to select.
   */
  selectOption(ccLicense: SubmissionCcLicence, field: Field, option: Option) {
    if (this.isSelectedOption(ccLicense, field, option)) {
      return;
    }
    this.updateSectionData({
      ccLicense: {
        id: ccLicense.id,
        fields: Object.assign({}, this.data.ccLicense.fields, {
          [field.id]: option
        }),
      },
      accepted: false,
    });
    // Trigger the debounced license link update
    this.ccLicenseLinkTrigger$.next();
  }

  /**
   * Get the selected option for a given license field.
   * @param ccLicense   the related Creative Commons license.
   * @param field       the field for which to get the selected option value.
   */
  getSelectedOption(ccLicense: SubmissionCcLicence, field: Field): Option {
    if (field.id === 'jurisdiction' && this.defaultJurisdiction !== undefined && this.defaultJurisdiction !== 'none') {
      return field.enums.find(option => option.id === this.defaultJurisdiction);
    }
    return this.data.ccLicense.fields[field.id];
  }

  /**
   * Whether a given option is selected for a given Creative Commons license field.
   * @param ccLicense   the related Creative Commons license.
   * @param field       the field for which to check whether the option is selected.
   * @param option      the option for which to check whether it is selected.
   */
  isSelectedOption(ccLicense: SubmissionCcLicence, field: Field, option: Option): boolean {
    return this.getSelectedOption(ccLicense, field) && this.getSelectedOption(ccLicense, field).id === option.id;
  }

  /**
   * Get the link to the Creative Commons license corresponding with the selected options.
   */
  getCcLicenseLink$(): Observable<string> {
    if (!this.getSelectedCcLicense() || this.getSelectedCcLicense().fields.some(
      (field) => !this.getSelectedOption(this.getSelectedCcLicense(), field))) {
      // Fall back to the stored link when the selection could not be (fully) restored from it
      return this.storedCcLicenseLink ? observableOf(this.storedCcLicenseLink) : undefined;
    }
    const selectedCcLicense = this.getSelectedCcLicense();
    return this.submissionCcLicenseUrlDataService.getCcLicenseLink(
      selectedCcLicense,
      new Map(selectedCcLicense.fields.map(
        (field) => [field, this.getSelectedOption(selectedCcLicense, field)]
      )),
    );
  }

  /**
   * Open a given info modal.
   * @param content   the modal content.
   */
  openInfoModal(content) {
    this.modalRef = this.modalService.open(content);
  }

  /**
   * Close the info modal.
   */
  closeInfoModal() {
    this.modalRef.close();
  }

  /**
   * Get section status
   *
   * @return Observable<boolean>
   *     the section status
   */
  getSectionStatus(): Observable<boolean> {
    return observableOf(this.accepted);
  }

  /**
   * Unsubscribe from all subscriptions
   */
  onSectionDestroy(): void {
    this.subscriptions.forEach((subscription) => subscription.unsubscribe());
    // Complete the subject to prevent memory leaks
    this.ccLicenseLinkTrigger$.complete();
  }

  /**
   * Initialize the section.
   */
  onSectionInit(): void {
    this.pathCombiner = new JsonPatchOperationPathCombiner('sections', this.sectionData.id);
    this.subscriptions.push(
      this.sectionService.getSectionState(this.submissionId, this.sectionData.id, SectionsType.CcLicense).pipe(
        filter((sectionState) => {
          return isNotEmpty(sectionState) && (isNotEmpty(sectionState.data) || isNotEmpty(sectionState.errorsToShow));
        }),
        distinctUntilChanged((prev, curr) => {
          // More precise comparison to prevent unnecessary updates
          const prevData = prev?.data as WorkspaceitemSectionCcLicenseObject;
          const currData = curr?.data as WorkspaceitemSectionCcLicenseObject;
          return prevData?.accepted === currData?.accepted &&
            prevData?.uri === currData?.uri &&
            JSON.stringify(prevData?.ccLicense) === JSON.stringify(currData?.ccLicense);
        }),
        map((sectionState) => sectionState.data as WorkspaceitemSectionCcLicenseObject),
      ).subscribe((data) => {
        const wasUri = this.data.uri;
        if (!hasValue(data.accepted)) {
          // Section data from the REST API, so any queued patch has been saved
          this.uriRemoveQueued = false;
        }

        // The REST API never returns the accepted state, so only changes made in this section (which always
        // set it) should queue a patch. Otherwise a save response would queue a remove of an already removed uri.
        if (hasValue(data.accepted) && this.data.accepted !== data.accepted) {
          const path = this.pathCombiner.getPath('uri');
          if (data.accepted) {
            // Only add URI if we're switching from not accepted to accepted
            const licenseLink$ = this.getCcLicenseLink$();
            if (licenseLink$) {
              licenseLink$.pipe(
                take(1),
                // Only proceed if link exists and is different, or the stored one is about to be removed
                filter(link => !!link && (this.uriRemoveQueued || link !== wasUri))
              ).subscribe((link) => {
                this.operationsBuilder.add(path, link.toString(), false, true);
                this.uriRemoveQueued = false;
              });
            }
          } else if (this.data.uri) {
            this.operationsBuilder.remove(path);
            this.uriRemoveQueued = true;
          }
        }
        const previousCcLicense = this.data?.ccLicense;
        this.sectionData.data = {
          ...data,
          // The REST API only returns the stored uri, so keep the (restored) selection when it is missing
          ccLicense: data.ccLicense ?? previousCcLicense,
        };
        // The selection is updated asynchronously, so recompute the link once it has landed in the store
        if (JSON.stringify(previousCcLicense) !== JSON.stringify(this.data.ccLicense)) {
          this.ccLicenseLinkTrigger$.next();
        }
      }),
      this.configService.findByPropertyName('cc.license.jurisdiction').pipe(
        getFirstCompletedRemoteData(),
        getRemoteDataPayload()
      ).subscribe((remoteData) => {
        if (remoteData === undefined || remoteData.values.length === 0) {
          // No value configured, use blank value (International jurisdiction)
          this.defaultJurisdiction = '';
        } else {
          this.defaultJurisdiction = remoteData.values[0];
        }
      })
    );
    this.loadCcLicences();
  }

  /**
   * Set the accepted state for the Creative Commons license.
   * @param accepted  the accepted state for the cc license.
   */
  setAccepted(accepted: boolean) {
    this.updateSectionData({
      accepted
    });
    this.updateSectionStatus();
  }

  /**
   * Update the section data for this section.
   */
  updateSectionData(data: WorkspaceitemSectionCcLicenseObject) {
    this.sectionService.updateSectionData(this.submissionId, this.sectionData.id, Object.assign({}, this.data, data));
  }

  onScroll(event) {
    if (event.target.scrollTop + event.target.clientHeight >= event.target.scrollHeight) {
      if (!this.isLoading && !this._isLastPage) {
        this.ccLicenceOptions.currentPage++;
        this.loadCcLicences();
      }
    }
  }

  loadCcLicences() {
    this.isLoading = true;

    this.subscriptions.push(
      this.submissionCcLicensesDataService.findAll(this.ccLicenceOptions).pipe(
        getFirstSucceededRemoteDataPayload(),
        tap((response) => this._isLastPage = response.pageInfo.currentPage === response.pageInfo.totalPages),
        map((list) => list.page),
      ).subscribe(
        (licenses) => {
          this.submissionCcLicenses = [...this.submissionCcLicenses, ...licenses];
          this.isLoading = false;
          this.restoreSelectionFromStoredUri();
          this.ref.detectChanges();
        },
      ),
    );
  }

  /**
   * Rebuild the license selection (license + field answers) from the stored license uri.
   * The REST API only returns the uri of a saved license, so without this the previously chosen
   * license and options can't be shown or changed after the submission has been saved and reopened.
   * Does not touch the uri or accepted state, as the stored license remains valid.
   */
  private restoreSelectionFromStoredUri(): void {
    if (hasValue(this.data?.ccLicense) || !this.storedCcLicenseLink) {
      return;
    }
    const parsed = this.parseCcLicenseUri(this.storedCcLicenseLink);
    if (!parsed) {
      return;
    }
    const license = this.submissionCcLicenses.find((ccLicense) => parsed.matches(ccLicense.name ?? ''));
    if (!license) {
      // The license might be on a page that hasn't been loaded yet
      return;
    }

    const fields: { [fieldId: string]: Option } = {};
    (license.fields ?? []).forEach((field) => {
      let optionId: string;
      switch (field.id) {
        case 'commercial':
          optionId = parsed.unit.includes('nc') ? 'n' : 'y';
          break;
        case 'derivatives':
          optionId = parsed.unit.includes('nd') ? 'n' : parsed.unit.includes('sa') ? 'sa' : 'y';
          break;
        case 'jurisdiction':
          optionId = parsed.jurisdiction ?? '';
          break;
        case 'sampling':
          // e.g. 'nc-sampling+' -> 'ncsamplingplus'
          optionId = parsed.unit.replace('-', '').replace('+', 'plus');
          break;
      }
      const option = field.enums?.find((o) => o.id === optionId);
      if (option) {
        fields[field.id] = option;
      }
    });

    this.selectedCcLicense = license;
    this.updateSectionData({
      ccLicense: {
        id: license.id,
        fields,
      },
    });
  }

  /**
   * Parse a creativecommons.org license uri into its unit (e.g. 'by-nc-nd', 'sampling+', 'zero'), version and
   * optional jurisdiction, together with a matcher for the name of the corresponding license.
   * Returns null for uris that don't match a known Creative Commons pattern.
   * @param uri the stored license uri
   */
  private parseCcLicenseUri(uri: string): { unit: string, jurisdiction?: string, matches: (name: string) => boolean } {
    const standard = /creativecommons\.org\/licenses\/([a-z+-]+)\/(\d+\.\d+)(?:\/([a-z_-]+))?/i.exec(uri);
    if (standard) {
      const version = standard[2];
      return {
        unit: standard[1].toLowerCase(),
        jurisdiction: standard[3]?.toLowerCase(),
        matches: (name) => name.includes(`(${version})`),
      };
    }
    const publicDomain = /creativecommons\.org\/publicdomain\/(zero|mark|certification)\//i.exec(uri);
    if (publicDomain) {
      const unit = publicDomain[1].toLowerCase();
      const namePart = { zero: 'cc0', mark: 'mark', certification: 'certification' }[unit];
      return {
        unit,
        matches: (name) => name.toLowerCase().includes(namePart),
      };
    }
    return null;
  }
}
