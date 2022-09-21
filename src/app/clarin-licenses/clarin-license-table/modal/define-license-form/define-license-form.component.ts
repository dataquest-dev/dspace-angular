import {Component, Input, OnInit} from '@angular/core';
import {AbstractControl, FormArray, FormBuilder, FormControl, FormGroup, Validators} from '@angular/forms';
import {NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';
import {ClarinLicenseLabel} from '../../../../core/shared/clarin/clarin-license-label.model';
import {CLARIN_LICENSE_CONFIRMATION} from '../../../../core/shared/clarin/clarin-license.resource-type';
import {ClarinLicenseLabelDataService} from '../../../../core/data/clarin/clarin-license-label-data.service';
import {getFirstSucceededRemoteListPayload} from '../../../../core/shared/operators';
import {validateLicenseLabel} from './define-license-form-validator';
import wait from 'fork-ts-checker-webpack-plugin/lib/utils/async/wait';
import {DomSanitizer} from '@angular/platform-browser';

@Component({
  selector: 'ds-define-license-form',
  templateUrl: './define-license-form.component.html',
  styleUrls: ['./define-license-form.component.scss']
})
export class DefineLicenseFormComponent implements OnInit {

  constructor(
    public activeModal: NgbActiveModal,
    private formBuilder: FormBuilder,
    private clarinLicenseLabelService: ClarinLicenseLabelDataService,
    private sanitizer: DomSanitizer
  ) {
  }

  /**
   * The `name` of the Clarin License
   */
  @Input()
  name = '';

  /**
   * The `definition` of the Clarin License
   */
  @Input()
  definition = '';

  /**
   * The `confirmation` of the Clarin License. This value is converted to the number in the appropriate Serializer
   */
  @Input()
  confirmation = '';

  /**
   * The `requiredInfo` of the Clarin License
   */
  @Input()
  requiredInfo = '';

  /**
   * Selected extended license labels
   */
  @Input()
  extendedClarinLicenseLabels = [];

  /**
   * Selected non extended clarin license label - could be selected only one clarin license label
   */
  @Input()
  clarinLicenseLabel: ClarinLicenseLabel = null;

  /**
   * The form with the Clarin License input fields
   */
  clarinLicenseForm: FormGroup = null;

  /**
   * The possible options for the `confirmation` input field
   */
  confirmationOptions: any[] = CLARIN_LICENSE_CONFIRMATION;

  /**
   * All non extended Clarin License Labels, admin could select only one Clarin License Label
   */
  clarinLicenseLabelOptions: ClarinLicenseLabel[] = [];

  /**
   * All extended Clarin License Labels, admin could select multiple Clarin License Labels
   */
  extendedClarinLicenseLabelOptions: ClarinLicenseLabel[] = [];

  ngOnInit(): void {
    this.createForm();
    // load clarin license labels
    this.loadAndAssignClarinLicenseLabels();
  }

  /**
   * After init load loadExtendedClarinLicenseLabels
   */
  ngAfterViewInit(): void {
    // wait because the form is not loaded immediately after init - do not know why
    wait(500).then(r => {
      this.loadExtendedClarinLicenseLabels();
    });
  }

  /**
   * Create the clarin license input fields form with init values which are passed from the clarin-license-table
   * @private
   */
  private createForm() {
    this.clarinLicenseForm = this.formBuilder.group({
      name: [this.name, Validators.required],
      definition: [this.definition, Validators.required],
      confirmation: this.confirmation,
      clarinLicenseLabel: [this.clarinLicenseLabel, validateLicenseLabel()],
      extendedClarinLicenseLabels: new FormArray([])
    });
  }

  /**
   * The extended clarin licenses labels show as selected in the form - if the clarin license is editing the admin
   * must see which extended clarin license labels are selected
   * @private
   */
  private loadExtendedClarinLicenseLabels() {
    // add passed extendedClarinLicenseLabels to the form because add them to the form in the init is a problem
    const extendedClarinLicenseLabels = (this.clarinLicenseForm.controls.extendedClarinLicenseLabels).value as any[];
    this.extendedClarinLicenseLabels.forEach(extendedClarinLicenseLabel => {
      extendedClarinLicenseLabels.push(extendedClarinLicenseLabel);
    });
  }

  /**
   * Convert raw byte array to the image is not secure - this function make it secure
   * @param imageByteArray as secure byte array
   */
  secureImageData(imageByteArray) {
    const objectURL = 'data:image/png;base64,' + imageByteArray;
    return this.sanitizer.bypassSecurityTrustUrl(objectURL);
  }

  /**
   * Send form value to the clarin-license-table component where it will be processed
   */
  submitForm() {
    this.activeModal.close(this.clarinLicenseForm.value);
  }

  /**
   * Add or remove extended clarin license label based on the checkbox selection
   * @param event
   * @param extendedClarinLicenseLabel
   */
  changeExtendedClarinLicenseLabels(event: any, extendedClarinLicenseLabel) {
    const extendedClarinLicenseLabels = (this.clarinLicenseForm.controls.extendedClarinLicenseLabels).value as any[];
    if (event.target.checked) {
      extendedClarinLicenseLabels.push(extendedClarinLicenseLabel);
    } else {
      extendedClarinLicenseLabels.forEach((ell: ClarinLicenseLabel, index)  => {
        if (ell.id === extendedClarinLicenseLabel.id) {
          extendedClarinLicenseLabels.splice(index, 1);
        }
      });
    }

  }

  /**
   * Load all ClarinLicenseLabels and divide them based on the extended property.
   * @private
   */
  private loadAndAssignClarinLicenseLabels() {
    this.clarinLicenseLabelService.findAll({}, false)
      .pipe(getFirstSucceededRemoteListPayload())
      .subscribe(res => {
        res.forEach(clarinLicenseLabel => {
          if (clarinLicenseLabel.extended) {
            this.extendedClarinLicenseLabelOptions.push(clarinLicenseLabel);
          } else {
            this.clarinLicenseLabelOptions.push(clarinLicenseLabel);
          }
        });
      });
  }
}
