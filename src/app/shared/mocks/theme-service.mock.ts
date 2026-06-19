import { ThemeService } from '../theme-support/theme.service';
import { of as observableOf } from 'rxjs';
import { ThemeConfig } from '../../../config/theme.config';
import { isNotEmpty } from '../empty.util';

export function getMockThemeService(themeName = 'base', themes?: ThemeConfig[]): ThemeService {
  const spy = jasmine.createSpyObj('themeService', [
    'getThemeName',
    'getThemeConfigFor',
    'listenForRouteChanges',
  ], {
    getThemeName$: observableOf(themeName),
    isThemeLoading$: observableOf(false),
  });

  spy.getThemeName.and.returnValue(themeName);

  if (isNotEmpty(themes)) {
    spy.getThemeConfigFor.and.callFake((name: string) => themes.find(theme => theme.name === name));
  }

  return spy;
}
