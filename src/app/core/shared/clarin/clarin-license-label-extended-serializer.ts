/**
 * The Clarin License REST/API accepts the licenseLabel.extended as a boolean.
 * Keep backward compatibility for legacy string values.
 */
export const ClarinLicenseLabelExtendedSerializer = {

  Serialize(extended: any): boolean {
    if (typeof extended === 'boolean') {
      return extended;
    }

    return extended === 'Yes';
  },
};
