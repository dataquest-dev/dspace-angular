import {Component, Input, OnInit} from '@angular/core';
import {AbstractControl, FormArray, FormBuilder, FormControl, FormGroup, Validators} from '@angular/forms';
import {NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';
import {ClarinLicenseLabel} from '../../../../core/shared/clarin/clarin-license-label.model';
import {CLARIN_LICENSE_CONFIRMATION} from '../../../../core/shared/clarin/clarin-license.resource-type';
import {ClarinLicenseLabelDataService} from '../../../../core/data/clarin/clarin-license-label-data.service';
import {getFirstSucceededRemoteListPayload} from '../../../../core/shared/operators';
import {validateExtendedLicenseLabels, validateLicenseLabel} from './define-license-form-validator';

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

    // this.lls[0].label = 'test';
    // this.lls[1].label = 'test2';
  }

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

  private createForm() {
    this.clarinLicenseForm = this.formBuilder.group({
      name: ['', Validators.required],
      definitionURL: ['', Validators.required],
      confirmation: ['', Validators.required],
      licenseLabel: [new FormControl(false), validateLicenseLabel()],
      // myCheckboxGroup: new FormGroup({
      //   myCheckbox1: new FormControl(false),
      //   myCheckbox2: new FormControl(false),
      //   myCheckbox3: new FormControl(false),
      // }, requireCheckboxesToBeCheckedValidator()),
      extendedLicenseLabels: new FormArray([], validateExtendedLicenseLabels())
      // requiredInfo: [[], Validators.required],
    });
  }

  private submitForm() {
    this.activeModal.close(this.clarinLicenseForm.value);
  }

  onCheckboxChange(event: any, extendedClarinLicenseLabel) {
    const selectedCountries = (this.clarinLicenseForm.controls.extendedLicenseLabels).value as any[];
    console.log(event);
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
}
