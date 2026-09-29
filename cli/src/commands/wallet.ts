/**
 * Wallet commands - Manage keys, balances, and transfers
 */

import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import inquirer from 'inquirer';
import Table from 'cli-table3';
import { DemiurgeClient, Wallet, hexToBytes, bytesToHex } from '@demiurge/sdk';
import { formatOutput, handleError } from '../utils/format';
import * as fs from 'fs';
import * as path from 'path';

export function registerWalletCommands(program: Command) {
  const wallet = program
    .command('wallet')
    .description('Manage wallets, keys, and CGT tokens');

  // Generate new wallet
  wallet
    .command('generate')
    .description('Generate a new wallet')
    .option('-o, --output <file>', 'Save to file')
    .option('--mnemonic', 'Generate with mnemonic phrase')
    .action(async (options, command) => {
      const spinner = ora('Generating wallet...').start();
      try {
        const newWallet = Wallet.generate();
        const address = newWallet.address();
        const privateKey = newWallet.exportPrivateKey();
        
        spinner.succeed('Wallet generated');
        
        const walletData = {
          address,
          privateKey,
          publicKey: newWallet.publicKey(),
          createdAt: new Date().toISOString(),
        };
        
        if (options.output) {
          const outputPath = path.resolve(options.output);
          fs.writeFileSync(outputPath, JSON.stringify(walletData, null, 2));
          console.log(chalk.green('\n✅ Wallet saved to:'), chalk.white(outputPath));
          console.log(chalk.yellow('\n⚠️  Keep this file secure! It contains your private key.'));
        } else {
          console.log(chalk.cyan('\n🔑 New Wallet Generated:\n'));
          console.log(chalk.white('Address:    '), chalk.green(address));
          console.log(chalk.white('Private Key:'), chalk.red(privateKey));
          console.log(chalk.yellow('\n⚠️  Save your private key securely! You cannot recover it.'));
        }
      } catch (error) {
        spinner.fail('Failed to generate wallet');
        handleError(error);
      }
    });

  // Import wallet from private key
  wallet
    .command('import')
    .description('Import wallet from private key or file')
    .argument('<keyOrFile>', 'Private key or path to wallet file')
    .option('-o, --output <file>', 'Save imported wallet to file')
    .action(async (keyOrFile, options, command) => {
      const spinner = ora('Importing wallet...').start();
      try {
        let privateKey: string;
        
        // Check if it's a file path
        if (fs.existsSync(keyOrFile)) {
          const fileContent = fs.readFileSync(keyOrFile, 'utf-8');
          const walletData = JSON.parse(fileContent);
          privateKey = walletData.privateKey || walletData.private_key;
        } else {
          privateKey = keyOrFile;
        }
        
        const importedWallet = Wallet.fromPrivateKey(privateKey);
        const address = importedWallet.address();
        
        spinner.succeed('Wallet imported');
        
        console.log(chalk.cyan('\n🔑 Wallet Imported:\n'));
        console.log(chalk.white('Address:'), chalk.green(address));
        
        if (options.output) {
          const walletData = {
            address,
            privateKey,
            publicKey: importedWallet.publicKey(),
            importedAt: new Date().toISOString(),
          };
          fs.writeFileSync(options.output, JSON.stringify(walletData, null, 2));
          console.log(chalk.green('\n✅ Wallet saved to:'), chalk.white(options.output));
        }
      } catch (error) {
        spinner.fail('Failed to import wallet');
        handleError(error);
      }
    });

  // Get balance
  wallet
    .command('balance')
    .description('Get CGT balance for an address')
    .argument('<address>', 'Account address')
    .action(async (address, options, command) => {
      const spinner = ora('Fetching balance...').start();
      try {
        const rpc = command.optsWithGlobals().rpc;
        const client = new DemiurgeClient({ rpcUrl: rpc });
        
        const balance = await client.getBalance(address);
        
        spinner.succeed('Balance retrieved');
        
        if (command.optsWithGlobals().json) {
          console.log(JSON.stringify({ address, balance }, null, 2));
        } else {
          console.log(chalk.cyan('\n💰 Balance:\n'));
          console.log(chalk.white('Address:'), chalk.gray(address));
          console.log(chalk.white('Balance:'), chalk.green.bold(balance), chalk.cyan('CGT'));
          const sparks = (parseFloat(balance) * 100).toFixed(2);
          console.log(chalk.white('Sparks: '), chalk.gray(sparks));
        }
      } catch (error) {
        spinner.fail('Failed to fetch balance');
        handleError(error);
      }
    });

  // Send CGT
  wallet
    .command('send')
    .description('Send CGT to an address')
    .argument('<to>', 'Recipient address')
    .argument('<amount>', 'Amount in CGT')
    .option('-f, --from <wallet>', 'Sender wallet file')
    .option('-k, --key <privateKey>', 'Private key (not recommended)')
    .action(async (to, amount, options, command) => {
      try {
        // Load wallet
        let senderWallet: any;
        if (options.from) {
          const walletData = JSON.parse(fs.readFileSync(options.from, 'utf-8'));
          senderWallet = Wallet.fromPrivateKey(walletData.privateKey);
        } else if (options.key) {
          senderWallet = Wallet.fromPrivateKey(options.key);
        } else {
          console.log(chalk.red('\n❌ Error: Must specify --from <wallet> or --key <privateKey>'));
          process.exit(1);
        }
        
        const fromAddress = senderWallet.address();
        
        // Confirm transaction
        const { confirm } = await inquirer.prompt([{
          type: 'confirm',
          name: 'confirm',
          message: `Send ${chalk.green(amount)} CGT from ${chalk.gray(fromAddress.slice(0, 10))}... to ${chalk.gray(to.slice(0, 10))}...?`,
          default: false,
        }]);
        
        if (!confirm) {
          console.log(chalk.yellow('\nTransaction cancelled'));
          process.exit(0);
        }
        
        const spinner = ora('Sending transaction...').start();
        
        const rpc = command.optsWithGlobals().rpc;
        
        // Convert amount to Sparks (1 CGT = 1e18 Sparks)
        const amountFloat = parseFloat(amount);
        const amountSparks = BigInt(Math.floor(amountFloat * 1e18)).toString();
        
        // Build message to sign: from + to + amount (as bytes)
        const fromBytes = hexToBytes(fromAddress);
        const toBytes = hexToBytes(to);
        const amountBytes = new TextEncoder().encode(amountSparks);
        
        const message = new Uint8Array(fromBytes.length + toBytes.length + amountBytes.length);
        message.set(fromBytes, 0);
        message.set(toBytes, fromBytes.length);
        message.set(amountBytes, fromBytes.length + toBytes.length);
        
        // Sign the message
        const signature = senderWallet.sign(message);
        const signatureHex = bytesToHex(signature);
        
        // Call RPC method
        const response = await fetch(rpc, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jsonrpc: '2.0',
            id: 1,
            method: 'balances_transfer',
            params: [fromAddress, to, amountSparks, signatureHex],
          }),
        });
        
        const result = await response.json();
        
        if (result.error) {
          spinner.fail('Transaction failed');
          console.log(chalk.red('\n❌ Error:'), result.error.message || result.error);
          process.exit(1);
        }
        
        spinner.succeed('Transaction submitted');
        console.log(chalk.green('\n✅ Transaction sent successfully!'));
        console.log(chalk.white('TX Hash:'), chalk.cyan(result.result?.tx_hash || 'pending'));
        console.log(chalk.white('Amount:'), chalk.green(`${amount} CGT`));
        console.log(chalk.white('From:'), chalk.gray(fromAddress));
        console.log(chalk.white('To:'), chalk.gray(to));
      } catch (error) {
        handleError(error);
      }
    });

  // Get energy
  wallet
    .command('energy')
    .description('Get energy level for an address')
    .argument('<address>', 'Account address')
    .action(async (address, options, command) => {
      const spinner = ora('Fetching energy...').start();
      try {
        const rpc = command.optsWithGlobals().rpc;
        const client = new DemiurgeClient({ rpcUrl: rpc });
        
        const energy = await client.getEnergy(address);
        
        spinner.succeed('Energy retrieved');
        
        console.log(chalk.cyan('\n⚡ Energy:\n'));
        console.log(chalk.white('Address: '), chalk.gray(address));
        console.log(chalk.white('Current: '), chalk.green.bold(energy), chalk.gray('/ 100'));
        
        // Visual energy bar
        const filled = Math.floor(energy / 5);
        const empty = 20 - filled;
        const bar = chalk.green('█'.repeat(filled)) + chalk.gray('░'.repeat(empty));
        console.log(chalk.white('Level:   '), bar, chalk.white(`${energy}%`));
      } catch (error) {
        spinner.fail('Failed to fetch energy');
        handleError(error);
      }
    });

  // Transaction history
  wallet
    .command('history')
    .description('View transaction history')
    .argument('<address>', 'Account address')
    .option('-l, --limit <number>', 'Number of transactions to show', '10')
    .action(async (address, options, command) => {
      const spinner = ora('Fetching transaction history...').start();
      try {
        const rpc = command.optsWithGlobals().rpc;
        // const client = new DemiurgeClient({ rpcUrl: rpc });
        
        // TODO: Implement getTransactionHistory in SDK
        spinner.succeed('History retrieved');
        
        console.log(chalk.cyan('\n📜 Transaction History:\n'));
        console.log(chalk.gray('No transactions found (or not yet implemented)'));
      } catch (error) {
        spinner.fail('Failed to fetch history');
        handleError(error);
      }
    });
}
