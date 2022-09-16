import {Pipe, PipeTransform} from '@angular/core';
import {ClarinLicenseLabel} from '../../core/shared/clarin/clarin-license-label.model';
import {isEmpty, isNull} from '../empty.util';

/**
 * Pipe to mark radio input to true/false based on the input form data.
 * This Pipe is used for editing Non Extended Clarin License Labels.
 */
@Pipe({
  name: 'dsCheckedLicenseLabelValue'
})
export class ClarinLicenseLabelCheckedValuePipe implements PipeTransform {

  transform(checkedClarinLicenseLabel: ClarinLicenseLabel, passedClarinLicenseLabels: ClarinLicenseLabel[]): ClarinLicenseLabel {
    // if nothing is checked - return null
    if (isNull(checkedClarinLicenseLabel)) {
      return;
    }
    // if there is no passed clarin license label in the form - the license is not editing
    if (isEmpty(passedClarinLicenseLabels)) {
      return checkedClarinLicenseLabel;
    }

    // if passed cll should be marked as `checked`
    passedClarinLicenseLabels.forEach(pcll => {
      if (pcll.id === checkedClarinLicenseLabel.id) {
        return pcll;
      }
    });
    // if (passedClarinLicenseLabels.id === checkedClarinLicenseLabel.id) {
    //   return passedClarinLicenseLabel;
    // }
    return checkedClarinLicenseLabel;
  }
}
