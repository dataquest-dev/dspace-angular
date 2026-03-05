import { UniqueIdRegistry } from './unique-id-registry';

describe('UniqueIdRegistry', () => {

  afterEach(() => {
    UniqueIdRegistry.clear();
  });

  describe('register', () => {
    it('should return the base ID for the first registration', () => {
      const id = UniqueIdRegistry.register('email', 'email_root');
      expect(id).toBe('email');
    });

    it('should return a suffixed ID for the second registration of the same base ID', () => {
      UniqueIdRegistry.register('email', 'email_root');
      const id2 = UniqueIdRegistry.register('email', 'email_group1');
      expect(id2).toBe('email_1');
    });

    it('should return incrementing suffixes for multiple registrations', () => {
      UniqueIdRegistry.register('email', 'email_root');
      const id2 = UniqueIdRegistry.register('email', 'email_group1');
      const id3 = UniqueIdRegistry.register('email', 'email_group2');
      expect(id2).toBe('email_1');
      expect(id3).toBe('email_2');
    });

    it('should return the cached value for idempotent re-registration', () => {
      const id1 = UniqueIdRegistry.register('email', 'email_root');
      const id2 = UniqueIdRegistry.register('email', 'email_root');
      expect(id1).toBe(id2);
      expect(id1).toBe('email');
    });

    it('should handle independent base IDs separately', () => {
      const id1 = UniqueIdRegistry.register('email', 'email_root');
      const id2 = UniqueIdRegistry.register('name', 'name_root');
      expect(id1).toBe('email');
      expect(id2).toBe('name');
    });
  });

  describe('release', () => {
    it('should free suffix 0 so a new registration reuses the base ID', () => {
      UniqueIdRegistry.register('email', 'email_root');
      UniqueIdRegistry.release('email_root');

      const id = UniqueIdRegistry.register('email', 'email_new');
      expect(id).toBe('email');
    });

    it('should free a suffixed entry so a new registration reuses that suffix', () => {
      UniqueIdRegistry.register('email', 'email_root');
      UniqueIdRegistry.register('email', 'email_group1');
      UniqueIdRegistry.release('email_group1');

      const id = UniqueIdRegistry.register('email', 'email_group2');
      expect(id).toBe('email_1');
    });

    it('should be a no-op for an unknown instance key', () => {
      UniqueIdRegistry.register('email', 'email_root');
      UniqueIdRegistry.release('unknown_key');

      // Original registration still works
      const id = UniqueIdRegistry.register('email', 'email_root');
      expect(id).toBe('email');
    });

    it('should assign lowest available suffix after releasing middle suffix', () => {
      UniqueIdRegistry.register('x', 'x_a'); // suffix 0
      UniqueIdRegistry.register('x', 'x_b'); // suffix 1
      UniqueIdRegistry.register('x', 'x_c'); // suffix 2

      UniqueIdRegistry.release('x_b'); // free suffix 1

      const id = UniqueIdRegistry.register('x', 'x_d');
      expect(id).toBe('x_1');
    });
  });

  describe('clear', () => {
    it('should reset all state so registrations start fresh', () => {
      UniqueIdRegistry.register('email', 'email_root');
      UniqueIdRegistry.register('email', 'email_group1');
      UniqueIdRegistry.clear();

      const id = UniqueIdRegistry.register('email', 'email_root');
      expect(id).toBe('email');
    });
  });

  describe('destroy and re-create scenario', () => {
    it('should return the base ID when the sole instance is destroyed and recreated', () => {
      // Simulates a form field being destroyed (e.g., type change) and recreated
      UniqueIdRegistry.register('local_hasCMDI', 'local_hasCMDI_root');
      UniqueIdRegistry.release('local_hasCMDI_root');

      const id = UniqueIdRegistry.register('local_hasCMDI', 'local_hasCMDI_root');
      expect(id).toBe('local_hasCMDI');
    });
  });
});
