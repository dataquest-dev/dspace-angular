import { NgModule } from '@angular/core';
import { EagerThemeModule as DSpaceEagerThemeModule } from './dspace/eager-theme.module';
import { EagerThemeModule } from './zcupub/eager-theme.module';
// import { EagerThemeModule as CustomEagerThemeModule } from './custom/eager-theme.module';

/**
 * This module bundles the eager theme modules for all available themes.
 * Eager modules contain components that are present on every page (to speed up initial loading)
 * and entry components (to ensure their decorators get picked up).
 *
 * Themes that aren't in use should not be imported here so they don't take up unnecessary space in the main bundle.
 */
@NgModule({
  imports: [
    DSpaceEagerThemeModule,
    // Uncomment this because the `untyped-item` theming is not working when it is commented out.
    // Issue: https://github.com/DSpace/dspace-angular/issues/1897
    // Useful info in PR: https://github.com/DSpace/dspace-angular/pull/2262#issuecomment-1557146081
    EagerThemeModule,
  ],
})
export class EagerThemesModule {
}
