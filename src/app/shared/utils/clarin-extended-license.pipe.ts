import {
  Pipe,
  PipeTransform,
} from '@angular/core';

import { ClarinLicenseLabel } from '../../core/shared/clarin/clarin-license-label.model';
import { isNotEmpty } from '../empty.util';

/**
 * Pipe to join Extended Clarin License Label value with ','
 */
@Pipe({ standalone: true,
  name: 'dsExtendedCLicense',
})
export class ClarinExtendedLicensePipe implements PipeTransform {

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
