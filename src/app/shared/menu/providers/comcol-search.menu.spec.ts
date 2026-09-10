import { TestBed } from '@angular/core/testing';

import { Collection } from '../../../core/shared/collection.model';
import { Community } from '../../../core/shared/community.model';
import { LinkMenuItemModel } from '../menu-item/models/link.model';
import { MenuItemType } from '../menu-item-type.model';
import { ComColSearchMenuProvider } from './comcol-search.menu';

describe('ComColSearchMenuProvider', () => {

  let provider: ComColSearchMenuProvider;

  const community: Community = Object.assign(new Community(), { uuid: 'test-community-uuid' });
  const collection: Collection = Object.assign(new Collection(), { uuid: 'test-collection-uuid' });

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        ComColSearchMenuProvider,
      ],
    });
    provider = TestBed.inject(ComColSearchMenuProvider);
  });

  describe('getSectionsForContext', () => {
    it('should return a single visible scoped-search link section for a community', (done) => {
      provider.getSectionsForContext(community).subscribe((sections) => {
        expect(sections.length).toEqual(1);
        expect(sections[0].visible).toBeTrue();
        expect(sections[0].icon).toEqual('search');
        expect(sections[0].model.type).toEqual(MenuItemType.LINK);
        expect((sections[0].model as LinkMenuItemModel).text).toEqual('search.title');
        expect((sections[0].model as LinkMenuItemModel).link).toEqual('/search');
        expect((sections[0].model as LinkMenuItemModel).queryParams['spc.page']).toEqual('1');
        expect((sections[0].model as LinkMenuItemModel).queryParams.scope).toEqual('test-community-uuid');
        done();
      });
    });

    it('should scope the search to the collection uuid when the context is a collection', (done) => {
      provider.getSectionsForContext(collection).subscribe((sections) => {
        expect(sections.length).toEqual(1);
        expect(sections[0].visible).toBeTrue();
        expect((sections[0].model as LinkMenuItemModel).queryParams.scope).toEqual('test-collection-uuid');
        done();
      });
    });
  });

});
