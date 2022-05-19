import {typedObject} from '../cache/builders/build-decorators';
import {inheritSerialization} from 'cerialize';
import {DSpaceObject} from './dspace-object.model';
import {METADATA_VALUE_SUGGESTION} from './metadata-value-suggestion.resource-type';

/**
 * Model class for the Metadata value suggestion object
 */
@typedObject
@inheritSerialization(DSpaceObject)
export class MetadataValueSuggestion extends DSpaceObject {

  static type = METADATA_VALUE_SUGGESTION;

}
