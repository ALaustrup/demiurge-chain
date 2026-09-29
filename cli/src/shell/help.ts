/**
 * Help system for Demiurge CLI
 */

import chalk from 'chalk';

/**
 * Command help entry
 */
export interface HelpEntry {
  command: string;
  description: string;
  usage?: string;
  examples?: string[];
  subcommands?: HelpEntry[];
}

/**
 * All CLI commands
 */
export const COMMANDS: HelpEntry[] = [
  {
    command: 'wallet',
    description: 'Manage wallets, keys, and CGT tokens',
    subcommands: [
      { command: 'generate', description: 'Generate a new wallet', usage: 'wallet generate [-o <file>]' },
      { command: 'import', description: 'Import wallet from private key', usage: 'wallet import <key-or-file>' },
      { command: 'balance', description: 'Get CGT balance', usage: 'wallet balance <address>' },
      { command: 'send', description: 'Send CGT to an address', usage: 'wallet send <to> <amount> -f <wallet>' },
      { command: 'energy', description: 'Get energy level', usage: 'wallet energy <address>' },
      { command: 'history', description: 'View transaction history', usage: 'wallet history <address>' },
    ],
  },
  {
    command: 'identity',
    description: 'Manage QOR ID and on-chain identity',
    subcommands: [
      { command: 'create', description: 'Create new QOR ID', usage: 'identity create <username>' },
      { command: 'resolve', description: 'Resolve handle to DID', usage: 'identity resolve <handle>' },
      { command: 'link', description: 'Link wallet to identity', usage: 'identity link <address>' },
    ],
  },
  {
    command: 'nft',
    description: 'DRC-369 NFT operations',
    subcommands: [
      { command: 'list', description: 'List owned NFTs', usage: 'nft list [owner]' },
      { command: 'mint', description: 'Mint new NFT', usage: 'nft mint <metadata-uri>' },
      { command: 'transfer', description: 'Transfer NFT', usage: 'nft transfer <token-id> <to>' },
      { command: 'xp', description: 'Add XP to NFT', usage: 'nft xp <token-id> <amount>' },
    ],
  },
  {
    command: 'agent',
    description: 'Deploy and manage AI agents',
    subcommands: [
      { command: 'deploy', description: 'Deploy new agent', usage: 'agent deploy [--interactive]' },
      { command: 'list', description: 'List deployed agents', usage: 'agent list' },
      { command: 'status', description: 'Get agent status', usage: 'agent status <did>' },
      { command: 'stop', description: 'Stop running agent', usage: 'agent stop <did>' },
      { command: 'logs', description: 'View agent logs', usage: 'agent logs <did> [-f]' },
    ],
  },
  {
    command: 'chain',
    description: 'Blockchain queries and operations',
    subcommands: [
      { command: 'status', description: 'Get chain status', usage: 'chain status' },
      { command: 'block', description: 'Get block info', usage: 'chain block [number]' },
      { command: 'tx', description: 'Get transaction info', usage: 'chain tx <hash>' },
      { command: 'validators', description: 'List validators', usage: 'chain validators' },
    ],
  },
  {
    command: 'validator',
    description: 'Validator operations',
    subcommands: [
      { command: 'register', description: 'Register as validator', usage: 'validator register' },
      { command: 'stake', description: 'Stake CGT', usage: 'validator stake <amount>' },
      { command: 'unstake', description: 'Unstake CGT', usage: 'validator unstake <amount>' },
      { command: 'status', description: 'Validator status', usage: 'validator status' },
    ],
  },
  {
    command: 'dev',
    description: 'Development utilities',
    subcommands: [
      { command: 'node', description: 'Start local node', usage: 'dev node' },
      { command: 'faucet', description: 'Get testnet CGT', usage: 'dev faucet <address>' },
      { command: 'compile', description: 'Compile aeon', usage: 'dev compile <file>' },
    ],
  },
];

/**
 * Display help for all commands
 */
export function showFullHelp(): void {
  console.log(chalk.cyan.bold('\n  Demiurge CLI - Command Reference\n'));
  
  for (const cmd of COMMANDS) {
    console.log(chalk.yellow(`  ${cmd.command}`));
    console.log(chalk.gray(`    ${cmd.description}`));
    
    if (cmd.subcommands) {
      for (const sub of cmd.subcommands) {
        console.log(chalk.white(`      ${sub.command}`) + chalk.gray(` - ${sub.description}`));
      }
    }
    console.log();
  }
  
  console.log(chalk.gray('  Use "demiurge <command> --help" for more details on a command.\n'));
}

/**
 * Display help for a specific command
 */
export function showCommandHelp(command: string): void {
  const cmd = COMMANDS.find(c => c.command === command);
  
  if (!cmd) {
    console.log(chalk.red(`\n  Unknown command: ${command}`));
    console.log(chalk.gray('  Use "help" to see all commands.\n'));
    return;
  }
  
  console.log(chalk.cyan.bold(`\n  ${cmd.command}`));
  console.log(chalk.gray(`  ${cmd.description}\n`));
  
  if (cmd.usage) {
    console.log(chalk.white('  Usage:'));
    console.log(chalk.gray(`    ${cmd.usage}\n`));
  }
  
  if (cmd.subcommands) {
    console.log(chalk.white('  Subcommands:'));
    for (const sub of cmd.subcommands) {
      console.log(chalk.yellow(`    ${sub.command}`) + chalk.gray(` - ${sub.description}`));
      if (sub.usage) {
        console.log(chalk.gray(`      ${sub.usage}`));
      }
    }
    console.log();
  }
  
  if (cmd.examples) {
    console.log(chalk.white('  Examples:'));
    for (const example of cmd.examples) {
      console.log(chalk.gray(`    ${example}`));
    }
    console.log();
  }
}

/**
 * Quick help for interactive mode
 */
export function showQuickHelp(): void {
  console.log(chalk.gray(`
  Quick Commands:
    help              Show full help
    help <command>    Help for specific command
    exit / q          Exit CLI
    clear             Clear screen
    status            Show current session status
`));
}
