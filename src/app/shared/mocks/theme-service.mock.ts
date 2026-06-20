import { ThemeService } from '../theme-support/theme.service';
import { of as observableOf } from 'rxjs';
import { ThemeConfig } from '../../../config/theme.model';
import { isNotEmpty } from '../empty.util';

export function getMockThemeService(themeName = 'base', themes?: ThemeConfig[]): ThemeService {
  // getThemeName$ is a real method on ThemeService (called as getThemeName$()),
  // so it must stay a spy method that returns an Observable.
  // isThemeLoading$ is a real property getter on ThemeService, so it must be a
  // property on the mock - not a spy method - or AsyncPipe / combineLatest will
  // receive a function instead of a stream.
  const spy = jasmine.createSpyObj('themeService', {
    getThemeName: themeName,
    getThemeName$: observableOf(themeName),
    getThemeConfigFor: undefined,
    listenForRouteChanges: undefined,
  }, {
    isThemeLoading$: observableOf(false),
  });

  if (isNotEmpty(themes)) {
    spy.getThemeConfigFor.and.callFake((name: string) => themes.find(theme => theme.name === name));
  }

  return spy;
}
