/**
 * The contents of this file are subject to the license and copyright
 * detailed in the LICENSE and NOTICE files at the root of the source
 * tree and available online at
 *
 * http://www.dspace.org/license/
 */

import { TestBed } from '@angular/core/testing';

import { MYDSPACE_ROUTE } from '../../../my-dspace-page/my-dspace-page.component';
import { MenuItemType } from '../menu-item-type.model';
import { PartialMenuSection } from '../menu-provider.model';
import { SubmissionsMenuProvider } from './submissions.menu';

describe('SubmissionsMenuProvider', () => {
  const expectedSections: PartialMenuSection[] = [
    {
      visible: true,
      model: {
        type: MenuItemType.LINK,
        text: 'menu.section.submissions',
        link: MYDSPACE_ROUTE,
      },
      icon: 'upload',
    },
  ];

  let provider: SubmissionsMenuProvider;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        SubmissionsMenuProvider,
      ],
    });
    provider = TestBed.inject(SubmissionsMenuProvider);
  });

  it('should be created', () => {
    expect(provider).toBeTruthy();
  });

  it('getSections should return expected menu sections', (done) => {
    provider.getSections().subscribe((sections) => {
      expect(sections).toEqual(expectedSections);
      done();
    });
  });
});
