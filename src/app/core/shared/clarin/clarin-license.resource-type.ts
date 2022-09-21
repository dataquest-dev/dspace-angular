/**
 * The resource type for the Clarin License endpoint
 *
 * Needs to be in a separate file to prevent circular
 * dependencies in webpack.
 */
import {ResourceType} from '../resource-type';

export const CLARIN_LICENSE = new ResourceType('clarinlicense');

export const CLARIN_LICENSE_CONFIRMATION = ['Not required', 'Ask only once', 'Ask always', 'Allow anonymous'];
