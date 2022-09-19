import {AbstractControl, ValidationErrors, ValidatorFn} from '@angular/forms';

export function validateLicenseLabel(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    if (!control.value) {
      return { licenseLabel: true };
    }

    return null;
  };
}
