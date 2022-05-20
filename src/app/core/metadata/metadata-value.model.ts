import {link, typedObject} from '../cache/builders/build-decorators';
import {ListableObject} from '../../shared/object-collection/shared/listable-object.model';
import {HALResource} from '../shared/hal-resource.model';
import {METADATA_FIELD} from './metadata-field.resource-type';
import {excludeFromEquals} from '../utilities/equals.decorators';
import {autoserialize, deserialize} from 'cerialize';
import {ResourceType} from '../shared/resource-type';
import {HALLink} from '../shared/hal-link.model';
import {METADATA_SCHEMA} from './metadata-schema.resource-type';
import {Observable} from 'rxjs';
import {RemoteData} from '../data/remote-data';
import {MetadataSchema} from './metadata-schema.model';
import {isNotEmpty} from '../../shared/empty.util';
import {GenericConstructor} from '../shared/generic-constructor';
import {METADATA_VALUE} from './metadata-value.resource-type';
import {MetadataField} from './metadata-field.model';

/**
 * Class the represents a metadata value
 */
@typedObject
export class MetadataValue extends ListableObject implements HALResource {
  static type = METADATA_VALUE;

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
   * The value of this metadata field
   */
  @autoserialize
  value: string;

  /**
   * The language of this metadata field
   */
  @autoserialize
  language: string;

  /**
   * The authority of this metadata field
   */
  @autoserialize
  authority: string;

  /**
   * The confidence of this metadata field
   */
  @autoserialize
  confidence: string;

  /**
   * The place of this metadata field
   */
  @autoserialize
  place: string;

  /**
   * The {@link HALLink}s for this MetadataValue
   */
  @deserialize
  _links: {
    self: HALLink,
    field: HALLink
  };

  /**
   * The MetadataField for this MetadataValue
   * Will be undefined unless the schema {@link HALLink} has been resolved.
   */
  @link(METADATA_FIELD)
  field?: Observable<RemoteData<MetadataField>>;

  /**
   * Method to print this metadata value as a string another attributes
   * @param separator The separator between value and language in the string
   */
  toString(): string {
    return `Value: ${this.value}`;
  }

  /**
   * Method that returns as which type of object this object should be rendered
   */
  getRenderTypes(): (string | GenericConstructor<ListableObject>)[] {
    return [this.constructor as GenericConstructor<ListableObject>];
  }
}
