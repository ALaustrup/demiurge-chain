// Utilities for the Sophia portal

/**
 * Format a wallet address for display
 */
export function formatAddress(address: string | undefined, chars = 4): string {
  if (!address) return "Unknown";
  return `${address.slice(0, chars)}...${address.slice(-chars)}`;
}

/**
 * Format a number as currency (CGT)
 */
export function formatCGT(amount: string | number): string {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);
}

/**
 * Format a timestamp for display
 */
export function formatTimestamp(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Truncate text with ellipsis
 */
export function truncate(text: string, length: number): string {
  return text.length > length ? text.slice(0, length) + "..." : text;
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated(accessToken: string | null): boolean {
  return !!accessToken;
}

/**
 * Sleep utility for delays
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Validate QOR ID format
 */
export function isValidQorId(username: string): boolean {
  return /^[a-zA-Z0-9_-]{3,30}$/.test(username);
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/**
 * Validate Demiurge address format
 */
export function isValidDemiurgeAddress(address: string): boolean {
  return /^0x[0-9a-fA-F]{40}$/.test(address);
}
