import {AbstractControl, ValidationErrors, ValidatorFn} from '@angular/forms';

export function validateExtendedLicenseLabels(): (control: AbstractControl) => (ValidationErrors | null) {
  return (control: AbstractControl): ValidationErrors | null => {

    // const value = control.value;
    //
    // if (!value) {
    //   return null;
    // }
    //
    // const hasUpperCase = /[A-Z]+/.test(value);
    //
    // const hasLowerCase = /[a-z]+/.test(value);
    //
    // const hasNumeric = /[0-9]+/.test(value);
    //
    // const passwordValid = hasUpperCase && hasLowerCase && hasNumeric;

    return null;
  };
}

export function validateLicenseLabel(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {

    const value = control.value;

    if (!value) {
      return null;
    }

    const hasUpperCase = /[A-Z]+/.test(value);

    const hasLowerCase = /[a-z]+/.test(value);

    const hasNumeric = /[0-9]+/.test(value);

    const passwordValid = hasUpperCase && hasLowerCase && hasNumeric;

    return null;
  };
}
