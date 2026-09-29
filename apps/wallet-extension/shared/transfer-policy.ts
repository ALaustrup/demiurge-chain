// Demiurge Wallet Extension - CGT Transfer Policy
// Enforces anti-abuse rules for sending and receiving CGT

export interface TransferPolicyResult {
  allowed: boolean;
  reason?: string;
  cooldownSeconds?: number;
}

export interface AccountActivity {
  createdAt: number;           // Account creation timestamp (ms)
  totalTransfersSent: number;  // Lifetime sends
  totalTransfersReceived: number;
  transfersToday: number;      // Sends in the last 24h
  transfersThisHour: number;   // Sends in the last 60 min
  lastTransferAt: number;      // Timestamp of last send (ms)
  uniqueRecipients: string[];  // Addresses sent to (last 7 days)
  flagged: boolean;            // If the account has been flagged for review
}

// --- Policy Constants ---

/** Minimum account age (ms) before any outbound transfer is allowed */
const MIN_ACCOUNT_AGE_MS = 24 * 60 * 60 * 1000; // 24 hours

/** Max outbound transfers per day for accounts < 7 days old */
const DAILY_LIMIT_NEW = 3;

/** Max outbound transfers per day for accounts >= 7 days old */
const DAILY_LIMIT_ESTABLISHED = 25;

/** Account age threshold to be considered "established" */
const ESTABLISHED_AGE_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

/** Max transfers per hour (burst protection) */
const HOURLY_LIMIT = 5;

/** Minimum seconds between consecutive transfers */
const MIN_TRANSFER_INTERVAL_SEC = 30;

/** Maximum single transfer amount for new accounts (in base units, 1 CGT = 1e18) */
const MAX_SINGLE_NEW = BigInt('100000000000000000000'); // 100 CGT

/** Maximum single transfer amount for established accounts */
const MAX_SINGLE_ESTABLISHED = BigInt('10000000000000000000000'); // 10,000 CGT

/** Max unique recipients per day for new accounts (anti-multi-account farming) */
const MAX_UNIQUE_RECIPIENTS_NEW = 2;

/** Max unique recipients per day for established accounts */
const MAX_UNIQUE_RECIPIENTS_ESTABLISHED = 15;

/** Minimum transfer amount (prevents dust spam) */
const MIN_TRANSFER_AMOUNT = BigInt('1000000000000000'); // 0.001 CGT

/** Minimum balance the sender must retain after transfer + fee */
const MIN_RETAIN_BALANCE = BigInt('100000000000000000'); // 0.1 CGT

/** Estimated network fee */
const ESTIMATED_FEE = BigInt('1000000000000000'); // 0.001 CGT

// --- Policy Evaluation ---

/**
 * Evaluate whether an outbound CGT transfer is allowed.
 */
export function evaluateSendPolicy(
  senderAddress: string,
  recipientAddress: string,
  amountBaseUnits: string,
  senderBalance: string,
  activity: AccountActivity,
): TransferPolicyResult {
  const amount = BigInt(amountBaseUnits);
  const balance = BigInt(senderBalance);
  const now = Date.now();
  const accountAge = now - activity.createdAt;
  const isEstablished = accountAge >= ESTABLISHED_AGE_MS;

  // 1. Self-transfer prevention
  if (senderAddress.toLowerCase() === recipientAddress.toLowerCase()) {
    return { allowed: false, reason: 'Cannot send CGT to your own address.' };
  }

  // 2. Flagged account
  if (activity.flagged) {
    return { allowed: false, reason: 'This account has been flagged for review. Please contact support.' };
  }

  // 3. Minimum account age
  if (accountAge < MIN_ACCOUNT_AGE_MS) {
    const hoursLeft = Math.ceil((MIN_ACCOUNT_AGE_MS - accountAge) / (60 * 60 * 1000));
    return {
      allowed: false,
      reason: `Your account must be at least 24 hours old before sending CGT. Please wait ~${hoursLeft} hour(s).`,
    };
  }

  // 4. Minimum amount (dust prevention)
  if (amount < MIN_TRANSFER_AMOUNT) {
    return { allowed: false, reason: 'Transfer amount is below the minimum (0.001 CGT).' };
  }

  // 5. Maximum single transfer
  const maxSingle = isEstablished ? MAX_SINGLE_ESTABLISHED : MAX_SINGLE_NEW;
  if (amount > maxSingle) {
    const limit = isEstablished ? '10,000' : '100';
    return {
      allowed: false,
      reason: `Maximum single transfer for your account tier is ${limit} CGT.${
        !isEstablished ? ' Limits increase after 7 days.' : ''
      }`,
    };
  }

  // 6. Balance check (must retain minimum + fee)
  const totalCost = amount + ESTIMATED_FEE;
  if (balance < totalCost + MIN_RETAIN_BALANCE) {
    return {
      allowed: false,
      reason: 'Insufficient balance. You must retain at least 0.1 CGT after the transfer.',
    };
  }

  // 7. Burst rate limit (min interval between sends)
  if (activity.lastTransferAt > 0) {
    const elapsed = (now - activity.lastTransferAt) / 1000;
    if (elapsed < MIN_TRANSFER_INTERVAL_SEC) {
      const wait = Math.ceil(MIN_TRANSFER_INTERVAL_SEC - elapsed);
      return {
        allowed: false,
        reason: `Please wait ${wait} seconds before sending again.`,
        cooldownSeconds: wait,
      };
    }
  }

  // 8. Hourly limit
  if (activity.transfersThisHour >= HOURLY_LIMIT) {
    return {
      allowed: false,
      reason: `You've reached the hourly transfer limit (${HOURLY_LIMIT}). Please try again later.`,
    };
  }

  // 9. Daily limit
  const dailyLimit = isEstablished ? DAILY_LIMIT_ESTABLISHED : DAILY_LIMIT_NEW;
  if (activity.transfersToday >= dailyLimit) {
    return {
      allowed: false,
      reason: `Daily transfer limit reached (${dailyLimit}/day).${
        !isEstablished ? ' Limits increase after 7 days.' : ''
      }`,
    };
  }

  // 10. Unique recipient limit (anti-multi-account farming)
  const maxRecipients = isEstablished ? MAX_UNIQUE_RECIPIENTS_ESTABLISHED : MAX_UNIQUE_RECIPIENTS_NEW;
  const isNewRecipient = !activity.uniqueRecipients.includes(recipientAddress.toLowerCase());
  if (isNewRecipient && activity.uniqueRecipients.length >= maxRecipients) {
    return {
      allowed: false,
      reason: `You can only send to ${maxRecipients} unique addresses per day.${
        !isEstablished ? ' This limit increases after 7 days.' : ''
      }`,
    };
  }

  return { allowed: true };
}

/**
 * Evaluate whether an account is eligible to receive CGT.
 * (Less restrictive — mainly prevents obvious abuse vectors.)
 */
export function evaluateReceivePolicy(
  recipientAddress: string,
  activity: AccountActivity,
): TransferPolicyResult {
  if (activity.flagged) {
    return { allowed: false, reason: 'This account has been flagged for review.' };
  }
  return { allowed: true };
}

/**
 * Get a human-readable summary of the account's current limits.
 */
export function getAccountLimits(activity: AccountActivity): {
  tier: 'new' | 'established';
  dailyLimit: number;
  dailyUsed: number;
  hourlyLimit: number;
  hourlyUsed: number;
  maxSingleCGT: string;
  canSend: boolean;
  accountAgeHours: number;
} {
  const now = Date.now();
  const accountAge = now - activity.createdAt;
  const isEstablished = accountAge >= ESTABLISHED_AGE_MS;

  return {
    tier: isEstablished ? 'established' : 'new',
    dailyLimit: isEstablished ? DAILY_LIMIT_ESTABLISHED : DAILY_LIMIT_NEW,
    dailyUsed: activity.transfersToday,
    hourlyLimit: HOURLY_LIMIT,
    hourlyUsed: activity.transfersThisHour,
    maxSingleCGT: isEstablished ? '10,000' : '100',
    canSend: accountAge >= MIN_ACCOUNT_AGE_MS && !activity.flagged,
    accountAgeHours: Math.floor(accountAge / (60 * 60 * 1000)),
  };
}
