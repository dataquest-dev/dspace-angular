import { Pipe, PipeTransform } from '@angular/core';
import { ClarinLicenseRequiredInfo } from '../../core/shared/clarin/clarin-license.resource-type';
import { isEmpty } from '../empty.util';

/**
 * Pipe to mark checkbox or input to true/false based on the input form data.
 * This Pipe is used for editing Clarin License - required info.
 */
@Pipe({
  name: 'dsCheckedRI'
})
export class ClarinLicenseRequiredInfoCheckedPipe implements PipeTransform {

  /**
   * If the clarinLicense contains the required info return true otherwise return false
   * @param clarinLicenseProp required info to compare
   * @param clarinLicenseProps all required info which the clarin license contains
   */
  transform(clarinLicenseProp: any | ClarinLicenseRequiredInfo, clarinLicenseProps: any[]): boolean {
    let contains = false;
    if (isEmpty(clarinLicenseProp) || isEmpty(clarinLicenseProps)) {
      return contains;
    }
    clarinLicenseProps.forEach(cll => {
      if (cll.name === clarinLicenseProp.name) {
        contains = true;
      }
    });
    return contains;
  }
}
