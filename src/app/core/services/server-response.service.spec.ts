import { ServerResponseService } from './server-response.service';

describe('ServerResponseService', () => {
  it('should preserve headers and status after the response has been committed', () => {
    const response = jasmine.createSpyObj('response', ['setHeader']);
    response.headersSent = true;
    response.statusCode = 302;
    response.statusMessage = 'Found';
    const service = new ServerResponseService(response);
    const warning = spyOn(console, 'warn');
    service.setHeader('Link', '<https://example.org>');
    service.setStatus(200, 'OK');
    expect(response.setHeader).not.toHaveBeenCalled();
    expect(response.statusCode).toBe(302);
    expect(response.statusMessage).toBe('Found');
    expect(warning).toHaveBeenCalledTimes(1);
    expect(warning).toHaveBeenCalledWith('Server response already committed; skipping subsequent header/status updates.');
  });

  it('should set headers and status before commitment', () => {
    const response = jasmine.createSpyObj('response', ['setHeader']);
    response.headersSent = false;
    const service = new ServerResponseService(response);
    service.setHeader('Link', '<https://example.org>');
    service.setStatus(404, 'Not Found');
    expect(response.setHeader).toHaveBeenCalledWith('Link', '<https://example.org>');
    expect(response.statusCode).toBe(404);
    expect(response.statusMessage).toBe('Not Found');
  });

  it('should be safe in the browser without a server response', () => {
    const service = new ServerResponseService(null);
    expect(() => service.setHeader('Link', '<https://example.org>')).not.toThrow();
    expect(service.setStatus(200)).toBe(service);
  });
});
