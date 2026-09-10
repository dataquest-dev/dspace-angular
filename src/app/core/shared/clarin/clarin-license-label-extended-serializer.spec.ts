import { ClarinLicenseLabelExtendedSerializer } from './clarin-license-label-extended-serializer';

/**
 * `extended` became a real boolean in the license label form (dtq-dev #1299), while older
 * payloads still carry the legacy 'Yes'/'No' strings. None of the ported component specs
 * exercises the boolean branch, so it is covered here.
 */
describe('ClarinLicenseLabelExtendedSerializer', () => {

  it('should pass a boolean true through unchanged', () => {
    expect(ClarinLicenseLabelExtendedSerializer.Serialize(true)).toBeTrue();
  });

  it('should pass a boolean false through unchanged', () => {
    expect(ClarinLicenseLabelExtendedSerializer.Serialize(false)).toBeFalse();
  });

  it('should keep converting the legacy "Yes" string to true', () => {
    expect(ClarinLicenseLabelExtendedSerializer.Serialize('Yes')).toBeTrue();
  });

  it('should keep converting any other legacy string to false', () => {
    expect(ClarinLicenseLabelExtendedSerializer.Serialize('No')).toBeFalse();
  });
});
