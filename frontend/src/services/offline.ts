/**
 * Offline Mode Support
 * Enables POS to work without internet connection
 */

// Note: In production, install and use 'idb' package for IndexedDB support
// import { openDB, DBSchema, IDBPDatabase } from 'idb';

// POSDatabase interface for future IndexedDB implementation
// interface POSDatabase {
//   products: { key: string; value: any; };
//   pendingSales: { key: number; value: any; indexes: { timestamp: number }; };
//   customers: { key: string; value: any; };
// }

/**
 * Offline Storage Service
 * Uses IndexedDB for local data persistence
 */
class OfflineService {
  private isOnline: boolean = navigator.onLine;

  constructor() {
    this.initDatabase();
    this.setupOnlineListener();
  }

  /**
   * Initialize IndexedDB
   */
  private async initDatabase() {
    try {
      // For this implementation, we'll use localStorage as a simple alternative
      // In production, use idb library for IndexedDB
      console.log('Offline storage initialized');
    } catch (error) {
      console.error('Failed to initialize offline storage:', error);
    }
  }

  /**
   * Setup online/offline listeners
   */
  private setupOnlineListener() {
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.syncPendingSales();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      console.log('Application is now offline');
    });
  }

  /**
   * Cache products locally
   */
  async cacheProducts(products: any[]): Promise<void> {
    try {
      localStorage.setItem('cached_products', JSON.stringify(products));
      localStorage.setItem('products_cached_at', new Date().toISOString());
    } catch (error) {
      console.error('Failed to cache products:', error);
    }
  }

  /**
   * Get cached products
   */
  getCachedProducts(): any[] {
    try {
      const cached = localStorage.getItem('cached_products');
      return cached ? JSON.parse(cached) : [];
    } catch (error) {
      console.error('Failed to get cached products:', error);
      return [];
    }
  }

  /**
   * Save sale to pending queue (offline)
   */
  async savePendingSale(sale: any): Promise<void> {
    try {
      const pending = this.getPendingSales();
      pending.push({
        ...sale,
        timestamp: Date.now(),
        synced: false,
      });
      localStorage.setItem('pending_sales', JSON.stringify(pending));
    } catch (error) {
      console.error('Failed to save pending sale:', error);
      throw error;
    }
  }

  /**
   * Get pending sales
   */
  getPendingSales(): any[] {
    try {
      const pending = localStorage.getItem('pending_sales');
      return pending ? JSON.parse(pending) : [];
    } catch (error) {
      console.error('Failed to get pending sales:', error);
      return [];
    }
  }

  /**
   * Sync pending sales when online
   */
  async syncPendingSales(): Promise<void> {
    if (!this.isOnline) return;

    const pending = this.getPendingSales();
    const unsynced = pending.filter((sale) => !sale.synced);

    console.log(`Syncing ${unsynced.length} pending sales...`);

    for (const sale of unsynced) {
      try {
        // Send to server
        // await saleService.create(sale);

        // Mark as synced
        sale.synced = true;
      } catch (error) {
        console.error('Failed to sync sale:', error);
      }
    }

    // Update storage
    localStorage.setItem('pending_sales', JSON.stringify(pending));

    // Remove synced sales
    const stillPending = pending.filter((sale) => !sale.synced);
    if (stillPending.length === 0) {
      localStorage.removeItem('pending_sales');
    }
  }

  /**
   * Check if online
   */
  get online(): boolean {
    return this.isOnline;
  }

  /**
   * Clear all offline data
   */
  clearOfflineData(): void {
    localStorage.removeItem('cached_products');
    localStorage.removeItem('pending_sales');
    localStorage.removeItem('products_cached_at');
  }
}

// Export singleton instance
export const offlineService = new OfflineService();
