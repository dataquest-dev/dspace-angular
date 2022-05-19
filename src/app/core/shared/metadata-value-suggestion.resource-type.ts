import {ResourceType} from './resource-type';

/**
 * The resource type for Metadata value suggestion
 *
 * Needs to be in a separate file to prevent circular
 * dependencies in webpack.
 */
export const METADATA_VALUE_SUGGESTION = new ResourceType('metadataValueSuggestion');
