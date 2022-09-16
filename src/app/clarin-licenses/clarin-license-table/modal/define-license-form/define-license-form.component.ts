import {Component, Input, OnInit} from '@angular/core';
import {AbstractControl, FormArray, FormBuilder, FormControl, FormGroup, Validators} from '@angular/forms';
import {NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';
import {ClarinLicenseLabel} from '../../../../core/shared/clarin/clarin-license-label.model';
import {CLARIN_LICENSE_CONFIRMATION} from '../../../../core/shared/clarin/clarin-license.resource-type';
import {ClarinLicenseLabelDataService} from '../../../../core/data/clarin/clarin-license-label-data.service';
import {getFirstSucceededRemoteListPayload} from '../../../../core/shared/operators';
import {validateExtendedLicenseLabels, validateLicenseLabel} from './define-license-form-validator';
import {MapType} from '@angular/compiler';

@Component({
  selector: 'ds-define-license-form',
  templateUrl: './define-license-form.component.html',
  styleUrls: ['./define-license-form.component.scss']
})
export class DefineLicenseFormComponent implements OnInit {

  constructor(
    public activeModal: NgbActiveModal,
    private formBuilder: FormBuilder,
    private clarinLicenseLabelService: ClarinLicenseLabelDataService
  ) {
    this.createForm();
  }

  @Input()id: number;
  clarinLicenseForm: FormGroup;
  confirmationOptions: any[] = CLARIN_LICENSE_CONFIRMATION;
  clarinLicenseLabelOptions: ClarinLicenseLabel[] = [];
  extendedClarinLicenseLabelOptions: ClarinLicenseLabel[] = [];

  // tslint:disable-next-line:no-empty
  ngOnInit(): void {
    // load clarin license labels
   this.loadAndAssignClarinLicenseLabels();
  }

  private createForm() {
    this.clarinLicenseForm = this.formBuilder.group({
      name: ['', Validators.required],
      definition: ['', Validators.required],
      confirmation: '',
      clarinLicenseLabel: [new FormControl(false), validateLicenseLabel()],
      extendedClarinLicenseLabels: new FormArray([], validateExtendedLicenseLabels())
    });
  }

  submitForm() {
    this.activeModal.close(this.clarinLicenseForm.value);
  }

  // add or remove extended clarin license label based on the checkbox selection
  changeExtendedClarinLicenseLabels(event: any, extendedClarinLicenseLabel) {
    const selectedCountries = (this.clarinLicenseForm.controls.extendedClarinLicenseLabels).value as any[];
    if (event.target.checked) {
      selectedCountries.push(extendedClarinLicenseLabel);
    } else {
      selectedCountries.forEach((ell: ClarinLicenseLabel, index)  => {
        if (ell.id === extendedClarinLicenseLabel.id) {
          selectedCountries.splice(index, 1);
        }
      });
    }
  }

  /**
   * Load all ClarinLicenseLabels and divide them based on the extended property.
   * @private
   */
  private loadAndAssignClarinLicenseLabels() {
    this.clarinLicenseLabelService.findAll()
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
