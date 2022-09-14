import {link, typedObject} from '../../cache/builders/build-decorators';
import {ListableObject} from '../../../shared/object-collection/shared/listable-object.model';
import {HALResource} from '../hal-resource.model';
import {METADATA_VALUE} from '../../metadata/metadata-value.resource-type';
import {excludeFromEquals} from '../../utilities/equals.decorators';
import {autoserialize, deserialize} from 'cerialize';
import {ResourceType} from '../resource-type';
import {HALLink} from '../hal-link.model';
import {METADATA_FIELD} from '../../metadata/metadata-field.resource-type';
import {Observable} from 'rxjs';
import {RemoteData} from '../../data/remote-data';
import {MetadataField} from '../../metadata/metadata-field.model';
import {GenericConstructor} from '../generic-constructor';
import {CLARIN_LICENSE} from './clarin-license.resource-type';
import {CLARIN_LICENSE_LABEL} from './clarin-license-label.resource-type';
import {MetadataMapInterface, MetadataValueInterface} from '../metadata.models';

/**
 * Class that represents a metadata value
 */
@typedObject
export class ClarinLicenseLabel extends ListableObject implements HALResource {
  static type = CLARIN_LICENSE_LABEL;

  /**
   * The object type
   */
  @excludeFromEquals
  @autoserialize
  type: ResourceType;

  /**
   * The identifier of this metadata value
   */
  @autoserialize
  id: number;

  /**
   * The value of this metadata value object
   */
  @autoserialize
  label: string;

  /**
   * The language of this metadata value
   */
  @autoserialize
  title: string;

  /**
   * The authority of this metadata value
   */
  @autoserialize
  extended: boolean;

  /**
   * The {@link HALLink}s for this MetadataValue
   */
  @deserialize
  _links: {
    self: HALLink
  };

  /**
   * Method that returns as which type of object this object should be rendered
   */
  getRenderTypes(): (string | GenericConstructor<ListableObject>)[] {
    return [this.constructor as GenericConstructor<ListableObject>];
  }
}

/** A map of metadata keys to an ordered list of MetadataValue objects. */

