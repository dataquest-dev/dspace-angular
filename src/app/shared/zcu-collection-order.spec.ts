import { Collection } from '../core/shared/collection.model';
import {
  reorderZcuPublicationCollections,
  ZCU_ARTICLES_COLLECTION_NAME,
  ZCU_BOOKPARTS_COLLECTION_NAME,
} from './zcu-collection-order';

/**
 * Builds a minimal Collection-like stub that only exposes the `name` getter used by the ordering.
 *
 * @param name the collection name (dc.title) to expose
 * @returns an object typed as Collection for the purposes of these tests
 */
function fakeCollection(name: string): Collection {
  return { get name(): string { return name; } } as Collection;
}

/**
 * Maps a list of collections to their names for concise assertions.
 *
 * @param collections the collections to map
 * @returns the ordered list of collection names
 */
function names(collections: Collection[]): string[] {
  return collections.map((collection: Collection) => collection.name);
}

describe('reorderZcuPublicationCollections', () => {
  it('uses the exact diacritic anchor names', () => {
    expect(ZCU_BOOKPARTS_COLLECTION_NAME).toBe('Kapitoly v knihách');
    expect(ZCU_ARTICLES_COLLECTION_NAME).toBe('Články');
  });

  it('moves "Články" directly after "Kapitoly v knihách" when book parts is 2nd (-> articles 3rd)', () => {
    const input = [
      fakeCollection('Habilitace'),
      fakeCollection(ZCU_BOOKPARTS_COLLECTION_NAME),
      fakeCollection('Sborníky'),
      fakeCollection(ZCU_ARTICLES_COLLECTION_NAME),
    ];

    const result = reorderZcuPublicationCollections(input);

    expect(names(result)).toEqual(['Habilitace', ZCU_BOOKPARTS_COLLECTION_NAME, ZCU_ARTICLES_COLLECTION_NAME, 'Sborníky']);
    // articles is exactly one slot after book parts
    expect(names(result).indexOf(ZCU_ARTICLES_COLLECTION_NAME))
      .toBe(names(result).indexOf(ZCU_BOOKPARTS_COLLECTION_NAME) + 1);
  });

  it('moves "Články" to 2nd when "Kapitoly v knihách" is 1st (book parts stays 1st)', () => {
    const input = [
      fakeCollection(ZCU_BOOKPARTS_COLLECTION_NAME),
      fakeCollection('Sborníky'),
      fakeCollection('Zprávy'),
      fakeCollection(ZCU_ARTICLES_COLLECTION_NAME),
    ];

    const result = reorderZcuPublicationCollections(input);

    expect(names(result)).toEqual([ZCU_BOOKPARTS_COLLECTION_NAME, ZCU_ARTICLES_COLLECTION_NAME, 'Sborníky', 'Zprávy']);
  });

  it('never moves "Kapitoly v knihách" itself out of its natural position', () => {
    const input = [
      fakeCollection('Abstrakty'),
      fakeCollection('Habilitace'),
      fakeCollection(ZCU_BOOKPARTS_COLLECTION_NAME),
      fakeCollection(ZCU_ARTICLES_COLLECTION_NAME),
    ];

    const result = reorderZcuPublicationCollections(input);

    // book parts stays 3rd; articles follows it as 4th; unchanged here since already adjacent
    expect(names(result)).toEqual(['Abstrakty', 'Habilitace', ZCU_BOOKPARTS_COLLECTION_NAME, ZCU_ARTICLES_COLLECTION_NAME]);
  });

  it('leaves the list unchanged when "Články" is already directly after book parts', () => {
    const input = [
      fakeCollection('Habilitace'),
      fakeCollection(ZCU_BOOKPARTS_COLLECTION_NAME),
      fakeCollection(ZCU_ARTICLES_COLLECTION_NAME),
      fakeCollection('Sborníky'),
    ];

    expect(reorderZcuPublicationCollections(input)).toBe(input);
  });

  it('leaves the list unchanged when an anchor collection is missing', () => {
    expect(names(reorderZcuPublicationCollections([
      fakeCollection('Knihy'), fakeCollection(ZCU_ARTICLES_COLLECTION_NAME),
    ]))).toEqual(['Knihy', ZCU_ARTICLES_COLLECTION_NAME]);

    expect(names(reorderZcuPublicationCollections([
      fakeCollection('Knihy'), fakeCollection(ZCU_BOOKPARTS_COLLECTION_NAME),
    ]))).toEqual(['Knihy', ZCU_BOOKPARTS_COLLECTION_NAME]);
  });

  it('handles empty and single-element input without error', () => {
    expect(reorderZcuPublicationCollections([])).toEqual([]);
    expect(names(reorderZcuPublicationCollections([fakeCollection('Knihy')]))).toEqual(['Knihy']);
  });
});
