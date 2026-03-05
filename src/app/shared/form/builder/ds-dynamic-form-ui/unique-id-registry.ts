/**
 * Static registry for generating unique HTML element IDs across dynamic form components.
 *
 * When the same form model ID appears multiple times in the DOM (e.g., scrollable dropdowns
 * for mediaType/detailedType in different type-bound form groups), this registry ensures
 * each rendered instance receives a unique HTML ID.
 *
 * - First occurrence: keeps the original base ID (backward compatible).
 * - Subsequent occurrences: appends a numeric suffix (`_1`, `_2`, etc.).
 *
 * Released suffixes are recycled and may be assigned to future registrations.
 * Components must call `register()` during initialization and `release()` during destruction.
 */
export class UniqueIdRegistry {

  /**
   * Tracks which suffixes are currently in use for each base ID.
   * Key = base element ID, Value = set of active suffix numbers.
   */
  private static activeSuffixes: Map<string, Set<number>> = new Map<string, Set<number>>();

  /**
   * Tracks the assigned base ID and suffix for each component instance.
   * Key = a unique instance token (component + model-based),
   * Value = { baseId, suffix } assigned to that instance.
   */
  private static instances: Map<string, { baseId: string; suffix: number }> = new Map<string, { baseId: string; suffix: number }>();

  /**
   * Register a base ID and return a unique ID for this instance.
   * The first occurrence returns the base ID unchanged.
   * Subsequent occurrences return `baseId_N` where N is the lowest available suffix (1, 2, ...).
   *
   * @param baseId The base element ID (from getElementId).
   * @param instanceKey A unique key identifying this specific component instance.
   * @returns The unique element ID to use in the DOM.
   */
  static register(baseId: string, instanceKey: string): string {
    // If this instance was already registered, return its existing ID
    const existing = this.instances.get(instanceKey);
    if (existing) {
      return existing.suffix === 0 ? baseId : `${baseId}_${existing.suffix}`;
    }

    // Find the lowest available suffix for this base ID
    const active = this.activeSuffixes.get(baseId) || new Set<number>();
    let suffix = 0;
    while (active.has(suffix)) {
      suffix++;
    }

    active.add(suffix);
    this.activeSuffixes.set(baseId, active);
    this.instances.set(instanceKey, { baseId, suffix });
    return suffix === 0 ? baseId : `${baseId}_${suffix}`;
  }

  /**
   * Release the unique ID when a component is destroyed.
   * The released suffix becomes available for reuse by future registrations.
   *
   * @param instanceKey The unique key used during registration.
   */
  static release(instanceKey: string): void {
    const entry = this.instances.get(instanceKey);
    if (entry) {
      const active = this.activeSuffixes.get(entry.baseId);
      if (active) {
        active.delete(entry.suffix);
        if (active.size === 0) {
          this.activeSuffixes.delete(entry.baseId);
        }
      }
    }
    this.instances.delete(instanceKey);
  }

  /**
   * Clear the entire registry. Used in tests to reset state between specs.
   */
  static clear(): void {
    this.activeSuffixes.clear();
    this.instances.clear();
  }
}
