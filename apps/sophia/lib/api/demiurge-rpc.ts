import axios from "axios";
import type { DemiurgeRPCRequest, DemiurgeRPCResponse } from "@lib/types/index";

const rpcUrl = process.env.NEXT_PUBLIC_DEMIURGE_RPC_URL || "http://localhost:9944";

class DemiurgeRPCClient {
  private url: string;
  private requestId: number = 0;

  constructor(url: string = rpcUrl) {
    this.url = url;
  }

  private getRequestId(): string {
    return `sophia-${++this.requestId}-${Date.now()}`;
  }

  async call<T = unknown>(method: string, params: unknown[] = []): Promise<T> {
    const request: DemiurgeRPCRequest = {
      jsonrpc: "2.0",
      id: this.getRequestId(),
      method,
      params,
    };

    try {
      const response = await axios.post<DemiurgeRPCResponse<T>>(
        this.url,
        request,
        {
          headers: {
            "Content-Type": "application/json",
          },
          timeout: 10000,
        }
      );

      if (response.data.error) {
        throw new Error(
          `RPC Error: ${response.data.error.message} (Code: ${response.data.error.code})`
        );
      }

      return response.data.result as T;
    } catch (error) {
      console.error(`DemiurgeRPC call failed for method ${method}:`, error);
      throw error;
    }
  }

  // System health check
  async health(): Promise<{ isSyncing: boolean; peers: number; version: string }> {
    return this.call("system_health");
  }

  // Get account balance
  async getBalance(accountId: string): Promise<string> {
    return this.call("state_getStorageAt", [
      `0x${Buffer.from(`balances:${accountId}`).toString("hex")}`,
      null,
    ]);
  }

  // Query blockchain state
  async queryState(key: string): Promise<unknown> {
    return this.call("state_getStorage", [key]);
  }
}

export const demiurgeRpc = new DemiurgeRPCClient();
