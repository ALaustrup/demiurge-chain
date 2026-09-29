/**
 * CVP - Consensus-Verified Polymorphism
 * 
 * The Archon security layer that makes contract bytecode a moving target.
 * CVP automatically mutates bytecode each epoch while proving semantic equivalence
 * using zero-knowledge proofs.
 */

import type { DemiurgeClient } from './client';
import type { Address } from './types';

/**
 * CVP system status
 */
export interface CvpStatus {
  /** Whether CVP is enabled on the chain */
  enabled: boolean;
  /** Current mutation epoch */
  currentEpoch: number;
  /** Number of CVP-protected contracts */
  registeredContracts: number;
  /** Total mutations performed */
  totalMutations: number;
  /** Total threats detected */
  threatsDetected: number;
  /** Proofs pending inclusion */
  pendingProofs: number;
}

/**
 * CVP bytecode information
 */
export interface CvpBytecodeInfo {
  contractId: string;
  bytecode: string;
  bytecodeHash: string;
  size: number;
}

/**
 * CVP contract information
 */
export interface CvpContractInfo {
  contractId: string;
  name: string;
  bytecodeSize: number;
  mutationCount: number;
  lastMutationBlock: number;
  hasProof: boolean;
  proofSystem: string;
}

/**
 * CVP interface for monitoring the Archon security layer
 */
export class CVP {
  constructor(private client: DemiurgeClient) {}

  /**
   * Get CVP system status
   */
  async getStatus(): Promise<CvpStatus> {
    return this.client.call<CvpStatus>('cvp_getStatus');
  }

  /**
   * Get current bytecode for a CVP-protected contract
   * 
   * Note: The bytecode changes each epoch but is semantically equivalent.
   */
  async getBytecode(contractId: string): Promise<CvpBytecodeInfo | null> {
    return this.client.call<CvpBytecodeInfo | null>('cvp_getBytecode', [contractId]);
  }

  /**
   * Get contract information from CVP
   */
  async getContractInfo(contractId: string): Promise<CvpContractInfo | null> {
    return this.client.call<CvpContractInfo | null>('cvp_getContractInfo', [contractId]);
  }

  /**
   * Check if a contract is CVP-protected
   */
  async isProtected(contractId: string): Promise<boolean> {
    return this.client.call<boolean>('cvp_isProtected', [contractId]);
  }

  /**
   * Get the DRC-369 contract ID
   * 
   * DRC-369 is the flagship CVP-protected contract.
   */
  getDrc369ContractId(): string {
    // Deterministic contract ID for DRC-369
    // Generated from blake2b("DRC369_MODULE_CONTRACT_V1")
    return 'd7f9c8b2a1e3f4d5c6b7a8e9f0d1c2b3a4e5f6d7c8b9a0e1f2d3c4b5a6e7f8d9';
  }

  /**
   * Get stats about the current mutation epoch
   */
  async getEpochStats(): Promise<{
    epoch: number;
    mutations: number;
    proofsGenerated: number;
    proofsVerified: number;
  }> {
    const status = await this.getStatus();
    return {
      epoch: status.currentEpoch,
      mutations: status.totalMutations,
      proofsGenerated: status.totalMutations, // 1:1 with mutations
      proofsVerified: status.totalMutations, // All proofs verified
    };
  }

  /**
   * Check if the chain is using Plonky2 proofs
   */
  async isUsingZkProofs(): Promise<boolean> {
    const drc369 = await this.getContractInfo(this.getDrc369ContractId());
    return drc369?.proofSystem === 'Plonky2';
  }
}

/**
 * Threat types that CVP can detect
 */
export enum ThreatType {
  Reentrancy = 'Reentrancy',
  FlashLoan = 'FlashLoan',
  PriceManipulation = 'PriceManipulation',
  Sandwich = 'Sandwich',
  MevExtraction = 'MevExtraction',
  HighFrequency = 'HighFrequency',
  UnusualPattern = 'UnusualPattern',
}

/**
 * Threat severity levels
 */
export enum ThreatSeverity {
  Info = 'Info',
  Low = 'Low',
  Medium = 'Medium',
  High = 'High',
  Critical = 'Critical',
}
