import { environment } from './environments/environment';
import {
  HEALTH_CHECK_PATH,
  registerNamespacedRoutes,
  ROBOTS_TXT_PATH,
  ROBOTS_TXT_TEMPLATE,
  robotsTxt,
} from './server-routes';

describe('server-routes', () => {
  describe('registerNamespacedRoutes', () => {
    let router;
    let healthCheck;

    beforeEach(() => {
      router = jasmine.createSpyObj('router', ['get']);
      healthCheck = () => undefined;
    });

    it('should register robots.txt on the namespace router', () => {
      registerNamespacedRoutes(router, healthCheck);
      expect(router.get).toHaveBeenCalledWith(ROBOTS_TXT_PATH, robotsTxt);
    });

    it('should register the health check on the namespace router', () => {
      registerNamespacedRoutes(router, healthCheck);
      expect(router.get).toHaveBeenCalledWith(HEALTH_CHECK_PATH, healthCheck);
    });

    it('should register both namespaced routes and nothing else', () => {
      registerNamespacedRoutes(router, healthCheck);
      expect(router.get).toHaveBeenCalledTimes(2);
    });

    it('should refuse the Express app, whose routes the router catch-all would shadow', () => {
      const app = jasmine.createSpyObj('app', ['get', 'listen', 'use']);
      expect(() => registerNamespacedRoutes(app, healthCheck)).toThrowError(/namespace router/);
      expect(app.get).not.toHaveBeenCalled();
    });
  });

  describe('robotsTxt', () => {
    let res;

    beforeEach(() => {
      res = jasmine.createSpyObj('res', ['setHeader', 'render']);
      robotsTxt(undefined, res);
    });

    it('should answer as text/plain rather than as an HTML page', () => {
      expect(res.setHeader).toHaveBeenCalledWith('content-type', 'text/plain');
    });

    it('should render the template that webpack copies into the browser dist', () => {
      expect(res.render).toHaveBeenCalledWith(ROBOTS_TXT_TEMPLATE, { origin: environment.ui.baseUrl });
    });
  });
});
