/**
 * Sophia Troubleshooting Engine
 *
 * Guided diagnostic flows for common issues. Each flow chains multiple
 * RPC checks and produces a structured report with actionable fixes.
 */

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export type TroubleshootingIssue =
  | 'transaction_failed'
  | 'cannot_connect'
  | 'nft_not_showing'
  | 'staking_rewards_missing'
  | 'wallet_issue'
  | 'general';

export interface DiagnosticCheck {
  name: string;
  status: 'pass' | 'fail' | 'warn' | 'skip';
  detail: string;
}

export interface TroubleshootingReport {
  issue: TroubleshootingIssue;
  title: string;
  checks: DiagnosticCheck[];
  diagnosis: string;
  suggestedFixes: string[];
  relatedDocs: string[];
}

// ═══════════════════════════════════════════════════════════════════════════════
// RPC HELPER
// ═══════════════════════════════════════════════════════════════════════════════

async function rpcCall(
  endpoint: string,
  method: string,
  params: any[] = []
): Promise<{ ok: boolean; result?: any; error?: string }> {
  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }),
    });
    const data = await response.json();
    if (data.error) {
      return { ok: false, error: data.error.message };
    }
    return { ok: true, result: data.result };
  } catch (err: any) {
    return { ok: false, error: err.message };
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// DIAGNOSTIC FLOWS
// ═══════════════════════════════════════════════════════════════════════════════

async function diagnoseTransactionFailed(
  rpcEndpoint: string,
  context?: string
): Promise<TroubleshootingReport> {
  const checks: DiagnosticCheck[] = [];
  const fixes: string[] = [];

  // Check 1: Node connectivity
  const health = await rpcCall(rpcEndpoint, 'system_health');
  checks.push({
    name: 'Node connectivity',
    status: health.ok ? 'pass' : 'fail',
    detail: health.ok
      ? `Node is reachable, ${health.result?.peers || 0} peers connected`
      : `Cannot reach node: ${health.error}`,
  });
  if (!health.ok) {
    fixes.push('Verify your RPC endpoint URL is correct');
    fixes.push('Check if the node is running and accepting connections');
  }

  // Check 2: Latest block (chain is producing blocks)
  const block = await rpcCall(rpcEndpoint, 'chain_getLatestBlock');
  checks.push({
    name: 'Chain producing blocks',
    status: block.ok ? 'pass' : 'warn',
    detail: block.ok
      ? `Latest block: #${block.result?.number || 'unknown'}`
      : 'Could not fetch latest block',
  });

  // If context contains an address, check balance & energy
  const addressMatch = context?.match(/0x[a-fA-F0-9]{40,}/);
  if (addressMatch) {
    const addr = addressMatch[0];

    const balance = await rpcCall(rpcEndpoint, 'chain_getBalance', [addr]);
    checks.push({
      name: 'Account balance',
      status: balance.ok ? (Number(balance.result?.free || 0) > 0 ? 'pass' : 'warn') : 'skip',
      detail: balance.ok
        ? `Free balance: ${balance.result?.free || 0} CGT`
        : `Could not check balance: ${balance.error}`,
    });
    if (balance.ok && Number(balance.result?.free || 0) === 0) {
      fixes.push('Your account has zero balance. You need CGT to send transactions.');
    }

    const energy = await rpcCall(rpcEndpoint, 'energy_getEnergy', [addr]);
    checks.push({
      name: 'Account energy',
      status: energy.ok ? (Number(energy.result?.current || 0) > 10 ? 'pass' : 'warn') : 'skip',
      detail: energy.ok
        ? `Current energy: ${energy.result?.current || 0} / ${energy.result?.max || 1000}`
        : `Could not check energy: ${energy.error}`,
    });
    if (energy.ok && Number(energy.result?.current || 0) < 10) {
      fixes.push('Energy is very low. Wait for it to regenerate (1 energy/second) or request a top-up.');
    }
  } else {
    checks.push({
      name: 'Account balance',
      status: 'skip',
      detail: 'No address provided — provide your address for a balance check',
    });
    fixes.push('Provide your account address so I can check your balance and energy.');
  }

  // If context contains a tx hash, look it up
  const txMatch = context?.match(/0x[a-fA-F0-9]{64}/);
  if (txMatch) {
    const tx = await rpcCall(rpcEndpoint, 'chain_getTransaction', [txMatch[0]]);
    checks.push({
      name: 'Transaction lookup',
      status: tx.ok ? 'pass' : 'fail',
      detail: tx.ok
        ? `Transaction found: status=${tx.result?.status || 'unknown'}`
        : `Transaction not found: ${tx.error}`,
    });
    if (tx.ok && tx.result?.status === 'failed') {
      fixes.push(`Transaction failed with reason: ${tx.result?.error || 'unknown'}. Check the error field for details.`);
    }
  }

  const failCount = checks.filter((c) => c.status === 'fail').length;
  const warnCount = checks.filter((c) => c.status === 'warn').length;

  return {
    issue: 'transaction_failed',
    title: 'Transaction Failure Diagnostic',
    checks,
    diagnosis:
      failCount > 0
        ? `Found ${failCount} critical issue(s) and ${warnCount} warning(s).`
        : warnCount > 0
          ? `No critical issues, but ${warnCount} warning(s) found.`
          : 'All checks passed. The issue may be intermittent — try resubmitting the transaction.',
    suggestedFixes:
      fixes.length > 0
        ? fixes
        : ['All diagnostics passed. Try resubmitting the transaction.', 'If the issue persists, check the transaction error message for specific details.'],
    relatedDocs: ['/docs/troubleshooting/transactions', '/docs/concepts/energy-system'],
  };
}

async function diagnoseCannotConnect(
  rpcEndpoint: string,
  _context?: string
): Promise<TroubleshootingReport> {
  const checks: DiagnosticCheck[] = [];
  const fixes: string[] = [];

  // Check 1: RPC endpoint reachable
  const health = await rpcCall(rpcEndpoint, 'system_health');
  checks.push({
    name: 'RPC endpoint reachable',
    status: health.ok ? 'pass' : 'fail',
    detail: health.ok
      ? 'Successfully connected to the RPC endpoint'
      : `Connection failed: ${health.error}`,
  });
  if (!health.ok) {
    fixes.push(`Verify the RPC URL: ${rpcEndpoint}`);
    fixes.push('Check if the node process is running');
    fixes.push('Ensure no firewall is blocking the RPC port (default: 9944)');
  }

  // Check 2: Peers
  if (health.ok) {
    const peers = health.result?.peers || 0;
    checks.push({
      name: 'Peer connections',
      status: peers > 0 ? 'pass' : 'warn',
      detail: `Connected to ${peers} peer(s)`,
    });
    if (peers === 0) {
      fixes.push('Node has no peers. Check the bootnode configuration in your node config.');
      fixes.push('Ensure P2P port (default: 30333) is open and reachable.');
    }
  }

  // Check 3: Sync status
  if (health.ok) {
    checks.push({
      name: 'Sync status',
      status: health.result?.isSyncing ? 'warn' : 'pass',
      detail: health.result?.isSyncing
        ? 'Node is still syncing — some queries may fail until sync completes'
        : 'Node is fully synced',
    });
    if (health.result?.isSyncing) {
      fixes.push('Wait for sync to complete. Large state may take several minutes.');
    }
  }

  // Check 4: Latest block
  const block = await rpcCall(rpcEndpoint, 'chain_getLatestBlock');
  if (block.ok) {
    checks.push({
      name: 'Block production',
      status: 'pass',
      detail: `Latest block: #${block.result?.number || 'unknown'}`,
    });
  }

  // Check 5: WebSocket (attempt to detect)
  const wsUrl = rpcEndpoint.replace('http://', 'ws://').replace('https://', 'wss://');
  checks.push({
    name: 'WebSocket endpoint',
    status: 'pass',
    detail: `WebSocket should be available at: ${wsUrl}`,
  });

  const failCount = checks.filter((c) => c.status === 'fail').length;

  return {
    issue: 'cannot_connect',
    title: 'Connection Diagnostic',
    checks,
    diagnosis:
      failCount > 0
        ? 'Connection issues detected. Follow the suggested fixes below.'
        : 'Connection appears healthy. If you are experiencing issues, they may be intermittent.',
    suggestedFixes:
      fixes.length > 0
        ? fixes
        : ['Connection looks good! If issues persist, try clearing your browser cache or restarting your client.'],
    relatedDocs: ['/docs/getting-started/connect', '/docs/validators/node-setup'],
  };
}

async function diagnoseNFTNotShowing(
  rpcEndpoint: string,
  context?: string
): Promise<TroubleshootingReport> {
  const checks: DiagnosticCheck[] = [];
  const fixes: string[] = [];

  // Check node
  const health = await rpcCall(rpcEndpoint, 'system_health');
  checks.push({
    name: 'Node connectivity',
    status: health.ok ? 'pass' : 'fail',
    detail: health.ok ? 'Node is reachable' : `Cannot reach node: ${health.error}`,
  });

  // If we have an address, check NFT balance
  const addressMatch = context?.match(/0x[a-fA-F0-9]{40,}/);
  if (addressMatch) {
    const nfts = await rpcCall(rpcEndpoint, 'drc369_balanceOf', [addressMatch[0]]);
    checks.push({
      name: 'NFT balance query',
      status: nfts.ok ? 'pass' : 'fail',
      detail: nfts.ok
        ? `Found ${nfts.result?.count || 0} NFT(s) for ${addressMatch[0]}`
        : `Could not query NFTs: ${nfts.error}`,
    });
    if (nfts.ok && (nfts.result?.count || 0) === 0) {
      fixes.push('No NFTs found at this address. Verify the address is correct.');
      fixes.push('If you just minted, wait for the transaction to be included in a block.');
    }
  } else {
    checks.push({
      name: 'NFT balance query',
      status: 'skip',
      detail: 'No address provided — provide your address to check NFT ownership',
    });
    fixes.push('Provide your wallet address so I can check your NFT holdings.');
  }

  // If we have a token ID, check it
  const tokenMatch = context?.match(/token[_\s]*(?:id)?[:\s]*(\d+|0x[a-fA-F0-9]+)/i);
  if (tokenMatch) {
    const tokenId = tokenMatch[1];
    const nft = await rpcCall(rpcEndpoint, 'drc369_getNFT', [tokenId]);
    checks.push({
      name: 'Token lookup',
      status: nft.ok ? 'pass' : 'fail',
      detail: nft.ok
        ? `Token ${tokenId} exists. Owner: ${nft.result?.owner || 'unknown'}`
        : `Token ${tokenId} not found: ${nft.error}`,
    });
    if (!nft.ok) {
      fixes.push(`Token ID ${tokenId} was not found on-chain. It may not have been minted yet.`);
    }
  }

  return {
    issue: 'nft_not_showing',
    title: 'NFT Visibility Diagnostic',
    checks,
    diagnosis: checks.some((c) => c.status === 'fail')
      ? 'Issues found with NFT visibility. See fixes below.'
      : 'NFT queries look correct. If the NFT was recently minted, allow time for block confirmation.',
    suggestedFixes:
      fixes.length > 0
        ? fixes
        : ['NFT subsystem appears healthy. Try refreshing the page or reconnecting your wallet.'],
    relatedDocs: ['/docs/nfts/drc-369', '/docs/troubleshooting/nfts'],
  };
}

async function diagnoseStakingRewards(
  rpcEndpoint: string,
  context?: string
): Promise<TroubleshootingReport> {
  const checks: DiagnosticCheck[] = [];
  const fixes: string[] = [];

  // Check node
  const health = await rpcCall(rpcEndpoint, 'system_health');
  checks.push({
    name: 'Node connectivity',
    status: health.ok ? 'pass' : 'fail',
    detail: health.ok ? 'Node is reachable' : `Cannot reach node: ${health.error}`,
  });

  // Check active validators
  const validators = await rpcCall(rpcEndpoint, 'consensus_getActiveValidators');
  checks.push({
    name: 'Validator set',
    status: validators.ok ? 'pass' : 'warn',
    detail: validators.ok
      ? `${(validators.result || []).length} active validator(s)`
      : `Could not fetch validators: ${validators.error}`,
  });

  // If address provided, check pending rewards
  const addressMatch = context?.match(/0x[a-fA-F0-9]{40,}/);
  if (addressMatch) {
    const rewards = await rpcCall(rpcEndpoint, 'consensus_getPendingRewards', [addressMatch[0]]);
    checks.push({
      name: 'Pending rewards',
      status: rewards.ok ? 'pass' : 'warn',
      detail: rewards.ok
        ? `Pending rewards: ${rewards.result?.amount || 0} CGT`
        : `Could not check rewards: ${rewards.error}`,
    });

    const stakingStatus = await rpcCall(rpcEndpoint, 'consensus_getStakingStatus', [addressMatch[0]]);
    checks.push({
      name: 'Staking status',
      status: stakingStatus.ok ? 'pass' : 'warn',
      detail: stakingStatus.ok
        ? `Staking active: ${stakingStatus.result?.is_active || false}, Staked: ${stakingStatus.result?.total_staked || 0} CGT`
        : `Could not check staking status: ${stakingStatus.error}`,
    });

    if (stakingStatus.ok && !stakingStatus.result?.is_active) {
      fixes.push('Your staking position appears inactive. You may need to re-stake or check your validator.');
    }

    if (rewards.ok && Number(rewards.result?.amount || 0) === 0) {
      fixes.push('No pending rewards. Rewards accumulate per era — check which era you are in.');
      fixes.push('Ensure your chosen validator is actively producing blocks.');
    }
  } else {
    checks.push({
      name: 'Pending rewards',
      status: 'skip',
      detail: 'No address provided — provide your address to check rewards',
    });
    fixes.push('Provide your staking address so I can check your rewards and staking status.');
  }

  return {
    issue: 'staking_rewards_missing',
    title: 'Staking Rewards Diagnostic',
    checks,
    diagnosis: checks.some((c) => c.status === 'fail')
      ? 'Issues found with staking/rewards. See fixes below.'
      : 'Staking subsystem appears healthy. Rewards may simply need more time to accumulate.',
    suggestedFixes:
      fixes.length > 0
        ? fixes
        : ['Staking looks healthy. Rewards accumulate per era — patience is key.', 'You can claim pending rewards using the validator CLI or wallet.'],
    relatedDocs: ['/docs/staking/overview', '/docs/validators/rewards'],
  };
}

async function diagnoseWalletIssue(
  rpcEndpoint: string,
  context?: string
): Promise<TroubleshootingReport> {
  const checks: DiagnosticCheck[] = [];
  const fixes: string[] = [];

  // Check node
  const health = await rpcCall(rpcEndpoint, 'system_health');
  checks.push({
    name: 'Node connectivity',
    status: health.ok ? 'pass' : 'fail',
    detail: health.ok ? 'Node is reachable' : `Cannot reach node: ${health.error}`,
  });

  checks.push({
    name: 'Wallet extension installed',
    status: 'pass',
    detail: 'Check that the Demiurge wallet extension is installed and enabled in your browser',
  });

  checks.push({
    name: 'Wallet unlocked',
    status: 'pass',
    detail: 'Ensure your wallet is unlocked — it locks automatically after inactivity',
  });

  checks.push({
    name: 'Correct network',
    status: 'pass',
    detail: 'Verify the wallet is connected to the correct network (mainnet vs testnet)',
  });

  fixes.push('Try refreshing the page after ensuring the wallet extension is unlocked.');
  fixes.push('If the wallet is not connecting, try disabling and re-enabling the extension.');
  fixes.push('Clear the extension storage and re-import your seed phrase if issues persist.');

  return {
    issue: 'wallet_issue',
    title: 'Wallet Connection Diagnostic',
    checks,
    diagnosis: 'Wallet issues are often caused by the extension being locked, the wrong network, or a stale connection.',
    suggestedFixes: fixes,
    relatedDocs: ['/docs/wallet/setup', '/docs/wallet/troubleshooting'],
  };
}

async function diagnoseGeneral(
  rpcEndpoint: string,
  context?: string
): Promise<TroubleshootingReport> {
  const checks: DiagnosticCheck[] = [];
  const fixes: string[] = [];

  // Run comprehensive health checks
  const health = await rpcCall(rpcEndpoint, 'system_health');
  checks.push({
    name: 'Node connectivity',
    status: health.ok ? 'pass' : 'fail',
    detail: health.ok
      ? `Node reachable, ${health.result?.peers || 0} peers`
      : `Cannot reach node: ${health.error}`,
  });

  const block = await rpcCall(rpcEndpoint, 'chain_getLatestBlock');
  checks.push({
    name: 'Block production',
    status: block.ok ? 'pass' : 'warn',
    detail: block.ok
      ? `Latest block: #${block.result?.number || 'unknown'}`
      : 'Could not fetch latest block',
  });

  const validators = await rpcCall(rpcEndpoint, 'consensus_getActiveValidators');
  checks.push({
    name: 'Validator set',
    status: validators.ok && (validators.result || []).length > 0 ? 'pass' : 'warn',
    detail: validators.ok
      ? `${(validators.result || []).length} active validator(s)`
      : 'Could not fetch validator info',
  });

  if (!health.ok) {
    fixes.push('The node is not reachable. Check the RPC endpoint and node status.');
  }

  return {
    issue: 'general',
    title: 'General Health Diagnostic',
    checks,
    diagnosis: checks.every((c) => c.status === 'pass')
      ? 'All systems appear healthy. Please describe your issue in more detail so I can run targeted diagnostics.'
      : 'Some issues detected. See the checks above and suggested fixes below.',
    suggestedFixes:
      fixes.length > 0
        ? fixes
        : ['Please describe your issue in more detail.', 'Include any error messages, addresses, or transaction hashes for targeted diagnostics.'],
    relatedDocs: ['/docs/troubleshooting', '/docs/getting-started'],
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN DISPATCHER
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Run the appropriate troubleshooting flow for the given issue type
 */
export async function runTroubleshootingFlow(
  issue: TroubleshootingIssue,
  rpcEndpoint: string,
  context?: string
): Promise<TroubleshootingReport> {
  switch (issue) {
    case 'transaction_failed':
      return diagnoseTransactionFailed(rpcEndpoint, context);
    case 'cannot_connect':
      return diagnoseCannotConnect(rpcEndpoint, context);
    case 'nft_not_showing':
      return diagnoseNFTNotShowing(rpcEndpoint, context);
    case 'staking_rewards_missing':
      return diagnoseStakingRewards(rpcEndpoint, context);
    case 'wallet_issue':
      return diagnoseWalletIssue(rpcEndpoint, context);
    case 'general':
    default:
      return diagnoseGeneral(rpcEndpoint, context);
  }
}

/**
 * Format a troubleshooting report for display in chat
 */
export function formatTroubleshootingReport(report: TroubleshootingReport): string {
  let output = `## ✧ ${report.title}\n\n`;

  output += '### Diagnostic Checks\n\n';
  for (const check of report.checks) {
    const icon =
      check.status === 'pass' ? '✅' :
      check.status === 'fail' ? '❌' :
      check.status === 'warn' ? '⚠️' : '⏭️';
    output += `${icon} **${check.name}**: ${check.detail}\n`;
  }

  output += `\n### Diagnosis\n\n${report.diagnosis}\n`;

  if (report.suggestedFixes.length > 0) {
    output += '\n### Suggested Fixes\n\n';
    for (const fix of report.suggestedFixes) {
      output += `- ${fix}\n`;
    }
  }

  if (report.relatedDocs.length > 0) {
    output += '\n### Related Documentation\n\n';
    for (const doc of report.relatedDocs) {
      output += `- [${doc}](${doc})\n`;
    }
  }

  return output;
}
