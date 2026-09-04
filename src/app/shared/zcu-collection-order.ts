import { Collection } from '../core/shared/collection.model';

/**
 * Name of the "book parts" collection that anchors the ordering for the ZCU publications
 * community (issue #953). "Články" is always shown directly after this collection.
 */
export const ZCU_BOOKPARTS_COLLECTION_NAME = 'Kapitoly v knihách';

/**
 * Name of the "articles" collection that is pinned directly after "Kapitoly v knihách"
 * for the ZCU publications community (issue #953).
 */
export const ZCU_ARTICLES_COLLECTION_NAME = 'Články';

/**
 * Reorders a list of collections so that "Články" (articles) is shown immediately after
 * "Kapitoly v knihách" (book parts), while every other collection — including "Kapitoly v
 * knihách" itself — keeps its original (alphabetical) position. This is the ZCU-specific
 * hardcode for issue #953, shared by every place that lists a community's collections (the
 * community page and the community browse tree).
 *
 * The articles collection tracks the book-parts collection wherever it naturally sits:
 * - book parts 1st  -> articles 2nd
 * - book parts 2nd  -> articles 3rd
 * and so on. The rule only applies when BOTH collections are present in the given list;
 * otherwise (or if they are already adjacent in the right order) the list is returned
 * unchanged. Nothing but the position of "Články" is ever moved.
 *
 * Note: ordering is applied per fetched page. In the ZCU publications community a department
 * has only a handful of collections, so both always land on the same page.
 *
 * @param collections the collections to reorder (as fetched, alphabetical by dc.title)
 * @returns a new, reordered array, or the original array when the rule does not apply
 */
export function reorderZcuPublicationCollections(collections: Collection[]): Collection[] {
  if (!Array.isArray(collections) || collections.length < 2) {
    return collections;
  }

  const bookPartsIndex = collections.findIndex((collection: Collection) => collection.name === ZCU_BOOKPARTS_COLLECTION_NAME);
  const articlesIndex = collections.findIndex((collection: Collection) => collection.name === ZCU_ARTICLES_COLLECTION_NAME);

  // Both anchor collections must be present for the rule to apply.
  if (bookPartsIndex === -1 || articlesIndex === -1) {
    return collections;
  }

  // Already directly after book parts -> nothing to do.
  if (articlesIndex === bookPartsIndex + 1) {
    return collections;
  }

  const articles = collections[articlesIndex];
  // Remove "Články" while preserving every other collection's relative order (incl. book parts).
  const withoutArticles = collections.filter((_: Collection, index: number) => index !== articlesIndex);
  // Re-locate book parts in the reduced list and insert "Články" right after it.
  const insertAt = withoutArticles.findIndex((collection: Collection) => collection.name === ZCU_BOOKPARTS_COLLECTION_NAME) + 1;

  return [...withoutArticles.slice(0, insertAt), articles, ...withoutArticles.slice(insertAt)];
}
