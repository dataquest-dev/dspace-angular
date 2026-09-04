import { Collection } from '../core/shared/collection.model';

/**
 * Title prefix of the "book parts" collection that anchors the ordering.
 * Departments name it "Kapitoly v knihách", "Kapitoly v knihách / Bookparts" or
 * "Kapitoly v knihách / Bookparts (KAE)", so we match on the common Czech prefix.
 */
export const ZCU_BOOKPARTS_COLLECTION_PREFIX = 'Kapitoly v knihách';

/**
 * Title prefix of the "articles" collection pinned directly after book parts.
 * Departments name it "Články", "Články / Articles" or "Články / Articles (KAE)".
 */
export const ZCU_ARTICLES_COLLECTION_PREFIX = 'Články';

function nameStartsWith(collection: Collection, prefix: string): boolean {
  const name = collection?.name;
  return typeof name === 'string' && name.trim().toLocaleLowerCase().startsWith(prefix.toLocaleLowerCase());
}

/**
 * Reorders a list of collections so that the articles collection is shown immediately after
 * the book parts collection, while every other collection — book parts included — keeps its
 * original position. Both are matched by title prefix, so the bilingual and department-suffixed
 * variants ("Články / Articles (KAE)", ...) are handled regardless of the UI language.
 */
export function reorderZcuPublicationCollections(collections: Collection[]): Collection[] {
  if (!Array.isArray(collections) || collections.length < 2) {
    return collections;
  }

  const bookPartsIndex = collections.findIndex((collection: Collection) => nameStartsWith(collection, ZCU_BOOKPARTS_COLLECTION_PREFIX));
  const articlesIndex = collections.findIndex((collection: Collection) => nameStartsWith(collection, ZCU_ARTICLES_COLLECTION_PREFIX));

  if (bookPartsIndex === -1 || articlesIndex === -1) {
    return collections;
  }
  if (articlesIndex === bookPartsIndex + 1) {
    return collections;
  }

  const articles = collections[articlesIndex];
  const withoutArticles = collections.filter((_: Collection, index: number) => index !== articlesIndex);
  const insertAt = withoutArticles.findIndex((collection: Collection) => nameStartsWith(collection, ZCU_BOOKPARTS_COLLECTION_PREFIX)) + 1;

  return [...withoutArticles.slice(0, insertAt), articles, ...withoutArticles.slice(insertAt)];
}
