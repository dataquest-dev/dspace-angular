import { AuthMethodType } from '../../../core/auth/models/auth.method-type';
import { AuthMethodTypeComponent } from './auth-methods.type';
import { LogInExternalProviderComponent } from './log-in-external-provider/log-in-external-provider.component';
import { LogInPasswordComponent } from './password/log-in-password.component';
import { LogInShibbolethWayfComponent } from './shibboleth-wayf/log-in-shibboleth-wayf.component';

export const AUTH_METHOD_FOR_DECORATOR_MAP = new Map<AuthMethodType, AuthMethodTypeComponent>([
  [AuthMethodType.Password, LogInPasswordComponent],
  [AuthMethodType.Shibboleth, LogInShibbolethWayfComponent],
  [AuthMethodType.Oidc, LogInExternalProviderComponent],
  [AuthMethodType.Orcid, LogInExternalProviderComponent],
  [AuthMethodType.Saml, LogInExternalProviderComponent],
]);

/**
 * @deprecated
 */
export function renderAuthMethodFor(authMethodType: AuthMethodType) {
  return function decorator(objectElement: any) {
    if (!objectElement) {
      return;
    }
    AUTH_METHOD_FOR_DECORATOR_MAP.set(authMethodType, objectElement);
  };
}
