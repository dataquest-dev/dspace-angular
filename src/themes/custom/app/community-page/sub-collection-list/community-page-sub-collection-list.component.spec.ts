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

const BOOKPARTS_COLLECTION_NAME = 'Kapitoly v knihách';
const ARTICLES_COLLECTION_NAME = 'Články';

describe('CommunityPageSubCollectionListComponent (custom theme) reorderCollections', () => {
  let component: CommunityPageSubCollectionListComponent;

  const reorder = (collections: Collection[]): Collection[] =>
    (component as any).reorderCollections(collections);

  beforeEach(() => {
    component = new CommunityPageSubCollectionListComponent(null, null, null);
  });

  it('shows "Články" directly after "Kapitoly v knihách" (book parts 2nd -> articles 3rd)', () => {
    const input = [
      fakeCollection('Alfa'),
      fakeCollection(BOOKPARTS_COLLECTION_NAME),
      fakeCollection('Sborníky'),
      fakeCollection(ARTICLES_COLLECTION_NAME),
    ];

    const result = reorder(input);

    expect(names(result)).toEqual(['Alfa', BOOKPARTS_COLLECTION_NAME, ARTICLES_COLLECTION_NAME, 'Sborníky']);
    expect(names(result).indexOf(ARTICLES_COLLECTION_NAME))
      .toBe(names(result).indexOf(BOOKPARTS_COLLECTION_NAME) + 1);
  });

  it('shows "Články" 2nd when "Kapitoly v knihách" is 1st', () => {
    const input = [
      fakeCollection(BOOKPARTS_COLLECTION_NAME),
      fakeCollection('Sborníky'),
      fakeCollection(ARTICLES_COLLECTION_NAME),
    ];

    expect(names(reorder(input))).toEqual([BOOKPARTS_COLLECTION_NAME, ARTICLES_COLLECTION_NAME, 'Sborníky']);
  });

  it('leaves the list unchanged when "Kapitoly v knihách" is missing', () => {
    const input = [
      fakeCollection('Alfa'),
      fakeCollection(ARTICLES_COLLECTION_NAME),
      fakeCollection('Zeta'),
    ];

    expect(names(reorder(input))).toEqual(['Alfa', ARTICLES_COLLECTION_NAME, 'Zeta']);
  });

  it('leaves the list unchanged when "Články" is missing', () => {
    const input = [
      fakeCollection('Alfa'),
      fakeCollection(BOOKPARTS_COLLECTION_NAME),
      fakeCollection('Zeta'),
    ];

    expect(names(reorder(input))).toEqual(['Alfa', BOOKPARTS_COLLECTION_NAME, 'Zeta']);
  });

  it('uses the exact diacritic collection names', () => {
    expect(BOOKPARTS_COLLECTION_NAME).toBe('Kapitoly v knihách');
    expect(ARTICLES_COLLECTION_NAME).toBe('Články');

    const input = [
      fakeCollection('Alfa'),
      fakeCollection('Kapitoly v knihach'),
      fakeCollection('Clanky'),
      fakeCollection('Zeta'),
    ];

    expect(names(reorder(input))).toEqual(['Alfa', 'Kapitoly v knihach', 'Clanky', 'Zeta']);
  });
});
