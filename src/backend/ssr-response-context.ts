import { ServerResponse } from 'node:http';

import type {
  Request,
  Response,
} from 'express';

/**
 * Give a background render its own response, without a socket to the visitor.
 * Express response methods still need their application prototype and a request.
 * The request is a read-only metadata snapshot; its body, socket and event handlers
 * belong to the original request and must not be consumed by background rendering.
 */
export function createSsrRefreshContext(req: Request, res: Response): { request: Request; response: Response } {
  const request = Object.assign(Object.create(Object.getPrototypeOf(req)), req) as Request;
  const response = new ServerResponse(request) as unknown as Response;
  Object.setPrototypeOf(response, Object.getPrototypeOf(res));
  Object.assign(response, { locals: {}, req: request });
  request.res = response;
  return { request, response };
}
