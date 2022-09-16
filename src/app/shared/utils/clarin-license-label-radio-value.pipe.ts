import {Pipe, PipeTransform} from '@angular/core';
import {ClarinLicenseLabel} from '../../core/shared/clarin/clarin-license-label.model';
import {isEmpty, isNotEmpty, isNull} from '../empty.util';

/**
 * Pipe to mark radio input to true/false based on the input form data.
 * This Pipe is used for editing Non Extended Clarin License Labels.
 */
@Pipe({
  name: 'dsRadioLicenseLabelValue'
})
export class ClarinLicenseLabelRadioValuePipe implements PipeTransform {

  /**
   *
   * @param checkedClarinLicenseLabel Clicked non extended Clarin License Label
   * @param passedClarinLicenseLabel The non extended Clarin License Label passed from selected Clarin License.
   */
  transform(checkedClarinLicenseLabel: ClarinLicenseLabel, passedClarinLicenseLabel: ClarinLicenseLabel): ClarinLicenseLabel {
    // if nothing is checked - return null
    if (isNull(checkedClarinLicenseLabel)) {
      return;
    }
    // if there is no passed clarin license label in the form - the license is not editing
    if (isNull(passedClarinLicenseLabel)) {
      return checkedClarinLicenseLabel;
    }

    // if passed cll should be marked as `checked`
    if (passedClarinLicenseLabel.id === checkedClarinLicenseLabel.id) {
      return passedClarinLicenseLabel;
    }
    return checkedClarinLicenseLabel;
  }
}
