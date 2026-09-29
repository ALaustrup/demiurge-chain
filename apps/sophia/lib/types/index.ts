// User authentication state
export interface User {
  id: string;
  username: string;
  email: string;
  walletAddress?: string;
  isVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// QOR ID authentication response
export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
  expiresIn: number;
}

// Session data stored in context
export interface Session {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

// Sophia AI message
export interface SophiaMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  systemRecommendation?: string;
  tools?: string[];
}

// System grid item
export interface SystemCard {
  id: string;
  name: string;
  description: string;
  icon: string;
  url: string;
  category: "gaming" | "wallet" | "dev" | "knowledge" | "social" | "admin";
  accessLevel: "public" | "authenticated" | "verified";
  featured: boolean;
}

// Demiurge RPC request/response
export interface DemiurgeRPCRequest {
  jsonrpc: "2.0";
  id: string | number;
  method: string;
  params?: unknown[];
}

export interface DemiurgeRPCResponse<T = unknown> {
  jsonrpc: "2.0";
  id: string | number;
  result?: T;
  error?: {
    code: number;
    message: string;
    data?: unknown;
  };
}
