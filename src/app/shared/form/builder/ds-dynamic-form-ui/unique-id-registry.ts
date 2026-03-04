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
 * Components must call `register()` during initialization and `release()` during destruction.
 */
export class UniqueIdRegistry {

  /**
   * Monotonic counter per base ID. Always increments, never decrements,
   * so released suffixes are never reissued to a different instance.
   * Key = base element ID, Value = next suffix to assign.
   */
  private static nextSuffix: Map<string, number> = new Map<string, number>();

  /**
   * Tracks the assigned suffix for each component instance.
   * Key = a unique instance token (component + model-based), Value = the suffix index assigned.
   */
  private static instanceSuffixes: Map<string, number> = new Map<string, number>();

  /**
   * Register a base ID and return a unique ID for this instance.
   * The first occurrence returns the base ID unchanged.
   * Subsequent occurrences return `baseId_N` where N is the occurrence index (1, 2, ...).
   *
   * @param baseId The base element ID (from getElementId).
   * @param instanceKey A unique key identifying this specific component instance.
   * @returns The unique element ID to use in the DOM.
   */
  static register(baseId: string, instanceKey: string): string {
    // If this instance was already registered, return its existing ID
    if (this.instanceSuffixes.has(instanceKey)) {
      const suffix = this.instanceSuffixes.get(instanceKey);
      return suffix === 0 ? baseId : `${baseId}_${suffix}`;
    }

    const suffix = this.nextSuffix.get(baseId) || 0;
    this.nextSuffix.set(baseId, suffix + 1);
    this.instanceSuffixes.set(instanceKey, suffix);
    return suffix === 0 ? baseId : `${baseId}_${suffix}`;
  }

  /**
   * Release the unique ID when a component is destroyed.
   *
   * @param instanceKey The unique key used during registration.
   */
  static release(instanceKey: string): void {
    this.instanceSuffixes.delete(instanceKey);
  }

  /**
   * Clear the entire registry. Used in tests to reset state between specs.
   */
  static clear(): void {
    this.nextSuffix.clear();
    this.instanceSuffixes.clear();
  }
}
