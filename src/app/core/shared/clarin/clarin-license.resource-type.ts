/**
 * The resource type for the metadata value endpoint
 *
 * Needs to be in a separate file to prevent circular
 * dependencies in webpack.
 */
import {ResourceType} from '../resource-type';

export const CLARIN_LICENSE = new ResourceType('clarinlicense');
