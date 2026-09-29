// Demiurge Wallet Extension - Provider API
// Injected into web pages as window.demiurge

interface DemiurgeProviderEvents {
  accountsChanged: (accounts: string[]) => void;
  networkChanged: (network: string) => void;
  connect: (info: { chainId: string }) => void;
  disconnect: (error: { code: number; message: string }) => void;
}

type EventCallback<T extends keyof DemiurgeProviderEvents> = DemiurgeProviderEvents[T];

class DemiurgeProvider {
  private eventListeners: Map<string, Set<Function>> = new Map();
  private requestId = 0;
  private pendingRequests: Map<number, { resolve: Function; reject: Function }> = new Map();
  
  public isConnected = false;
  public selectedAddress: string | null = null;
  public chainId: string | null = null;
  public networkVersion: string | null = null;

  constructor() {
    // Listen for messages from content script
    window.addEventListener('message', this.handleMessage.bind(this));
    
    // Initialize connection state
    this.checkConnection();
  }

  private async checkConnection(): Promise<void> {
    try {
      const accounts = await this.request({ method: 'demiurge_accounts' });
      if (accounts && accounts.length > 0) {
        this.isConnected = true;
        this.selectedAddress = accounts[0];
        this.emit('connect', { chainId: this.chainId || 'demiurge-mainnet' });
      }
    } catch (e) {
      // Not connected
    }
  }

  private handleMessage(event: MessageEvent): void {
    // Only accept messages from same origin
    if (event.source !== window) return;
    
    const { type, payload, requestId } = event.data;
    
    if (type === 'DEMIURGE_RESPONSE' && requestId !== undefined) {
      const pending = this.pendingRequests.get(requestId);
      if (pending) {
        this.pendingRequests.delete(requestId);
        if (payload.error) {
          pending.reject(new Error(payload.error.message));
        } else {
          pending.resolve(payload.result);
        }
      }
    } else if (type === 'DEMIURGE_EVENT') {
      this.handleProviderEvent(payload);
    }
  }

  private handleProviderEvent(payload: { event: string; data: any }): void {
    switch (payload.event) {
      case 'accountsChanged':
        const accounts = payload.data as string[];
        this.selectedAddress = accounts[0] || null;
        this.emit('accountsChanged', accounts);
        break;
      case 'networkChanged':
        this.chainId = payload.data;
        this.networkVersion = payload.data;
        this.emit('networkChanged', payload.data);
        break;
      case 'disconnect':
        this.isConnected = false;
        this.selectedAddress = null;
        this.emit('disconnect', { code: 4900, message: 'Disconnected' });
        break;
    }
  }

  // Request method - main RPC interface
  async request(args: { method: string; params?: any[] }): Promise<any> {
    const id = ++this.requestId;
    
    return new Promise((resolve, reject) => {
      this.pendingRequests.set(id, { resolve, reject });
      
      // Send message to content script
      window.postMessage({
        type: 'DEMIURGE_REQUEST',
        requestId: id,
        payload: {
          method: args.method,
          params: args.params || [],
        },
      }, '*');

      // Timeout after 60 seconds
      setTimeout(() => {
        if (this.pendingRequests.has(id)) {
          this.pendingRequests.delete(id);
          reject(new Error('Request timeout'));
        }
      }, 60000);
    });
  }

  // Connect to the wallet
  async connect(): Promise<string[]> {
    const accounts = await this.request({ method: 'demiurge_requestAccounts' });
    if (accounts && accounts.length > 0) {
      this.isConnected = true;
      this.selectedAddress = accounts[0];
      this.emit('connect', { chainId: this.chainId || 'demiurge-mainnet' });
    }
    return accounts;
  }

  // Disconnect from the wallet
  async disconnect(): Promise<void> {
    await this.request({ method: 'demiurge_disconnect' });
    this.isConnected = false;
    this.selectedAddress = null;
    this.emit('disconnect', { code: 4900, message: 'User disconnected' });
  }

  // Get connected accounts
  async getAccounts(): Promise<string[]> {
    return this.request({ method: 'demiurge_accounts' });
  }

  // Get balance
  async getBalance(address?: string): Promise<string> {
    return this.request({ 
      method: 'demiurge_getBalance', 
      params: [address || this.selectedAddress] 
    });
  }

  // Sign a message
  async signMessage(message: string, address?: string): Promise<string> {
    return this.request({
      method: 'demiurge_signMessage',
      params: [message, address || this.selectedAddress],
    });
  }

  // Sign a transaction (returns signed tx for external submission)
  async signTransaction(transaction: {
    to: string;
    value: string;
    data?: string;
  }): Promise<{ tx: string; signature: string }> {
    return this.request({
      method: 'demiurge_signTransaction',
      params: [transaction],
    });
  }

  // Sign and send a transaction
  async sendTransaction(transaction: {
    to: string;
    value: string;
    data?: string;
  }): Promise<string> {
    return this.request({
      method: 'demiurge_sendTransaction',
      params: [transaction],
    });
  }

  // Get chain ID
  async getChainId(): Promise<string> {
    const chainId = await this.request({ method: 'demiurge_chainId' });
    this.chainId = chainId;
    return chainId;
  }

  // Get current network
  async getNetwork(): Promise<{ chainId: string; name: string }> {
    return this.request({ method: 'demiurge_network' });
  }

  // Event handling
  on<T extends keyof DemiurgeProviderEvents>(
    event: T,
    callback: EventCallback<T>
  ): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }
    this.eventListeners.get(event)!.add(callback);
  }

  off<T extends keyof DemiurgeProviderEvents>(
    event: T,
    callback: EventCallback<T>
  ): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.delete(callback);
    }
  }

  once<T extends keyof DemiurgeProviderEvents>(
    event: T,
    callback: EventCallback<T>
  ): void {
    const wrappedCallback = ((...args: any[]) => {
      this.off(event, wrappedCallback as EventCallback<T>);
      (callback as Function)(...args);
    }) as EventCallback<T>;
    this.on(event, wrappedCallback);
  }

  private emit(event: string, data: any): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach(callback => {
        try {
          callback(data);
        } catch (e) {
          console.error('Demiurge provider event handler error:', e);
        }
      });
    }
  }

  // Legacy methods for compatibility
  enable(): Promise<string[]> {
    return this.connect();
  }

  send(method: string, params?: any[]): Promise<any> {
    return this.request({ method, params });
  }

  // Check if Demiurge wallet
  isDemiurge = true;
  isMetaMask = false;
}

// Create and inject the provider
const provider = new DemiurgeProvider();

// Inject into window
declare global {
  interface Window {
    demiurge: DemiurgeProvider;
  }
}

Object.defineProperty(window, 'demiurge', {
  value: provider,
  writable: false,
  configurable: false,
});

// Announce provider availability
window.dispatchEvent(new Event('demiurge#initialized'));

// Also dispatch EIP-6963 style event for wallet discovery
window.dispatchEvent(new CustomEvent('eip6963:announceProvider', {
  detail: {
    info: {
      uuid: 'demiurge-wallet-extension',
      name: 'Demiurge Wallet',
      icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="45" fill="%23FF6B00"/><text x="50" y="65" font-size="40" text-anchor="middle" fill="white">D</text></svg>',
      rdns: 'io.demiurge.wallet',
    },
    provider: provider,
  },
}));

console.log('Demiurge Wallet: Provider injected');
