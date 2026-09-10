import { fakeAsync } from '@angular/core/testing';
import {
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
} from '@angular/router';
import {
  EMPTY,
  Observable,
  of,
} from 'rxjs';

import { MENUS } from './app.menus';
import { Community } from './core/shared/community.model';
import { Item } from './core/shared/item.model';
import { MenuService } from './shared/menu/menu.service';
import { MENU_PROVIDER } from './shared/menu/menu.structure';
import { MenuID } from './shared/menu/menu-id.model';
import { MenuItemType } from './shared/menu/menu-item-type.model';
import {
  AbstractMenuProvider,
  PartialMenuSection,
} from './shared/menu/menu-provider.model';
import { MenuProviderService } from './shared/menu/menu-provider.service';
import { MenuRoute } from './shared/menu/menu-route.model';
import { ComColSearchMenuProvider } from './shared/menu/providers/comcol-search.menu';
import { createSuccessfulRemoteDataObject } from './shared/remote-data.utils';

/**
 * CLARIN/LINDAT: guards for the scoped-search menu entry (dtq-dev PR #1326, card FE-22).
 *
 * The provider itself is covered by comcol-search.menu.spec.ts, but nothing covered the two things
 * that make the feature correct in the app: that it is registered in app.menus.ts at all, and that
 * it is registered for Community/Collection pages *only*. The source commit asserted the latter
 * against the 7.x DSOEditMenuResolver ('should not return Community/Collection-specific entries' ->
 * `expect(menu.find(e => e.id === 'search-dso')).toBeFalsy()`); on v9 the resolver is gone and the
 * equivalent guard is this one.
 */
describe('MENUS - scoped-search entry (ComColSearchMenuProvider)', () => {

  /**
   * The resolved MENU_PROVIDER entry that app.menus.ts produced for ComColSearchMenuProvider.
   * buildMenuStructure() emits one such object per registered provider; its useFactory stamps the
   * menu id, the parent id and the active routes onto the provider instance.
   */
  function findRegistration(): any {
    return (MENUS as any[]).find((provider: any) =>
      provider !== null
      && typeof provider === 'object'
      && provider.provide === MENU_PROVIDER
      && Array.isArray(provider.deps)
      && provider.deps[0] === ComColSearchMenuProvider,
    );
  }

  /**
   * A ComColSearchMenuProvider configured exactly the way app.menus.ts configures it.
   */
  function configuredProvider(): AbstractMenuProvider {
    return findRegistration().useFactory(new ComColSearchMenuProvider());
  }

  describe('registration in app.menus.ts', () => {

    it('should register ComColSearchMenuProvider in the DSO edit menu', () => {
      const registration = findRegistration();

      expect(registration).toBeTruthy();
      expect(configuredProvider().menuID).toEqual(MenuID.DSO_EDIT);
    });

    it('should register it as a sub-provider so it renders inside the options dropdown', () => {
      expect(configuredProvider().parentID).toBeTruthy();
    });

    it('should activate it on community and collection pages but not on item pages', () => {
      const activePaths = configuredProvider().activePaths;

      expect(activePaths).toContain(MenuRoute.COMMUNITY_PAGE);
      expect(activePaths).toContain(MenuRoute.COLLECTION_PAGE);
      expect(activePaths).not.toContain(MenuRoute.ITEM_PAGE);
    });

  });

  describe('sections resolved for a route', () => {

    /**
     * A second provider, active on every route, whose only job is to prove that the resolution
     * pipeline actually ran. Without it the "no scoped-search section on an item page" expectation
     * would also hold if resolveRouteMenus silently produced nothing at all.
     */
    class AlwaysOnMenuProvider extends AbstractMenuProvider {
      menuID = MenuID.DSO_EDIT;
      menuProviderId = 'always-on';
      shouldPersistOnRouteChange = false;

      getSections(): Observable<PartialMenuSection[]> {
        return of([{
          id: 'always-on-marker',
          visible: true,
          model: {
            type: MenuItemType.TEXT,
            text: 'always-on-marker',
          },
        }] as PartialMenuSection[]);
      }
    }

    let menuService: any;
    let menuProviderService: MenuProviderService;

    const community = Object.assign(new Community(), { uuid: 'test-community-uuid' });
    const item = Object.assign(new Item(), { uuid: 'test-item-uuid' });

    beforeEach(() => {
      menuService = jasmine.createSpyObj('MenuService', {
        addSection: {},
        removeSection: {},
        getMenu: of({ id: MenuID.DSO_EDIT }),
        getNonPersistentMenuSections: of([]),
      });
      menuProviderService = new MenuProviderService(
        [configuredProvider(), new AlwaysOnMenuProvider()],
        menuService as MenuService,
        { events: EMPTY } as any,
      );
    });

    function resolve(menuRoute: MenuRoute, dso: Community | Item): void {
      const route = { data: { menuRoute, dso: createSuccessfulRemoteDataObject(dso) } };
      menuProviderService.resolveRouteMenus(
        route as unknown as ActivatedRouteSnapshot,
        { url: '/test-url' } as unknown as RouterStateSnapshot,
        false,
      ).subscribe();
    }

    function addedScopedSearchSections(): any[] {
      return menuService.addSection.calls.allArgs()
        .filter(([, section]: [MenuID, any]) => section?.model?.link === '/search');
    }

    it('should add the scoped-search section on a community page', fakeAsync(() => {
      resolve(MenuRoute.COMMUNITY_PAGE, community);

      const sections = addedScopedSearchSections();
      expect(sections.length).toBe(1);
      expect(sections[0][0]).toEqual(MenuID.DSO_EDIT);
      expect(sections[0][1].model.queryParams.scope).toEqual('test-community-uuid');
    }));

    it('should not add the scoped-search section on an item page', fakeAsync(() => {
      resolve(MenuRoute.ITEM_PAGE, item);

      // the pipeline ran - the always-on provider's section was added
      expect(menuService.addSection).toHaveBeenCalledWith(
        MenuID.DSO_EDIT,
        jasmine.objectContaining({ id: 'always-on-marker' }),
      );
      // ... but the scoped-search section was not
      expect(addedScopedSearchSections()).toEqual([]);
    }));

  });

});
