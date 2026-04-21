import { LogInExternalProviderComponent } from './log-in-external-provider/log-in-external-provider.component';
import { LogInPasswordComponent } from './password/log-in-password.component';
import { LogInShibbolethWayfComponent } from './shibboleth-wayf/log-in-shibboleth-wayf.component';

export type AuthMethodTypeComponent =
  typeof LogInPasswordComponent |
  typeof LogInExternalProviderComponent |
  typeof LogInShibbolethWayfComponent;
