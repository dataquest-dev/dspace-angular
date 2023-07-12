import { autoserialize, deserialize } from 'cerialize';
import { ListableObject } from '../../shared/object-collection/shared/listable-object.model';
import {    typedObject } from '../cache/builders/build-decorators';
import { GenericConstructor } from '../shared/generic-constructor';
import { HALLink } from '../shared/hal-link.model';
import { HALResource } from '../shared/hal-resource.model';
import { ResourceType } from '../shared/resource-type';
import { excludeFromEquals } from '../utilities/equals.decorators';
import { METADATA_BITSTREAM } from './metadata-bitstream.resource-type';

/**
 * Class the represents a metadata field
 */
@typedObject
export class MetadataBitstream extends ListableObject implements HALResource {
  static type = METADATA_BITSTREAM;

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
   * The element of this metadata field
   */
  @autoserialize
  bitstreamRest: any;

  /**
   * The qualifier of this metadata field
   */
  @autoserialize
  fileInfo: any;

  /**
   * The scope note of this metadata field
   */
  @autoserialize
  href: any;

  /**
   * The {@link HALLink}s for this MetadataField
   */
  @deserialize
  _links: {
    self: HALLink,
    schema: HALLink
  };

  getRenderTypes(): (string | GenericConstructor<ListableObject>)[] {
    return [this.constructor as GenericConstructor<ListableObject>];
  }
}