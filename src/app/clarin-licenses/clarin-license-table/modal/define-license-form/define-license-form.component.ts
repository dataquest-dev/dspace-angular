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
  ) { }

  @Input()
  name = '';

  @Input()
  definition = '';

  @Input()
  confirmation = '';

  @Input()
  requiredInfo = '';

  @Input()
  extendedClarinLicenseLabels = [];

  @Input()
  clarinLicenseLabel: ClarinLicenseLabel = null;

  clarinLicenseForm: FormGroup;
  confirmationOptions: any[] = CLARIN_LICENSE_CONFIRMATION;
  clarinLicenseLabelOptions: ClarinLicenseLabel[] = [];
  extendedClarinLicenseLabelOptions: ClarinLicenseLabel[] = [];

  // tslint:disable-next-line:no-empty
  ngOnInit(): void {
    console.log('ngOnInit name', this.name);
    this.createForm();
    // load clarin license labels
   this.loadAndAssignClarinLicenseLabels();
  }

  private createForm() {
    console.log('createForm name', this.name);
    this.clarinLicenseForm = this.formBuilder.group({
      name: [this.name, Validators.required],
      definition: [this.definition, Validators.required],
      confirmation: [this.confirmation, Validators.required],
      clarinLicenseLabel: [this.clarinLicenseLabel, validateLicenseLabel()],
      extendedClarinLicenseLabels: new FormArray([])
    });

    const extendedClarinLicenseLabelsForm =
      (this.clarinLicenseForm.controls.extendedClarinLicenseLabels).value as any[];
    this.extendedClarinLicenseLabels.forEach(extendedClarinLicenseLabel => {
      const form = new FormControl(extendedClarinLicenseLabel);
      extendedClarinLicenseLabelsForm.push(form);
    });

    console.log('this.clarinLicenseForm.controls.clarinLicenseLabel', this.clarinLicenseForm.controls.clarinLicenseLabel);
  }

  submitForm() {
    this.activeModal.close(this.clarinLicenseForm.value);
  }

  // add or remove extended clarin license label based on the checkbox selection
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
