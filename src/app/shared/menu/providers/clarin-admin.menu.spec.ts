/**
 * The contents of this file are subject to the license and copyright
 * detailed in the LICENSE and NOTICE files at the root of the source
 * tree and available online at
 *
 * http://www.dspace.org/license/
 */

import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { AuthorizationDataService } from '../../../core/data/feature-authorization/authorization-data.service';
import { FeatureID } from '../../../core/data/feature-authorization/feature-id';
import { AuthorizationDataServiceStub } from '../../testing/authorization-service.stub';
import { LinkMenuItemModel } from '../menu-item/models/link.model';
import { MenuItemType } from '../menu-item-type.model';
import { PartialMenuSection } from '../menu-provider.model';
import { ClarinAdminMenuProvider } from './clarin-admin.menu';

describe('ClarinAdminMenuProvider', () => {
  const UPDATE_CONFIG_KEY = 'menu.section.update-config';

  const sectionsFor = (isSiteAdmin: boolean): PartialMenuSection[] => [
    {
      visible: isSiteAdmin,
      model: {
        type: MenuItemType.LINK,
        text: 'menu.section.handle',
        link: '/handle-table',
      },
      icon: 'table',
    },
    {
      visible: isSiteAdmin,
      model: {
        type: MenuItemType.LINK,
        text: 'menu.section.epic-handle',
        link: '/epic-handle-table/prefix',
      },
      icon: 'grip-lines',
    },
    {
      visible: isSiteAdmin,
      model: {
        type: MenuItemType.LINK,
        text: 'menu.section.licenses',
        link: '/licenses/manage-table',
      },
      icon: 'scroll',
    },
    {
      visible: isSiteAdmin,
      model: {
        type: MenuItemType.LINK,
        text: UPDATE_CONFIG_KEY,
        link: '/admin/update-config',
      },
      icon: 'cogs',
    },
  ];

  const keysOf = (sections: PartialMenuSection[]): string[] =>
    sections.map((section) => (section.model as LinkMenuItemModel).text);

  const updateConfigIn = (sections: PartialMenuSection[]): PartialMenuSection[] =>
    sections.filter((section) => (section.model as LinkMenuItemModel).text === UPDATE_CONFIG_KEY);

  let provider: ClarinAdminMenuProvider;
  let authorizationServiceStub: AuthorizationDataServiceStub;

  const configure = (isSiteAdmin: boolean) => {
    authorizationServiceStub = new AuthorizationDataServiceStub();
    spyOn(authorizationServiceStub, 'isAuthorized').and.returnValue(of(isSiteAdmin));

    TestBed.configureTestingModule({
      providers: [
        ClarinAdminMenuProvider,
        { provide: AuthorizationDataService, useValue: authorizationServiceStub },
      ],
    });
    provider = TestBed.inject(ClarinAdminMenuProvider);
  };

  describe('for a site administrator', () => {
    beforeEach(() => configure(true));

    it('should be created', () => {
      expect(provider).toBeTruthy();
    });

    it('getSections should return four CLARIN admin sections', (done) => {
      provider.getSections().subscribe((sections) => {
        expect(sections.length).toEqual(4);
        done();
      });
    });

    it('getSections should offer update-config as a reachable link to /admin/update-config', (done) => {
      provider.getSections().subscribe((sections) => {
        expect(keysOf(sections)).toContain(UPDATE_CONFIG_KEY);
        expect(updateConfigIn(sections)).toEqual([
          {
            visible: true,
            model: {
              type: MenuItemType.LINK,
              text: UPDATE_CONFIG_KEY,
              link: '/admin/update-config',
            },
            icon: 'cogs',
          },
        ] as PartialMenuSection[]);
        done();
      });
    });

    it('getSections should return expected menu sections', (done) => {
      provider.getSections().subscribe((sections) => {
        expect(sections).toEqual(sectionsFor(true));
        done();
      });
    });

    it('getSections should gate every section on the site administrator feature', (done) => {
      provider.getSections().subscribe((sections) => {
        expect(authorizationServiceStub.isAuthorized).toHaveBeenCalledWith(FeatureID.AdministratorOf);
        expect(sections.every((section) => section.visible)).toBeTrue();
        done();
      });
    });
  });

  describe('for a user who is not a site administrator', () => {
    beforeEach(() => configure(false));

    it('getSections should leave no section visible, update-config included', (done) => {
      provider.getSections().subscribe((sections) => {
        expect(sections.filter((section) => section.visible).length).toEqual(0);
        expect(updateConfigIn(sections)).toEqual([
          {
            visible: false,
            model: {
              type: MenuItemType.LINK,
              text: UPDATE_CONFIG_KEY,
              link: '/admin/update-config',
            },
            icon: 'cogs',
          },
        ] as PartialMenuSection[]);
        done();
      });
    });
  });
});
