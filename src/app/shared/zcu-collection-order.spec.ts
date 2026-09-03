import { Collection } from '../core/shared/collection.model';
import {
  reorderZcuPublicationCollections,
  ZCU_SECOND_COLLECTION_NAME,
  ZCU_THIRD_COLLECTION_NAME,
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
  it('uses the exact diacritic pinned names', () => {
    expect(ZCU_SECOND_COLLECTION_NAME).toBe('Kapitoly v knihách');
    expect(ZCU_THIRD_COLLECTION_NAME).toBe('Články');
  });

  it('pins "Články" to the 3rd position, directly after "Kapitoly v knihách"', () => {
    const input = [
      fakeCollection('Knihy'),
      fakeCollection(ZCU_SECOND_COLLECTION_NAME),
      fakeCollection('Zprávy'),
      fakeCollection(ZCU_THIRD_COLLECTION_NAME),
    ];

    const result = reorderZcuPublicationCollections(input);

    expect(result[2].name).toBe(ZCU_THIRD_COLLECTION_NAME);
    expect(names(result).indexOf(ZCU_THIRD_COLLECTION_NAME))
      .toBe(names(result).indexOf(ZCU_SECOND_COLLECTION_NAME) + 1);
    expect(names(result)).toEqual(['Knihy', ZCU_SECOND_COLLECTION_NAME, ZCU_THIRD_COLLECTION_NAME, 'Zprávy']);
  });

  it('leaves the list unchanged when a pinned collection is missing', () => {
    expect(names(reorderZcuPublicationCollections([
      fakeCollection('Knihy'), fakeCollection(ZCU_THIRD_COLLECTION_NAME),
    ]))).toEqual(['Knihy', ZCU_THIRD_COLLECTION_NAME]);

    expect(names(reorderZcuPublicationCollections([
      fakeCollection('Knihy'), fakeCollection(ZCU_SECOND_COLLECTION_NAME),
    ]))).toEqual(['Knihy', ZCU_SECOND_COLLECTION_NAME]);
  });

  it('leaves the list unchanged when there are no other collections', () => {
    expect(names(reorderZcuPublicationCollections([
      fakeCollection(ZCU_SECOND_COLLECTION_NAME), fakeCollection(ZCU_THIRD_COLLECTION_NAME),
    ]))).toEqual([ZCU_SECOND_COLLECTION_NAME, ZCU_THIRD_COLLECTION_NAME]);
  });

  it('handles empty and single-element input without error', () => {
    expect(reorderZcuPublicationCollections([])).toEqual([]);
    expect(names(reorderZcuPublicationCollections([fakeCollection('Knihy')]))).toEqual(['Knihy']);
  });
});
