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
import { ScriptDataService } from '../../../core/data/processes/script-data.service';
import { AuthorizationDataServiceStub } from '../../testing/authorization-service.stub';
import { ScriptServiceStub } from '../../testing/script-service.stub';
import { MenuItemType } from '../menu-item-type.model';
import { PartialMenuSection } from '../menu-provider.model';
import { ImportMenuProvider } from './import.menu';

describe('ImportMenuProvider', () => {
  const expectedTopSection: PartialMenuSection = {
    visible: true,
    model: {
      type: MenuItemType.TEXT,
      text: 'menu.section.import',
    },
    icon: 'file-import',
  };

  const expectedSubSections: PartialMenuSection[] = [
    {
      visible: true,
      model: {
        type: MenuItemType.LINK,
        text: 'menu.section.import_metadata',
        link: '/admin/metadata-import',
      },
    },
    {
      visible: true,
      model: {
        type: MenuItemType.LINK,
        text: 'menu.section.import_batch',
        link: '/admin/batch-import',
      },
    },
  ];

  let provider: ImportMenuProvider;
  let authorizationServiceStub = new AuthorizationDataServiceStub();
  let scriptServiceStub: ScriptServiceStub;

  beforeEach(() => {
    spyOn(authorizationServiceStub, 'isAuthorized').and.returnValue(
      of(true),
    );
    scriptServiceStub = new ScriptServiceStub();

    TestBed.configureTestingModule({
      providers: [
        ImportMenuProvider,
        { provide: AuthorizationDataService, useValue: authorizationServiceStub },
        { provide: ScriptDataService, useValue: scriptServiceStub },
      ],
    });
    provider = TestBed.inject(ImportMenuProvider);
  });

  it('should be created', () => {
    expect(provider).toBeTruthy();
  });

  it('getTopSection should return expected menu section', (done) => {
    provider.getTopSection().subscribe((section) => {
      expect(section).toEqual(expectedTopSection);
      done();
    });
  });

  it('getSubSections should return expected menu sections', (done) => {
    provider.getSubSections().subscribe((sections) => {
      expect(sections).toEqual(expectedSubSections);
      done();
    });
  });

  it('getSubSections should not query the script endpoint when the user is not an administrator', (done) => {
    (authorizationServiceStub.isAuthorized as jasmine.Spy).and.returnValue(of(false));
    spyOn(scriptServiceStub, 'scriptWithNameExistsAndCanExecute').and.callThrough();

    provider.getSubSections().subscribe((sections) => {
      expect(scriptServiceStub.scriptWithNameExistsAndCanExecute).not.toHaveBeenCalled();
      expect(sections.every((section) => section.visible === false)).toBeTrue();
      done();
    });
  });
});
