// Demiurge Wallet Extension - Message Types for Communication

import type { Account, TransactionRequest, NetworkConfig, PendingRequest } from './types';

// Message types for communication between content script, background, and popup

export type MessageType =
  // Wallet lifecycle
  | 'WALLET_INIT'
  | 'WALLET_LOCK'
  | 'WALLET_UNLOCK'
  | 'WALLET_CREATE'
  | 'WALLET_IMPORT'
  | 'WALLET_GET_STATE'
  
  // Account management
  | 'ACCOUNT_CREATE'
  | 'ACCOUNT_SELECT'
  | 'ACCOUNT_GET_ALL'
  | 'ACCOUNT_REMOVE'
  
  // QOR ID Auth
  | 'AUTH_LOGIN'
  | 'AUTH_KEYPAIR_LOGIN'
  | 'AUTH_LOGOUT'
  | 'AUTH_GET_SESSION'
  | 'DETACH_WALLET'
  
  // Network
  | 'NETWORK_SWITCH'
  | 'NETWORK_GET_CURRENT'
  
  // Transactions & signing
  | 'SIGN_MESSAGE'
  | 'SIGN_TRANSACTION'
  | 'SEND_TRANSACTION'
  | 'GET_BALANCE'
  | 'CLAIM_STARTER_TOKENS'
  | 'EXPORT_PRIVATE_KEY'
  | 'CHECK_TRANSFER_POLICY'
  | 'GET_ACCOUNT_LIMITS'
  
  // dApp connection
  | 'DAPP_CONNECT'
  | 'DAPP_DISCONNECT'
  | 'DAPP_GET_ACCOUNTS'
  
  // Request handling
  | 'REQUEST_APPROVE'
  | 'REQUEST_REJECT'
  | 'REQUEST_GET_PENDING'
  | 'GET_PENDING_REQUESTS'
  | 'APPROVE_REQUEST'
  | 'REJECT_REQUEST'

  // Sophia AI
  | 'SOPHIA_QUERY'

  // Page context (for side panel)
  | 'GET_PAGE_CONTEXT'
  | 'PAGE_CONTEXT_RESULT'

  // Content capture
  | 'SAVE_NOTE'
  | 'GET_NOTES'
  | 'DELETE_NOTE'
  | 'SAVE_MEDIA'
  | 'GET_MEDIA'

  // VYB Chat (handled via side panel UI directly)
  ;

export interface Message<T = any> {
  type: MessageType;
  payload?: T;
  requestId?: string;
  origin?: string;
}

export interface MessageResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

// Payload types for specific messages

export interface WalletCreatePayload {
  password: string;
  mnemonic?: string; // If not provided, generate new
}

export interface WalletImportPayload {
  password: string;
  mnemonic: string;
}

export interface WalletUnlockPayload {
  password: string;
}

export interface AccountCreatePayload {
  name: string;
}

export interface SignMessagePayload {
  message: string;
  account?: string;
}

export interface SignTransactionPayload {
  transaction: TransactionRequest;
  account?: string;
}

export interface SendTransactionPayload {
  transaction: TransactionRequest;
  account?: string;
}

export interface DAppConnectPayload {
  origin: string;
}

export interface RequestApprovePayload {
  requestId: string;
}

export interface RequestRejectPayload {
  requestId: string;
  reason?: string;
}

export interface SophiaQueryPayload {
  message: string;
  conversationHistory?: Array<{ role: string; content: string }>;
  context?: {
    currentPage?: string;
    pageTitle?: string;
    selectedText?: string;
    connectedDapp?: string;
  };
}

export interface SophiaQueryResponse {
  text: string;
  toolsUsed?: number;
}

// QOR ID Auth payloads
export interface AuthLoginPayload {
  identifier: string; // QOR ID (e.g. "username#1234") or email
  password: string;
}

export interface AuthKeypairLoginPayload {
  address: string;
  signature: string;
  challenge: string;
}

export interface AuthSessionResponse {
  isAuthenticated: boolean;
  token?: string;
  user?: {
    qorId: string;
    address?: string;
    displayName?: string;
  };
}

// Content capture payloads
export interface SaveNotePayload {
  title: string;
  content: string;
  url?: string;
  tags?: string[];
}

export interface SaveMediaPayload {
  url: string;
  title?: string;
  sourceUrl: string;
  type: 'image' | 'link';
}

// Response types

export interface WalletStateResponse {
  isLocked: boolean;
  isInitialized: boolean;
  accounts: Account[];
  activeAccount: string | null;
  network: string;
  pendingRequestCount: number;
  auth?: {
    isAuthenticated: boolean;
    token: string | null;
    user: { qorId: string; address?: string; displayName?: string } | null;
  };
}

export interface BalanceResponse {
  balance: string;
  formatted: string;
}

export interface SignatureResponse {
  signature: string;
}

export interface TransactionResponse {
  hash: string;
  status: 'pending' | 'confirmed' | 'failed';
}

// Helper to create messages
export function createMessage<T>(type: MessageType, payload?: T, requestId?: string): Message<T> {
  return {
    type,
    payload,
    requestId: requestId || crypto.randomUUID(),
  };
}

// Helper to create responses
export function createResponse<T>(success: boolean, data?: T, error?: string): MessageResponse<T> {
  return { success, data, error };
}
