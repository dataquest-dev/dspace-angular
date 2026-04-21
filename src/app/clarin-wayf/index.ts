/**
 * Public API surface for the WAYF component library.
 */

// Configuration
export { WayfConfig, WAYF_CONFIG, WAYF_DEFAULTS, SamldsParams } from './wayf.config';
export { WayfModule } from './wayf.module';

// Main component
export { ClarinWayfComponent } from './clarin-wayf.component';
export { CLARIN_WAYF_ROUTES, ROUTES } from './clarin-wayf-routes';

// Models
export { IdentityProvider, DiscoFeedEntry, DiscoFeedLocalizedValue, DiscoFeedLogoEntry } from './models/idp-entry.model';

// Services (for advanced use / testing)
export { WayfFeedService } from './services/feed.service';
export { WayfPersistenceService } from './services/persistence.service';
export { WayfSearchService } from './services/search.service';
