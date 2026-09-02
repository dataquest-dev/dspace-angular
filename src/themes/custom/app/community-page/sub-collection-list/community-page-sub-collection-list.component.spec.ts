import { Collection } from '../../../../../app/core/shared/collection.model';
import { CommunityPageSubCollectionListComponent } from './community-page-sub-collection-list.component';

/**
 * Builds a minimal Collection-like stub that only exposes the `name` getter used by the
 * reordering logic under test.
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

const SECOND_COLLECTION_NAME = 'Kapitoly v knihách';
const THIRD_COLLECTION_NAME = 'Články';

describe('CommunityPageSubCollectionListComponent (custom theme) reorderCollections', () => {
  let component: CommunityPageSubCollectionListComponent;

  const reorder = (collections: Collection[]): Collection[] =>
    (component as any).reorderCollections(collections);

  beforeEach(() => {
    component = new CommunityPageSubCollectionListComponent(null, null, null);
  });

  it('pins "Články" to the 3rd position, directly after "Kapitoly v knihách"', () => {
    const input = [
      fakeCollection('Alfa'),
      fakeCollection(SECOND_COLLECTION_NAME),
      fakeCollection(THIRD_COLLECTION_NAME),
      fakeCollection('Zeta'),
    ];

    const result = reorder(input);

    expect(names(result)).toEqual(['Alfa', SECOND_COLLECTION_NAME, THIRD_COLLECTION_NAME, 'Zeta']);
    expect(result[2].name).toBe(THIRD_COLLECTION_NAME);
    expect(result[1].name).toBe(SECOND_COLLECTION_NAME);
    expect(names(result).indexOf(THIRD_COLLECTION_NAME))
      .toBe(names(result).indexOf(SECOND_COLLECTION_NAME) + 1);
  });

  it('leaves the list unchanged when "Kapitoly v knihách" is missing', () => {
    const input = [
      fakeCollection('Alfa'),
      fakeCollection(THIRD_COLLECTION_NAME),
      fakeCollection('Zeta'),
    ];

    expect(names(reorder(input))).toEqual(['Alfa', THIRD_COLLECTION_NAME, 'Zeta']);
  });

  it('leaves the list unchanged when "Články" is missing', () => {
    const input = [
      fakeCollection('Alfa'),
      fakeCollection(SECOND_COLLECTION_NAME),
      fakeCollection('Zeta'),
    ];

    expect(names(reorder(input))).toEqual(['Alfa', SECOND_COLLECTION_NAME, 'Zeta']);
  });

  it('leaves the list unchanged when there are no other collections', () => {
    const input = [
      fakeCollection(SECOND_COLLECTION_NAME),
      fakeCollection(THIRD_COLLECTION_NAME),
    ];

    expect(names(reorder(input))).toEqual([SECOND_COLLECTION_NAME, THIRD_COLLECTION_NAME]);
  });

  it('uses the exact diacritic collection names', () => {
    expect(SECOND_COLLECTION_NAME).toBe('Kapitoly v knihách');
    expect(THIRD_COLLECTION_NAME).toBe('Články');

    const input = [
      fakeCollection('Alfa'),
      fakeCollection('Kapitoly v knihach'),
      fakeCollection('Clanky'),
      fakeCollection('Zeta'),
    ];

    expect(names(reorder(input))).toEqual(['Alfa', 'Kapitoly v knihach', 'Clanky', 'Zeta']);
  });
});
