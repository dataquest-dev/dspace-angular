import { coreEffects } from './core.effects';

describe('coreEffects', () => {
  it('should not reset the menus when the browser rehydrates the server state', () => {
    // The server state already holds the built menus and the browser menu providers replace each section by id.
    // A reset on REHYDRATE only hides the admin sidebar until the providers are done, which shifts the page.
    expect(coreEffects.map((effect) => effect.name)).not.toContain('MenuEffects');
  });
});
