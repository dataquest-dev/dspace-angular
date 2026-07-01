import { of } from 'rxjs';

import { ThemeConfig } from '../../../config/theme.config';
import { isNotEmpty } from '../empty.util';
import { ThemeService } from '../theme-support/theme.service';

export function getMockThemeService(themeName = 'base', themes?: ThemeConfig[]): ThemeService {
  // isThemeLoading$ is a real property getter on ThemeService, so it must be a property on the mock
  // (not a spy method) - AppComponent's overlay-removal gate reads it as a stream.
  const spy = jasmine.createSpyObj('themeService', {
    getThemeName: themeName,
    getThemeName$: of(themeName),
    getThemeConfigFor: undefined,
    listenForRouteChanges: undefined,
  }, {
    isThemeLoading$: of(false),
  });

  if (isNotEmpty(themes)) {
    spy.getThemeConfigFor.and.callFake((name: string) => themes.find(theme => theme.name === name));
  }

  return spy;
}
