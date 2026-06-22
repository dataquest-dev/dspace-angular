import {
  Pipe,
  PipeTransform,
} from '@angular/core';

import { ClarinLicenseRequiredInfo } from '../../core/shared/clarin/clarin-license.resource-type';
import { isEmpty } from '../empty.util';

/**
 * Pipe to join Extended Clarin License Label value with ','
 */
@Pipe({ standalone: true,
  name: 'dsCLicenseRequiredInfo',
})
export class ClarinLicenseRequiredInfoPipe implements PipeTransform {
  transform(value: ClarinLicenseRequiredInfo[]): string {
    if (!Array.isArray(value)) {
      return value;
    }

    if (isEmpty(value)) {
      return '';
    }

    const requiredInfo = [];
    value.forEach((clarinLicenseRequiredInfo: ClarinLicenseRequiredInfo) => {
      requiredInfo.push(clarinLicenseRequiredInfo.name);
    });

    return requiredInfo.join(', ');
  }
}

