import { Collection } from '../core/shared/collection.model';

/**
 * Name of the collection pinned to the 2nd position for the ZCU publications community (issue #953).
 */
export const ZCU_SECOND_COLLECTION_NAME = 'Kapitoly v knihách';

/**
 * Name of the collection pinned to the 3rd position for the ZCU publications community (issue #953).
 */
export const ZCU_THIRD_COLLECTION_NAME = 'Články';

/**
 * Reorders a list of collections so that "Kapitoly v knihách" is shown 2nd and "Články" 3rd, while
 * every other collection keeps its original (alphabetical) order. This is the ZCU-specific hardcode
 * for issue #953, shared by every place that lists a community's collections (the community page and
 * the community browse tree).
 *
 * The rule only applies when both pinned collections are present and there is at least one other
 * collection; otherwise the list is returned unchanged. The result is
 * `[others[0], second, third, ...others.slice(1)]`.
 *
 * @param collections the collections to reorder (as fetched, alphabetical by dc.title)
 * @returns a new, reordered array, or the original array when the rule does not apply
 */
export function reorderZcuPublicationCollections(collections: Collection[]): Collection[] {
  if (!Array.isArray(collections) || collections.length === 0) {
    return collections;
  }
  const second = collections.find((collection: Collection) => collection.name === ZCU_SECOND_COLLECTION_NAME);
  const third = collections.find((collection: Collection) => collection.name === ZCU_THIRD_COLLECTION_NAME);
  const others = collections.filter((collection: Collection) => collection !== second && collection !== third);

  if (second && third && others.length >= 1) {
    return [others[0], second, third, ...others.slice(1)];
  }
  return collections;
}
