/**
 * Formatting and output utilities
 */

import chalk from 'chalk';

export function formatOutput(data: any, asJson: boolean = false): string {
  if (asJson) {
    return JSON.stringify(data, null, 2);
  }
  
  // Pretty print for terminal
  return JSON.stringify(data, null, 2);
}

export function handleError(error: any) {
  console.error(chalk.red('\n❌ Error:'), chalk.white(error.message || error));
  
  if (error.response?.data) {
    console.error(chalk.gray('Details:'), error.response.data);
  }
  
  if (process.env.DEBUG) {
    console.error(chalk.gray('\nStack trace:'));
    console.error(error.stack);
  }
  
  process.exit(1);
}

export function formatCGT(amount: string | number): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  return num.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function formatAddress(address: string, length: number = 10): string {
  if (address.length <= length * 2) return address;
  return `${address.slice(0, length)}...${address.slice(-length)}`;
}

export function formatTimeAgo(timestamp: number | Date): string {
  const date = timestamp instanceof Date ? timestamp : new Date(timestamp);
  const diff = Date.now() - date.getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (minutes > 0) return `${minutes}m ago`;
  return `${seconds}s ago`;
}

export function successBox(title: string, items: [string, string][]) {
  console.log(chalk.green('\n✅ ' + title + '\n'));
  const maxLabelLength = Math.max(...items.map(([label]) => label.length));
  
  items.forEach(([label, value]) => {
    const paddedLabel = label.padEnd(maxLabelLength);
    console.log(chalk.white(paddedLabel + ':'), value);
  });
  console.log('');
}

export function infoBox(title: string, message: string) {
  console.log(chalk.cyan(`\nℹ️  ${title}`));
  console.log(chalk.gray(message));
  console.log('');
}

export function warningBox(title: string, message: string) {
  console.log(chalk.yellow(`\n⚠️  ${title}`));
  console.log(chalk.white(message));
  console.log('');
}
