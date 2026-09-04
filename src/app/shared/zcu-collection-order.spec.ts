import { Collection } from '../core/shared/collection.model';
import {
  reorderZcuPublicationCollections,
  ZCU_ARTICLES_COLLECTION_PREFIX,
  ZCU_BOOKPARTS_COLLECTION_PREFIX,
} from './zcu-collection-order';

function fakeCollection(name: string): Collection {
  return { get name(): string { return name; } } as Collection;
}

function names(collections: Collection[]): string[] {
  return collections.map((collection: Collection) => collection.name);
}

describe('reorderZcuPublicationCollections', () => {
  it('uses the Czech title prefixes', () => {
    expect(ZCU_BOOKPARTS_COLLECTION_PREFIX).toBe('Kapitoly v knihách');
    expect(ZCU_ARTICLES_COLLECTION_PREFIX).toBe('Články');
  });

  it('moves articles directly after book parts when book parts is 2nd (-> articles 3rd)', () => {
    const input = [
      fakeCollection('Habilitace'),
      fakeCollection('Kapitoly v knihách'),
      fakeCollection('Sborníky'),
      fakeCollection('Články'),
    ];

    expect(names(reorderZcuPublicationCollections(input)))
      .toEqual(['Habilitace', 'Kapitoly v knihách', 'Články', 'Sborníky']);
  });

  it('moves articles to 2nd when book parts is 1st', () => {
    const input = [
      fakeCollection('Kapitoly v knihách'),
      fakeCollection('Sborníky'),
      fakeCollection('Zprávy'),
      fakeCollection('Články'),
    ];

    expect(names(reorderZcuPublicationCollections(input)))
      .toEqual(['Kapitoly v knihách', 'Články', 'Sborníky', 'Zprávy']);
  });

  it('matches the bilingual, department-suffixed names used in production', () => {
    const input = [
      fakeCollection('Disertační práce'),
      fakeCollection('Kapitoly v knihách / Bookparts (KAE)'),
      fakeCollection('Konferenční příspěvky'),
      fakeCollection('Monografie a kolektivní monografie'),
      fakeCollection('Zprávy'),
      fakeCollection('Články / Articles (KAE)'),
    ];

    expect(names(reorderZcuPublicationCollections(input))).toEqual([
      'Disertační práce',
      'Kapitoly v knihách / Bookparts (KAE)',
      'Články / Articles (KAE)',
      'Konferenční příspěvky',
      'Monografie a kolektivní monografie',
      'Zprávy',
    ]);
  });

  it('matches mixed variants (plain articles, bilingual book parts)', () => {
    const input = [
      fakeCollection('Kapitoly v knihách / Bookparts'),
      fakeCollection('Sborníky'),
      fakeCollection('Články'),
    ];

    expect(names(reorderZcuPublicationCollections(input)))
      .toEqual(['Kapitoly v knihách / Bookparts', 'Články', 'Sborníky']);
  });

  it('never moves book parts out of its natural position', () => {
    const input = [
      fakeCollection('Abstrakty'),
      fakeCollection('Habilitace'),
      fakeCollection('Kapitoly v knihách'),
      fakeCollection('Články'),
    ];

    expect(names(reorderZcuPublicationCollections(input)))
      .toEqual(['Abstrakty', 'Habilitace', 'Kapitoly v knihách', 'Články']);
  });

  it('leaves the list unchanged when articles is already directly after book parts', () => {
    const input = [
      fakeCollection('Habilitace'),
      fakeCollection('Kapitoly v knihách'),
      fakeCollection('Články'),
      fakeCollection('Sborníky'),
    ];

    expect(reorderZcuPublicationCollections(input)).toBe(input);
  });

  it('leaves the list unchanged when an anchor collection is missing', () => {
    expect(names(reorderZcuPublicationCollections([
      fakeCollection('Knihy'), fakeCollection('Články'),
    ]))).toEqual(['Knihy', 'Články']);

    expect(names(reorderZcuPublicationCollections([
      fakeCollection('Knihy'), fakeCollection('Kapitoly v knihách'),
    ]))).toEqual(['Knihy', 'Kapitoly v knihách']);
  });

  it('handles empty and single-element input without error', () => {
    expect(reorderZcuPublicationCollections([])).toEqual([]);
    expect(names(reorderZcuPublicationCollections([fakeCollection('Knihy')]))).toEqual(['Knihy']);
  });
});
