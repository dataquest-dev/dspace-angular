import { Component, Input, OnInit } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { isNull } from '../../../../shared/empty.util';
import { ClarinLicenseLabel } from '../../../../core/shared/clarin/clarin-license-label.model';
import { secureImageData } from '../../../../shared/clarin-shared-util';

/**
 * The component for defining the Clarin License Label
 */
@Component({
  selector: 'ds-define-license-label-form',
  templateUrl: './define-license-label-form.component.html',
  styleUrls: ['./define-license-label-form.component.scss']
})
export class DefineLicenseLabelFormComponent implements OnInit {

  constructor(public activeModal: NgbActiveModal,
              private formBuilder: FormBuilder,
              private sanitizer: DomSanitizer) { }

  /**
   * The `label` of the Clarin License Label. That's the shortcut which is max 5 characters long.
   */
  @Input()
  label = '';

  /**
   * The `title` of the Clarin License Label.
   */
  @Input()
  title = '';

  /**
   * The `extended` boolean of the Clarin License Label.
   */
  @Input()
  extended = false;

  /**
   * The `icon` of the Clarin License Label. This value is converted to the byte array.
   */
  @Input()
  icon = '';

  /**
   * The existing Clarin License Label to edit. When provided, the component runs in edit mode.
   */
  @Input()
  clarinLicenseLabel: ClarinLicenseLabel = null;

  /**
   * Returns true when an existing label was passed in (edit mode), false otherwise (create mode).
   */
  get isEditMode(): boolean {
    return !isNull(this.clarinLicenseLabel);
  }

  /**
   * Returns true when the label being edited currently has an icon to preview.
   */
  get hasIcon(): boolean {
    return this.clarinLicenseLabel?.icon?.length > 0;
  }

  /**
   * Returns a sanitized data URL for the current icon so it can be previewed in the form.
   */
  get currentIconUrl(): SafeUrl {
    return secureImageData(this.sanitizer, this.clarinLicenseLabel?.icon);
  }

  /**
   * The form with the Clarin License Label input fields
   */
  clarinLicenseLabelForm: FormGroup;

  /**
   * Is the Clarin License Label extended or no options.
   */
  extendedOptions = [
    { value: true, translationKey: 'clarin.license.label.table.boolean.yes' },
    { value: false, translationKey: 'clarin.license.label.table.boolean.no' }
  ];

  ngOnInit(): void {
    this.createForm();
    if (this.isEditMode) {
      this.clarinLicenseLabelForm.patchValue({
        label: this.clarinLicenseLabel.label,
        title: this.clarinLicenseLabel.title,
        extended: this.clarinLicenseLabel.extended,
      });
    }
  }

  /**
   * Create form for changing license label data. The initial form values are passed from the selected license label
   * from the clarin-license-table.
   */
  private createForm() {
    this.clarinLicenseLabelForm = this.formBuilder.group({
      label: [this.label, [Validators.required, Validators.maxLength(5)]],
      title: [this.title, Validators.required],
      extended: [this.extended],
      icon: [this.icon],
      // When true the current icon is removed on save (only relevant in edit mode).
      clearIcon: [false],
    });
  }

  /**
   * Send form value to the clarin-license-table component where it will be processed
   */
  submitForm() {
    this.activeModal.close(this.clarinLicenseLabelForm.value);
  }
}
