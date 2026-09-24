import { TestBed } from '@angular/core/testing';
import {
  provideRouter,
  withComponentInputBinding,
} from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { NEVER } from 'rxjs';

import { DSpaceObjectType } from '../core/shared/dspace-object-type.model';
import { ThemeService } from '../shared/theme-support/theme.service';
import { ROUTES } from './search-page-routes';
import { ThemedConfigurationSearchPageComponent } from './themed-configuration-search-page.component';

describe('Search page routes', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter(ROUTES, withComponentInputBinding()),
        { provide: ThemeService, useValue: { getThemeName$: () => NEVER } },
      ],
    });
  });

  it('should restrict /search/:configuration to items only', async () => {
    const harness = await RouterTestingHarness.create();
    const page = await harness.navigateByUrl('/default', ThemedConfigurationSearchPageComponent);

    expect(page.configuration).toBe('default');
    expect(page.forcedDsoTypes).toEqual([DSpaceObjectType.ITEM]);
  });
});
