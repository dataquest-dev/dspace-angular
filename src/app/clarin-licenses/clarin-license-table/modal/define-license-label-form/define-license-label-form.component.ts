import {Component, Input, OnInit} from '@angular/core';
import {NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';
import {FormArray, FormBuilder, FormGroup, Validators} from '@angular/forms';
import {ClarinLicenseLabelDataService} from '../../../../core/data/clarin/clarin-license-label-data.service';
import {validateLicenseLabel} from '../define-license-form/define-license-form-validator';
import {isNotEmpty} from '../../../../shared/empty.util';

@Component({
  selector: 'ds-define-license-label-form',
  templateUrl: './define-license-label-form.component.html',
  styleUrls: ['./define-license-label-form.component.scss']
})
export class DefineLicenseLabelFormComponent implements OnInit {

  constructor(public activeModal: NgbActiveModal,
              private formBuilder: FormBuilder,
              private clarinLicenseLabelService: ClarinLicenseLabelDataService) { }

  @Input()
  label = '';

  @Input()
  title = '';

  @Input()
  extended = '';

  @Input()
  icon = '';

  clarinLicenseLabelForm: FormGroup;

  extendedOptions = ['Yes', 'No'];

  ngOnInit(): void {
    this.createForm();
  }

  private createForm() {
    this.clarinLicenseLabelForm = this.formBuilder.group({
      label: [this.label, Validators.required],
      title: [this.title, Validators.required],
      extended: isNotEmpty(this.extended) ? this.extended : this.extendedOptions[0],
      icon: [this.icon, validateLicenseLabel()],
    });
  }

  submitForm() {
    this.activeModal.close(this.clarinLicenseLabelForm.value);
  }

}
