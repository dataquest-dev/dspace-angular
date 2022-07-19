import { ResourceType } from '../shared/resource-type';

/**
 * The resource type for Handle
 *
 * Needs to be in a separate file to prevent circular
 * dependencies in webpack.
 */

export const HANDLE = new ResourceType('handle');
