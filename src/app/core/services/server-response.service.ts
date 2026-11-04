import { RESPONSE } from '@nguniversal/express-engine/tokens';
import { Inject, Injectable, Optional } from '@angular/core';

import { Response } from 'express';

/**
 * Service responsible to provide method to manage the response object
 */
@Injectable()
export class ServerResponseService {
  private response: Response;

  private warnedAboutCommittedResponse = false;

  constructor(@Optional() @Inject(RESPONSE) response: any) {
    this.response = response;
  }

  /**
   * Set a status code to response
   *
   * @param code
   * @param message
   */
  setStatus(code: number, message?: string): this {
    if (this.canModifyResponse()) {
      this.response.statusCode = code;
      if (message) {
        this.response.statusMessage = message;
      }
    }
    return this;
  }

  /**
   * Set Unauthorized status
   *
   *  @param message
   */
  setUnauthorized(message = 'Unauthorized'): this {
    return this.setStatus(401, message);
  }

  /**
   * Set Forbidden status
   *
   *  @param message
   */
  setForbidden(message = 'Forbidden'): this {
    return this.setStatus(403, message);
  }

  /**
   * Set Not found status
   *
   *  @param message
   */
  setNotFound(message = 'Not found'): this {
    return this.setStatus(404, message);
  }

  /**
   * Set Internal Server Error status
   *
   *  @param message
   */
  setInternalServerError(message = 'Internal Server Error'): this {
    return this.setStatus(500, message);
  }

  /**
   * Set a response's header
   *
   * @param header
   * @param content
   */
  setHeader(header: string, content: string) {
    if (this.canModifyResponse()) {
      this.response.setHeader(header, content);
    }
  }

  private canModifyResponse(): boolean {
    if (!this.response) {
      return false;
    }
    if (this.response.headersSent) {
      if (!this.warnedAboutCommittedResponse) {
        console.warn('Server response already committed; skipping subsequent header/status updates.');
        this.warnedAboutCommittedResponse = true;
      }
      return false;
    }
    return true;
  }

}
