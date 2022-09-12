import { Pipe, PipeTransform } from '@angular/core';
import {hasValue, isNotEmpty} from '../empty.util';
import {ClarinLicenseLabel} from '../../core/shared/clarin/clarin-license-label.model';

/**
 * Pipe to truncate a value in Angular. (Take a substring, starting at 0)
 * Default value: 10
 */
@Pipe({
  name: 'dsExtendedCLicense'
})
export class ClarinExtendedLicensePipe implements PipeTransform {

  /**
   *
   */
  transform(value: ClarinLicenseLabel[]): string {
    if (isNotEmpty(value)) {
      const titles = [];
      value.forEach(clarinLicenseLabel => {
        titles.push(clarinLicenseLabel.label);
      });
      return titles.join(', ');
    } else {
      return '';
    }
  }

}
