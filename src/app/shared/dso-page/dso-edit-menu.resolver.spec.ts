import { TestBed, waitForAsync } from '@angular/core/testing';
import { MenuServiceStub } from '../testing/menu-service.stub';
<<<<<<< HEAD
import { of as observableOf } from 'rxjs';
=======
import { combineLatest, map, of as observableOf } from 'rxjs';
>>>>>>> dspace-7.6.1
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { RouterTestingModule } from '@angular/router/testing';
import { AdminSidebarComponent } from '../../admin/admin-sidebar/admin-sidebar.component';
import { MenuService } from '../menu/menu.service';
import { AuthorizationDataService } from '../../core/data/feature-authorization/authorization-data.service';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { DSOEditMenuResolver } from './dso-edit-menu.resolver';
import { DsoVersioningModalService } from './dso-versioning-modal-service/dso-versioning-modal.service';
import { DSpaceObjectDataService } from '../../core/data/dspace-object-data.service';
import { Item } from '../../core/shared/item.model';
import { createFailedRemoteDataObject$, createSuccessfulRemoteDataObject$ } from '../remote-data.utils';
import { MenuID } from '../menu/menu-id.model';
import { MenuItemType } from '../menu/menu-item-type.model';
<<<<<<< HEAD
import { TextMenuItemModel } from '../menu/menu-item/models/text.model';
import { LinkMenuItemModel } from '../menu/menu-item/models/link.model';
import { ResearcherProfileDataService } from '../../core/profile/researcher-profile-data.service';
import { NotificationsService } from '../notifications/notifications.service';
=======
import { LinkMenuItemModel } from '../menu/menu-item/models/link.model';
import { ResearcherProfileDataService } from '../../core/profile/researcher-profile-data.service';
import { NotificationsService } from '../notifications/notifications.service';
import { DSpaceObject } from '../../core/shared/dspace-object.model';
import { Community } from '../../core/shared/community.model';
import { Collection } from '../../core/shared/collection.model';
import flatten from 'lodash/flatten';
>>>>>>> dspace-7.6.1

describe('DSOEditMenuResolver', () => {

  const MENU_STATE = {
    id: 'some menu'
  };

  let resolver: DSOEditMenuResolver;

  let dSpaceObjectDataService;
  let menuService;
  let authorizationService;
  let dsoVersioningModalService;
  let researcherProfileService;
  let notificationsService;
  let translate;

<<<<<<< HEAD
  const route = {
    data: {
      menu: {
        'statistics': [{
          id: 'statistics-dummy-1',
          active: false,
          visible: true,
          model: null
        }]
      }
    },
    params: {id: 'test-uuid'},
=======
  const dsoRoute = (dso: DSpaceObject) => {
    return {
      data: {
        menu: {
          'statistics': [{
            id: 'statistics-dummy-1',
            active: false,
            visible: true,
            model: null
          }]
        }
      },
      params: {id: dso.uuid},
    };
>>>>>>> dspace-7.6.1
  };

  const state = {
    url: 'test-url'
  };

<<<<<<< HEAD
  const testObject = Object.assign(new Item(), {uuid: 'test-uuid', type: 'item', _links: {self: {href: 'self-link'}}});
=======
  const testCommunity: Community = Object.assign(new Community(), {
    uuid: 'test-community-uuid',
    type: 'community',
    _links: {self: {href: 'self-link'}},
  });
  const testCollection: Collection = Object.assign(new Collection(), {
    uuid: 'test-collection-uuid',
    type: 'collection',
    _links: {self: {href: 'self-link'}},
  });
  const testItem: Item = Object.assign(new Item(), {
    uuid: 'test-item-uuid',
    type: 'item',
    _links: {self: {href: 'self-link'}},
  });

  let testObject: DSpaceObject;
  let route;
>>>>>>> dspace-7.6.1

  const dummySections1 = [{
    id: 'dummy-1',
    active: false,
    visible: true,
    model: null
  },
    {
      id: 'dummy-2',
      active: false,
      visible: true,
      model: null
    }];

  const dummySections2 = [{
    id: 'dummy-3',
    active: false,
    visible: true,
    model: null
  },
    {
      id: 'dummy-4',
      active: false,
      visible: true,
      model: null
    },
    {
      id: 'dummy-5',
      active: false,
      visible: true,
      model: null
    }];

  beforeEach(waitForAsync(() => {
<<<<<<< HEAD
=======
    // test with Items unless specified otherwise
    testObject = testItem;
    route = dsoRoute(testItem);

>>>>>>> dspace-7.6.1
    menuService = new MenuServiceStub();
    spyOn(menuService, 'getMenu').and.returnValue(observableOf(MENU_STATE));

    dSpaceObjectDataService = jasmine.createSpyObj('dSpaceObjectDataService', {
      findById: createSuccessfulRemoteDataObject$(testObject)
    });
    authorizationService = jasmine.createSpyObj('authorizationService', {
      isAuthorized: observableOf(true)
    });
    dsoVersioningModalService = jasmine.createSpyObj('dsoVersioningModalService', {
      isNewVersionButtonDisabled: observableOf(false),
      getVersioningTooltipMessage: observableOf('message'),
      openCreateVersionModal: {}
    });
    researcherProfileService = jasmine.createSpyObj('researcherProfileService', {
      createFromExternalSourceAndReturnRelatedItemId: observableOf('mock-id'),
    });
    translate = jasmine.createSpyObj('translate', {
      get: observableOf('translated-message'),
    });
    notificationsService = jasmine.createSpyObj('notificationsService', {
      success: {},
      error: {},
    });

    TestBed.configureTestingModule({
      imports: [TranslateModule.forRoot(), NoopAnimationsModule, RouterTestingModule],
      declarations: [AdminSidebarComponent],
      providers: [
        {provide: DSpaceObjectDataService, useValue: dSpaceObjectDataService},
        {provide: MenuService, useValue: menuService},
        {provide: AuthorizationDataService, useValue: authorizationService},
        {provide: DsoVersioningModalService, useValue: dsoVersioningModalService},
        {provide: ResearcherProfileDataService, useValue: researcherProfileService},
        {provide: TranslateService, useValue: translate},
        {provide: NotificationsService, useValue: notificationsService},
        {
          provide: NgbModal, useValue: {
            open: () => {/*comment*/
            }
          }
        }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    });
    resolver = TestBed.inject(DSOEditMenuResolver);

    spyOn(menuService, 'addSection');
  }));

  it('should be created', () => {
    expect(resolver).toBeTruthy();
  });

  describe('resolve', () => {
    it('should create all menus when a dso is found based on the route id param', (done) => {
      spyOn(resolver, 'getDsoMenus').and.returnValue(
        [observableOf(dummySections1), observableOf(dummySections2)]
      );
      resolver.resolve(route as any, null).subscribe(resolved => {
        expect(resolved).toEqual(
          {
            ...route.data.menu,
            [MenuID.DSO_EDIT]: [
<<<<<<< HEAD
              ...dummySections1.map((menu) => Object.assign(menu, {id: menu.id + '-test-uuid'})),
              ...dummySections2.map((menu) => Object.assign(menu, {id: menu.id + '-test-uuid'}))
            ]
          }
        );
        expect(dSpaceObjectDataService.findById).toHaveBeenCalledWith('test-uuid', true, false);
=======
              ...dummySections1.map((menu) => Object.assign(menu, {id: menu.id + '-test-item-uuid'})),
              ...dummySections2.map((menu) => Object.assign(menu, {id: menu.id + '-test-item-uuid'}))
            ]
          }
        );
        expect(dSpaceObjectDataService.findById).toHaveBeenCalledWith('test-item-uuid', true, false);
>>>>>>> dspace-7.6.1
        expect(resolver.getDsoMenus).toHaveBeenCalled();
        done();
      });
    });
<<<<<<< HEAD
=======

>>>>>>> dspace-7.6.1
    it('should create all menus when a dso is found based on the route scope query param when no id param is present', (done) => {
      spyOn(resolver, 'getDsoMenus').and.returnValue(
        [observableOf(dummySections1), observableOf(dummySections2)]
      );
      const routeWithScope = {
        data: {
          menu: {
            'statistics': [{
              id: 'statistics-dummy-1',
              active: false,
              visible: true,
              model: null
            }]
          }
        },
        params: {},
        queryParams: {scope: 'test-scope-uuid'},
      };

      resolver.resolve(routeWithScope as any, null).subscribe(resolved => {
        expect(resolved).toEqual(
          {
            ...route.data.menu,
            [MenuID.DSO_EDIT]: [
              ...dummySections1.map((menu) => Object.assign(menu, {id: menu.id + '-test-scope-uuid'})),
              ...dummySections2.map((menu) => Object.assign(menu, {id: menu.id + '-test-scope-uuid'}))
            ]
          }
        );
        expect(dSpaceObjectDataService.findById).toHaveBeenCalledWith('test-scope-uuid', true, false);
        expect(resolver.getDsoMenus).toHaveBeenCalled();
        done();
      });
    });
<<<<<<< HEAD
=======

>>>>>>> dspace-7.6.1
    it('should return the statistics menu when no dso is found', (done) => {
      (dSpaceObjectDataService.findById as jasmine.Spy).and.returnValue(createFailedRemoteDataObject$());

      resolver.resolve(route as any, null).subscribe(resolved => {
        expect(resolved).toEqual(
          {
            ...route.data.menu
          }
        );
        done();
      });
    });
  });
<<<<<<< HEAD
  describe('getDsoMenus', () => {
    it('should return as first part the item version, orcid and claim list ', (done) => {
      const result = resolver.getDsoMenus(testObject, route, state);
      result[0].subscribe((menuList) => {
        expect(menuList.length).toEqual(3);
        expect(menuList[0].id).toEqual('orcid-dso');
        expect(menuList[0].active).toEqual(false);
        // Visible should be false due to the item not being of type person
        expect(menuList[0].visible).toEqual(false);
        expect(menuList[0].model.type).toEqual(MenuItemType.LINK);

        expect(menuList[1].id).toEqual('version-dso');
        expect(menuList[1].active).toEqual(false);
        expect(menuList[1].visible).toEqual(true);
        expect(menuList[1].model.type).toEqual(MenuItemType.ONCLICK);
        expect((menuList[1].model as TextMenuItemModel).text).toEqual('message');
        expect(menuList[1].model.disabled).toEqual(false);
        expect(menuList[1].icon).toEqual('code-branch');

        expect(menuList[2].id).toEqual('claim-dso');
        expect(menuList[2].active).toEqual(false);
        // Visible should be false due to the item not being of type person
        expect(menuList[2].visible).toEqual(false);
        expect(menuList[2].model.type).toEqual(MenuItemType.ONCLICK);
        expect((menuList[2].model as TextMenuItemModel).text).toEqual('item.page.claim.button');
        done();
      });

    });
    it('should return as second part the common list ', (done) => {
      const result = resolver.getDsoMenus(testObject, route, state);
      result[1].subscribe((menuList) => {
        expect(menuList.length).toEqual(1);
        expect(menuList[0].id).toEqual('edit-dso');
        expect(menuList[0].active).toEqual(false);
        expect(menuList[0].visible).toEqual(true);
        expect(menuList[0].model.type).toEqual(MenuItemType.LINK);
        expect((menuList[0].model as LinkMenuItemModel).text).toEqual('item.page.edit');
        expect((menuList[0].model as LinkMenuItemModel).link).toEqual('/items/test-uuid/edit/metadata');
        expect(menuList[0].icon).toEqual('pencil-alt');
        done();
      });

=======

  describe('getDsoMenus', () => {
    describe('for Communities', () => {
      beforeEach(() => {
        testObject = testCommunity;
        dSpaceObjectDataService.findById.and.returnValue(createSuccessfulRemoteDataObject$(testCommunity));
        route = dsoRoute(testCommunity);
      });

      it('should not return Item-specific entries', (done) => {
        const result = resolver.getDsoMenus(testObject, route, state);
        combineLatest(result).pipe(map(flatten)).subscribe((menu) => {
          const orcidEntry = menu.find(entry => entry.id === 'orcid-dso');
          expect(orcidEntry).toBeFalsy();

          const versionEntry = menu.find(entry => entry.id === 'version-dso');
          expect(versionEntry).toBeFalsy();

          const claimEntry = menu.find(entry => entry.id === 'claim-dso');
          expect(claimEntry).toBeFalsy();

          done();
        });
      });

      it('should return Community/Collection-specific entries', (done) => {
        const result = resolver.getDsoMenus(testObject, route, state);
        combineLatest(result).pipe(map(flatten)).subscribe((menu) => {
          const subscribeEntry = menu.find(entry => entry.id === 'subscribe');
          expect(subscribeEntry).toBeTruthy();
          expect(subscribeEntry.active).toBeFalse();
          expect(subscribeEntry.visible).toBeTrue();
          expect(subscribeEntry.model.type).toEqual(MenuItemType.ONCLICK);
          done();
        });
      });

      it('should return as third part the common list ', (done) => {
        const result = resolver.getDsoMenus(testObject, route, state);
        combineLatest(result).pipe(map(flatten)).subscribe((menu) => {
          const editEntry = menu.find(entry => entry.id === 'edit-dso');
          expect(editEntry).toBeTruthy();
          expect(editEntry.active).toBeFalse();
          expect(editEntry.visible).toBeTrue();
          expect(editEntry.model.type).toEqual(MenuItemType.LINK);
          expect((editEntry.model as LinkMenuItemModel).link).toEqual(
            '/communities/test-community-uuid/edit/metadata'
          );
          done();
        });
      });
    });

    describe('for Collections', () => {
      beforeEach(() => {
        testObject = testCollection;
        dSpaceObjectDataService.findById.and.returnValue(createSuccessfulRemoteDataObject$(testCollection));
        route = dsoRoute(testCollection);
      });

      it('should not return Item-specific entries', (done) => {
        const result = resolver.getDsoMenus(testObject, route, state);
        combineLatest(result).pipe(map(flatten)).subscribe((menu) => {
          const orcidEntry = menu.find(entry => entry.id === 'orcid-dso');
          expect(orcidEntry).toBeFalsy();

          const versionEntry = menu.find(entry => entry.id === 'version-dso');
          expect(versionEntry).toBeFalsy();

          const claimEntry = menu.find(entry => entry.id === 'claim-dso');
          expect(claimEntry).toBeFalsy();

          done();
        });
      });

      it('should return Community/Collection-specific entries', (done) => {
        const result = resolver.getDsoMenus(testObject, route, state);
        combineLatest(result).pipe(map(flatten)).subscribe((menu) => {
          const subscribeEntry = menu.find(entry => entry.id === 'subscribe');
          expect(subscribeEntry).toBeTruthy();
          expect(subscribeEntry.active).toBeFalse();
          expect(subscribeEntry.visible).toBeTrue();
          expect(subscribeEntry.model.type).toEqual(MenuItemType.ONCLICK);
          done();
        });
      });

      it('should return as third part the common list ', (done) => {
        const result = resolver.getDsoMenus(testObject, route, state);
        combineLatest(result).pipe(map(flatten)).subscribe((menu) => {
          const editEntry = menu.find(entry => entry.id === 'edit-dso');
          expect(editEntry).toBeTruthy();
          expect(editEntry.active).toBeFalse();
          expect(editEntry.visible).toBeTrue();
          expect(editEntry.model.type).toEqual(MenuItemType.LINK);
          expect((editEntry.model as LinkMenuItemModel).link).toEqual(
            '/collections/test-collection-uuid/edit/metadata'
          );
          done();
        });
      });
    });

    describe('for Items', () => {
      beforeEach(() => {
        testObject = testItem;
        dSpaceObjectDataService.findById.and.returnValue(createSuccessfulRemoteDataObject$(testItem));
        route = dsoRoute(testItem);
      });

      it('should return Item-specific entries', (done) => {
        const result = resolver.getDsoMenus(testObject, route, state);
        combineLatest(result).pipe(map(flatten)).subscribe((menu) => {
          const orcidEntry = menu.find(entry => entry.id === 'orcid-dso');
          expect(orcidEntry).toBeTruthy();
          expect(orcidEntry.active).toBeFalse();
          expect(orcidEntry.visible).toBeFalse();
          expect(orcidEntry.model.type).toEqual(MenuItemType.LINK);

          const versionEntry = menu.find(entry => entry.id === 'version-dso');
          expect(versionEntry).toBeTruthy();
          expect(versionEntry.active).toBeFalse();
          expect(versionEntry.visible).toBeTrue();
          expect(versionEntry.model.type).toEqual(MenuItemType.ONCLICK);
          expect(versionEntry.model.disabled).toBeFalse();

          const claimEntry = menu.find(entry => entry.id === 'claim-dso');
          expect(claimEntry).toBeTruthy();
          expect(claimEntry.active).toBeFalse();
          expect(claimEntry.visible).toBeFalse();
          expect(claimEntry.model.type).toEqual(MenuItemType.ONCLICK);
          done();
        });
      });

      it('should not return Community/Collection-specific entries', (done) => {
        const result = resolver.getDsoMenus(testObject, route, state);
        combineLatest(result).pipe(map(flatten)).subscribe((menu) => {
          const subscribeEntry = menu.find(entry => entry.id === 'subscribe');
          expect(subscribeEntry).toBeFalsy();
          done();
        });
      });

      it('should return as third part the common list ', (done) => {
        const result = resolver.getDsoMenus(testObject, route, state);
        combineLatest(result).pipe(map(flatten)).subscribe((menu) => {
          const editEntry = menu.find(entry => entry.id === 'edit-dso');
          expect(editEntry).toBeTruthy();
          expect(editEntry.active).toBeFalse();
          expect(editEntry.visible).toBeTrue();
          expect(editEntry.model.type).toEqual(MenuItemType.LINK);
          expect((editEntry.model as LinkMenuItemModel).link).toEqual(
            '/items/test-item-uuid/edit/metadata'
          );
          done();
        });
      });
>>>>>>> dspace-7.6.1
    });
  });
});
