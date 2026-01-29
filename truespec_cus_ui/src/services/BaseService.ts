// ============================================================================
// BASE SERVICE - Abstract service class with common functionality
// ============================================================================

export abstract class BaseService {
  protected isInitialized: boolean = false;
  protected updateInterval: number | null = null;
  protected readonly DEFAULT_UPDATE_INTERVAL = 10000; // 10 seconds

  abstract initialize(): Promise<void>;
  abstract refresh(): Promise<void>;
  abstract dispose(): void;

  startAutoRefresh(interval: number = this.DEFAULT_UPDATE_INTERVAL): void {
    this.stopAutoRefresh();
    this.updateInterval = window.setInterval(() => {
      this.refresh();
    }, interval);
  }

  stopAutoRefresh(): void {
    if (this.updateInterval !== null) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
  }

  protected async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// ============================================================================
// SINGLETON SERVICE - Base class for singleton services
// ============================================================================

export abstract class SingletonService extends BaseService {
  private static instances: Map<string, SingletonService> = new Map();

  protected constructor() {
    super();
  }

  protected static getInstance<T extends SingletonService>(
    this: new () => T,
    key: string
  ): T {
    if (!SingletonService.instances.has(key)) {
      SingletonService.instances.set(key, new this());
    }
    return SingletonService.instances.get(key) as T;
  }
}

