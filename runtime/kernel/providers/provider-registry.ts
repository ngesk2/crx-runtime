/**
 * Provider Registry
 * 
 * Dynamic provider registration and routing through execution spine.
 * 
 * Instead of hardcoding providers:
 * 
 * ProviderRegistry.register(new GitHubProvider())
 * ProviderRegistry.register(new KitProvider())
 * ProviderRegistry.register(new SlackProvider())
 * ProviderRegistry.register(new StripeProvider())
 * ProviderRegistry.register(new OpenAIProvider())
 * 
 * Execution becomes:
 * 
 * ExecutionEngine.execute(providerId, operation, input)
 * 
 * The spine never changes again.
 */

import { ExecutionProvider, ProviderType, ProviderTrait, ProviderRequirements, ProviderFilters } from './provider-authority-interface';
import { IProviderAuthority } from './provider-authority-interface';

/**
 * Provider Registry
 * Central registry for all constitutional providers
 */
export class ProviderRegistry implements IProviderAuthority {
  private providers: Map<string, ExecutionProvider> = new Map();
  private providerByType: Map<ProviderType, ExecutionProvider[]> = new Map();
  private providerByTrait: Map<ProviderTrait, ExecutionProvider[]> = new Map();

  /**
   * Register a provider
   */
  register(provider: ExecutionProvider): void {
    this.providers.set(provider.providerId, provider);

    // Index by type
    if (!this.providerByType.has(provider.providerType)) {
      this.providerByType.set(provider.providerType, []);
    }
    this.providerByType.get(provider.providerType)!.push(provider);

    // Index by traits
    for (const trait of provider.traits) {
      if (!this.providerByTrait.has(trait)) {
        this.providerByTrait.set(trait, []);
      }
      this.providerByTrait.get(trait)!.push(provider);
    }
  }

  /**
   * Unregister a provider
   */
  unregister(providerId: string): void {
    const provider = this.providers.get(providerId);
    if (!provider) return;

    // Remove from main registry
    this.providers.delete(providerId);

    // Remove from type index
    const typeProviders = this.providerByType.get(provider.providerType);
    if (typeProviders) {
      const index = typeProviders.findIndex(p => p.providerId === providerId);
      if (index !== -1) {
        typeProviders.splice(index, 1);
      }
    }

    // Remove from trait indexes
    for (const trait of provider.traits) {
      const traitProviders = this.providerByTrait.get(trait);
      if (traitProviders) {
        const index = traitProviders.findIndex(p => p.providerId === providerId);
        if (index !== -1) {
          traitProviders.splice(index, 1);
        }
      }
    }
  }

  /**
   * Get provider by ID
   */
  get(providerId: string): ExecutionProvider | null {
    return this.providers.get(providerId) || null;
  }

  /**
   * Resolve providers by requirements
   */
  resolve(requirements: ProviderRequirements): ExecutionProvider[] {
    let candidates: ExecutionProvider[] = [];

    // Start with providers matching required traits
    if (requirements.traits.length > 0) {
      const traitSets = requirements.traits.map(trait => 
        this.providerByTrait.get(trait) || []
      );
      
      // Find providers that have ALL required traits
      candidates = this.findProvidersWithAllTraits(traitSets);
    } else {
      // No trait requirements, consider all providers
      candidates = Array.from(this.providers.values());
    }

    // Filter by max latency
    if (requirements.maxLatency !== undefined) {
      candidates = candidates.filter(provider => {
        const estimate = provider.estimateLatency({
          requestId: 'test',
          capabilityId: 'test',
          input: {},
          parameters: {},
          timeout: 30000,
          priority: 1,
        });
        return estimate.max <= requirements.maxLatency!;
      });
    }

    // Filter by max cost
    if (requirements.maxCost !== undefined) {
      candidates = candidates.filter(provider => {
        const estimate = provider.estimateCost({
          requestId: 'test',
          capabilityId: 'test',
          input: {},
          parameters: {},
          timeout: 30000,
          priority: 1,
        });
        return estimate.amount <= requirements.maxCost!;
      });
    }

    return candidates;
  }

  /**
   * List providers with filters
   */
  list(filters: ProviderFilters): ExecutionProvider[] {
    let candidates: ExecutionProvider[] = Array.from(this.providers.values());

    // Filter by type
    if (filters.providerType) {
      candidates = candidates.filter(p => p.providerType === filters.providerType);
    }

    // Filter by traits
    if (filters.traits && filters.traits.length > 0) {
      candidates = candidates.filter(p => 
        filters.traits!.every(trait => p.traits.includes(trait))
      );
    }

    // Filter by version
    if (filters.version) {
      candidates = candidates.filter(p => p.version === filters.version);
    }

    // Filter by max latency
    if (filters.maxLatency !== undefined) {
      candidates = candidates.filter(provider => {
        const estimate = provider.estimateLatency({
          requestId: 'test',
          capabilityId: 'test',
          input: {},
          parameters: {},
          timeout: 30000,
          priority: 1,
        });
        return estimate.max <= filters.maxLatency!;
      });
    }

    // Filter by max cost
    if (filters.maxCost !== undefined) {
      candidates = candidates.filter(provider => {
        const estimate = provider.estimateCost({
          requestId: 'test',
          capabilityId: 'test',
          input: {},
          parameters: {},
          timeout: 30000,
          priority: 1,
        });
        return estimate.amount <= filters.maxCost!;
      });
    }

    return candidates;
  }

  /**
   * Find providers that have all required traits
   */
  private findProvidersWithAllTraits(traitSets: ExecutionProvider[][]): ExecutionProvider[] {
    if (traitSets.length === 0) {
      return Array.from(this.providers.values());
    }

    // Start with providers from first trait set
    let candidates = traitSets[0];

    // Intersect with subsequent trait sets
    for (let i = 1; i < traitSets.length; i++) {
      const nextSet = traitSets[i];
      candidates = candidates.filter(p => 
        nextSet.some(np => np.providerId === p.providerId)
      );
    }

    return candidates;
  }

  /**
   * Get providers by type
   */
  getByType(providerType: ProviderType): ExecutionProvider[] {
    return this.providerByType.get(providerType) || [];
  }

  /**
   * Get providers by trait
   */
  getByTrait(trait: ProviderTrait): ExecutionProvider[] {
    return this.providerByTrait.get(trait) || [];
  }

  /**
   * Get all registered provider IDs
   */
  getProviderIds(): string[] {
    return Array.from(this.providers.keys());
  }

  /**
   * Get registry statistics
   */
  getStatistics(): {
    totalProviders: number;
    providersByType: Record<string, number>;
    providersByTrait: Record<string, number>;
  } {
    const providersByType: Record<string, number> = {};
    const providersByTrait: Record<string, number> = {};

    for (const [type, providers] of this.providerByType) {
      providersByType[type] = providers.length;
    }

    for (const [trait, providers] of this.providerByTrait) {
      providersByTrait[trait] = providers.length;
    }

    return {
      totalProviders: this.providers.size,
      providersByType,
      providersByTrait,
    };
  }

  /**
   * Clear all providers
   */
  clear(): void {
    this.providers.clear();
    this.providerByType.clear();
    this.providerByTrait.clear();
  }
}

/**
 * Singleton instance for global access
 */
let globalRegistry: ProviderRegistry | null = null;

export function getGlobalRegistry(): ProviderRegistry {
  if (!globalRegistry) {
    globalRegistry = new ProviderRegistry();
  }
  return globalRegistry;
}

export function setGlobalRegistry(registry: ProviderRegistry): void {
  globalRegistry = registry;
}
