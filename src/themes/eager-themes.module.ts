import { NgModule } from '@angular/core';
import { EagerThemeModule as DSpaceEagerThemeModule } from './dspace/eager-theme.module';
import { EagerThemeModule } from './dspace/eager-theme.module';
import { EagerThemeModule as CustomEagerThemeModule } from './custom/eager-theme.module';

/**
 * This module bundles the eager theme modules for all available themes.
 * Eager modules contain components that are present on every page (to speed up initial loading)
 * and entry components (to ensure their decorators get picked up).
 *
 * Themes that aren't in use should not be imported here so they don't take up unnecessary space in the main bundle.
 *
 * NOTE: CustomEagerThemeModule is included to prevent the home-page flicker that occurs when
 * the active theme is `custom`. Without it, every themed wrapper (footer, header, root, ...) is
 * lazy-loaded via webpack code-splitting on the browser, leaving visible gaps after the SSR DOM
 * is torn down and before the CSR DOM is materialised.
 */
@NgModule({
  imports: [
    DSpaceEagerThemeModule,
    // Uncomment this because the `untyped-item` theming is not working when it is commented out.
    // Issue: https://github.com/DSpace/dspace-angular/issues/1897
    // Useful info in PR: https://github.com/DSpace/dspace-angular/pull/2262#issuecomment-1557146081
    EagerThemeModule,
    CustomEagerThemeModule,
  ],
})
export class EagerThemesModule {
}
