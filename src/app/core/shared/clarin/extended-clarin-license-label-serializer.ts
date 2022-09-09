/**
 * Serializer to create convert the 'all' value supported by the server to an empty string and vice versa.
 */
export class ExtendedClarinLicenseLabelSerializer {

  /**
   * Method to serialize a setId
   * @param {string} setId
   * @returns {string} the provided set ID, unless when an empty set ID is provided. In that case, 'all' will be returned.
   */
  Serialize(setId: string): any {

    return setId;
  }

  /**
   * Method to deserialize a setId
   * @param {string} setId
   * @returns {string} the provided set ID. When 'all' is provided, an empty set ID will be returned.
   */
  Deserialize(setId: string): string {

    return setId;
  }
}
