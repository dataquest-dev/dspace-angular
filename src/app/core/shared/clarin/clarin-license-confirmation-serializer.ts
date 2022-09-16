import {CLARIN_LICENSE_CONFIRMATION} from './clarin-license.resource-type';

export const ClarinLicenseConfirmationSerializer = {

  Serialize(confirmationMessage: any): number {
    switch (confirmationMessage) {
      case CLARIN_LICENSE_CONFIRMATION[1]:
        return 1;
      case CLARIN_LICENSE_CONFIRMATION[2]:
        return 2;
      case CLARIN_LICENSE_CONFIRMATION[3]:
        return 3;
      default:
        return 0;
    }
  },

  Deserialize(confirmationId: any): string {
    return CLARIN_LICENSE_CONFIRMATION[confirmationId];
  }
};
