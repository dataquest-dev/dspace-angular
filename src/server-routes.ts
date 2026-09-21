import { environment } from './environments/environment';

/** Minimal Express Router surface: enough to register a route, enough to hand in a test double. */
export interface RouteRegistrar {
  get(path: string, ...handlers: any[]): unknown;
}

/** Minimal Express response surface used by the robots.txt handler. */
export interface RenderableResponse {
  setHeader(name: string, value: string): void;
  render(view: string, options: Record<string, unknown>): void;
}

export const ROBOTS_TXT_PATH = '/robots.txt';

export const HEALTH_CHECK_PATH = '/app/health';

/** webpack.common.ts copies src/robots.txt.ejs here inside the browser dist. */
export const ROBOTS_TXT_TEMPLATE = 'assets/robots.txt.ejs';

export function robotsTxt(req: unknown, res: RenderableResponse): void {
  res.setHeader('content-type', 'text/plain');
  res.render(ROBOTS_TXT_TEMPLATE, {
    origin: environment.ui.baseUrl,
  });
}

/**
 * Register the routes that have to follow ui.nameSpace. They belong on the namespace router, never
 * on the Express app: the app still sees the namespace in the path, so an app-level '/robots.txt'
 * cannot match, and the router catch-all answers with a rendered Angular 404 instead.
 */
export function registerNamespacedRoutes(router: RouteRegistrar, healthCheck: unknown): void {
  if (typeof (router as any).listen === 'function') {
    throw new Error('registerNamespacedRoutes was given the Express app instead of the namespace router; routes registered on the app are shadowed by the router catch-all whenever ui.nameSpace is not "/"');
  }

  router.get(ROBOTS_TXT_PATH, robotsTxt);
  router.get(HEALTH_CHECK_PATH, healthCheck);
}
