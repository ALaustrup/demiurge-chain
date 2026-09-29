/**
 * Application Registry
 * 
 * Manages application metadata and registration for the Demiurge ecosystem.
 * Similar to game-registry.ts but for full applications (NFT Portal, Admin, etc.)
 */

export interface AppMetadata {
  id: string;
  title: string;
  description: string;
  icon: string; // Emoji or icon identifier
  route: string; // Route path in hub app
  url?: string; // External URL if embedded
  type: 'internal' | 'embedded' | 'external';
  category: 'portal' | 'marketplace' | 'social' | 'admin' | 'nft' | 'game';
  minLevel?: number; // Minimum QOR ID level required
  requiresAuth?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Application Registry API
 */
class AppRegistry {
  private apps: Map<string, AppMetadata> = new Map();

  /**
   * Register a new application
   */
  register(app: AppMetadata): void {
    this.apps.set(app.id, {
      ...app,
      requiresAuth: app.requiresAuth ?? false,
      createdAt: app.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  }

  /**
   * Get all registered applications
   */
  getAll(): AppMetadata[] {
    return Array.from(this.apps.values());
  }

  /**
   * Get applications by category
   */
  getByCategory(category: AppMetadata['category']): AppMetadata[] {
    return this.getAll().filter(app => app.category === category);
  }

  /**
   * Get an application by ID
   */
  getById(id: string): AppMetadata | undefined {
    return this.apps.get(id);
  }

  /**
   * Get an application by route
   */
  getByRoute(route: string): AppMetadata | undefined {
    return this.getAll().find(app => app.route === route);
  }

  /**
   * Search applications by query
   */
  search(query: string): AppMetadata[] {
    const lowerQuery = query.toLowerCase();
    return this.getAll().filter(
      (app) =>
        app.title.toLowerCase().includes(lowerQuery) ||
        app.description.toLowerCase().includes(lowerQuery)
    );
  }
}

// Export singleton instance
export const appRegistry = new AppRegistry();

// Register core applications
appRegistry.register({
  id: 'casino-portal',
  title: 'Casino Portal',
  description: 'Enter the realm of infinite games',
  icon: '🎮',
  route: '/portal',
  type: 'internal',
  category: 'portal',
  minLevel: 1,
  requiresAuth: false,
});

appRegistry.register({
  id: 'drc369-studio',
  title: 'DRC-369 Studio',
  description: 'Create, manage, and explore DRC-369 assets',
  icon: '🎨',
  route: '/create',
  url: process.env.NEXT_PUBLIC_NFT_PORTAL_URL || 'http://localhost:4000',
  type: 'embedded',
  category: 'nft',
  minLevel: 1,
  requiresAuth: false,
});

appRegistry.register({
  id: 'marketplace',
  title: 'Marketplace',
  description: 'Discover DRC-369 assets & NFTs',
  icon: '🛒',
  route: '/marketplace',
  type: 'internal',
  category: 'marketplace',
  minLevel: 1,
  requiresAuth: false,
});

appRegistry.register({
  id: 'social',
  title: 'Social',
  description: 'Connect with the Pantheon',
  icon: '🌐',
  route: '/social',
  type: 'internal',
  category: 'social',
  minLevel: 1,
  requiresAuth: false,
});

appRegistry.register({
  id: 'admin',
  title: 'Admin Portal',
  description: 'God-level system control',
  icon: '⚡',
  route: '/admin',
  type: 'internal',
  category: 'admin',
  minLevel: 50, // God level required
  requiresAuth: true,
});
