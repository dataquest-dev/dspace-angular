import {CLARIN_LICENSE_CONFIRMATION} from './clarin-license.resource-type';

export const ClarinLicenseLabelExtendedSerializer = {

  Serialize(extended: any): boolean {
    return extended === 'Yes';
  },

  Deserialize(extended: any): string {
    return extended ? 'Yes' : 'No';
  }
};
