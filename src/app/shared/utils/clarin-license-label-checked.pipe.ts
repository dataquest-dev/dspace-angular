import {Pipe, PipeTransform} from '@angular/core';
import {ClarinLicenseLabel} from '../../core/shared/clarin/clarin-license-label.model';
import {isEmpty, isNotEmpty} from '../empty.util';

/**
 * Pipe to mark checkbox or radio input to true/false based on the input form data.
 * This Pipe is used for editing Clarin Licenses.
 */
@Pipe({
  name: 'dsCheckedLicenseLabel'
})
export class ClarinLicenseLabelCheckedPipe implements PipeTransform {

  /**
   * If the clarinLicenseLabels contains clarinLicenseLabel return true otherwise return false
   * Compare Ids
   * @param clarinLicenseLabel to compare
   * @param clarinLicenseLabels all extended clarin license labels or non extended clarin license label in array
   */
  transform(clarinLicenseLabel: ClarinLicenseLabel, clarinLicenseLabels: any[]): boolean {
    let contains = false;
    if (isEmpty(clarinLicenseLabel) || isEmpty(clarinLicenseLabels)) {
      return contains;
    }
    clarinLicenseLabels.forEach(cll => {
      if (cll.id === clarinLicenseLabel.id) {
        contains = true;
      }
    });
    return contains;
  }
}
