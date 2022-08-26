import {link, typedObject} from '../cache/builders/build-decorators';
import {ListableObject} from '../../shared/object-collection/shared/listable-object.model';
import {HALResource} from '../shared/hal-resource.model';
import {excludeFromEquals} from '../utilities/equals.decorators';
import {autoserialize, autoserializeAs, Deserialize, deserialize, inheritSerialization, Serialize} from 'cerialize';
import {ResourceType} from '../shared/resource-type';
import {HALLink} from '../shared/hal-link.model';
import {Observable} from 'rxjs';
import {RemoteData} from '../data/remote-data';
import {GenericConstructor} from '../shared/generic-constructor';
import {HANDLE} from './handle.resource-type';
import {DSPACE_OBJECT} from '../shared/dspace-object.resource-type';
import {DSpaceObject} from '../shared/dspace-object.model';
import {isNotEmpty} from '../../shared/empty.util';
import {MetadataMap, MetadataValue} from '../shared/metadata.models';
import {Collection} from '../shared/collection.model';
import {UNDEFINED_NAME} from '../../shared/mocks/dso-name.service.mock';
import {HandleResourceTypeIdSerializer} from './HandleResourceTypeIdserializer';

export const SUCCESSFUL_RESPONSE_START_CHAR = '2';
export const COMMUNITY = 'Community';
export const COLLECTION = 'Collection';
export const ITEM = 'Item';

/**
 * Class the represents a metadata field
 */
@typedObject
export class Handle extends ListableObject implements HALResource {
  static type = HANDLE;

  /**
   * The object type
   */
  @excludeFromEquals
  @autoserialize
  type: ResourceType;

  /**
   * The identifier of this metadata field
   */
  @autoserialize
  id: number;

  /**
   * The qualifier of this metadata field
   */
  @autoserialize
  handle: string;

  /**
   * The url of this metadata field
   */
  @autoserialize
  url: string;

  /**
   * The element of this metadata field
   */
  @autoserializeAs(HandleResourceTypeIdSerializer)
  resourceTypeID: string;

  /**
   * The {@link HALLink}s for this MetadataField
   */
  @deserialize
  _links: {
    self: HALLink,
  };

  /**
   * Method that returns as which type of object this object should be rendered
   */
  getRenderTypes(): (string | GenericConstructor<ListableObject>)[] {
    return [this.constructor as GenericConstructor<ListableObject>];
  }
}


