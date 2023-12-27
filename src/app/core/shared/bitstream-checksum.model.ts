import {BITSTREAM_CHECKSUM} from './bitstream-checksum.resource';
import {excludeFromEquals} from '../utilities/equals.decorators';
import {autoserialize, deserialize} from 'cerialize';
import {ResourceType} from './resource-type';
import {HALLink} from './hal-link.model';
import {typedObject} from '../cache/builders/build-decorators';
import {TypedObject} from '../cache/typed-object.model';


/**
 * Class which is user do wrap Authorization response data for endpoint `/api/authrn`
 */
@typedObject
export class BitstreamChecksum extends TypedObject {
  /**
   * The `bitstreamSyncChecksum` object type.
   */
  static type = BITSTREAM_CHECKSUM;

  // /**
  //  * The object type
  //  */
  /**
   * The object type
   */
  @excludeFromEquals
  @autoserialize
  type: ResourceType;

  /**
   * The identifier of this Clarin License
   // */
  @autoserialize
  id: string;

  /**
   * The name of this Clarin License object
   */
  @autoserialize
  activeStore: CheckSum;

  @autoserialize
  databaseChecksum: CheckSum;

  @autoserialize
  synchronizedStore: CheckSum;

  @deserialize
  _links: {
    self: HALLink
  };

  // getRenderTypes(): (string | GenericConstructor<ListableObject>)[] {
  //   return [this.constructor as GenericConstructor<ListableObject>];
  // }
}

interface CheckSum {
  checkSumAlgorithm: string;
  value: string;
}
