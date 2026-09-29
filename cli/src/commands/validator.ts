/**
 * Validator commands - Staking and validation operations
 */

import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import Table from 'cli-table3';
import { readFileSync, existsSync } from 'fs';
import { DemiurgeClient, Wallet } from '@demiurge/sdk';
import { handleError, formatCGT, formatAddress, successBox, warningBox } from '../utils/format';

interface ValidatorInfo {
  address: string;
  stake: string;
  commission: number;
  status: 'active' | 'inactive' | 'jailed';
  nominators: number;
  rewardsEarned: string;
  blocksProduced: number;
}

interface RpcClient {
  call<T>(method: string, params?: unknown[]): Promise<T>;
}

// Create RPC client wrapper for consensus methods
function createRpcClient(rpcUrl: string): RpcClient {
  return {
    async call<T>(method: string, params: unknown[] = []): Promise<T> {
      const response = await fetch(rpcUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: Date.now(),
          method,
          params,
        }),
      });
      
      const json = await response.json();
      if (json.error) {
        throw new Error(json.error.message || 'RPC error');
      }
      return json.result;
    },
  };
}

// Load wallet from file
function loadWallet(walletPath: string, password?: string): Wallet {
  if (!existsSync(walletPath)) {
    throw new Error(`Wallet file not found: ${walletPath}`);
  }
  
  const walletData = readFileSync(walletPath, 'utf-8');
  const parsed = JSON.parse(walletData);
  
  // If wallet has a mnemonic (for dev wallets)
  if (parsed.mnemonic) {
    return Wallet.fromMnemonic(parsed.mnemonic);
  }
  
  // If wallet has a private key
  if (parsed.privateKey) {
    return Wallet.fromPrivateKey(parsed.privateKey);
  }
  
  throw new Error('Invalid wallet file format');
}

export function registerValidatorCommands(program: Command) {
  const validator = program
    .command('validator')
    .description('Validator and staking operations');

  // List validators
  validator
    .command('list')
    .description('List all active validators')
    .option('--all', 'Show inactive validators too')
    .option('--limit <n>', 'Maximum number of validators to show', '20')
    .action(async (options, command) => {
      const spinner = ora('Fetching validators...').start();
      try {
        const rpc = command.optsWithGlobals().rpc;
        const client = createRpcClient(rpc);
        
        const raw = await client.call<Array<{ account: string; stake: string; commission: number; active: boolean; nominators?: number }>>(
          'consensus_getValidators',
          []
        );
        const validators = raw.map((v) => ({
          address: v.account,
          stake: v.stake,
          commission: v.commission,
          status: v.active ? 'active' as const : 'inactive' as const,
          nominators: v.nominators ?? 0,
        }));
        
        spinner.succeed(`Retrieved ${validators.length} validators`);
        
        const table = new Table({
          head: [
            chalk.cyan('Address'),
            chalk.cyan('Stake'),
            chalk.cyan('Commission'),
            chalk.cyan('Status'),
            chalk.cyan('Nominators'),
          ],
          colWidths: [20, 18, 12, 10, 12],
        });
        
        validators.forEach((v) => {
          const statusColor = 
            v.status === 'active' ? chalk.green :
            v.status === 'inactive' ? chalk.yellow :
            chalk.red;
          
          table.push([
            formatAddress(v.address, 8),
            chalk.white(formatCGT(v.stake) + ' CGT'),
            chalk.yellow(v.commission + '%'),
            statusColor(v.status),
            chalk.blue(v.nominators.toString()),
          ]);
        });
        
        console.log('\n' + table.toString() + '\n');
        
        // Show summary
        const activeCount = validators.filter(v => v.status === 'active').length;
        console.log(chalk.gray(`Total: ${validators.length} validators | Active: ${activeCount}`));
      } catch (error) {
        spinner.fail('Failed to fetch validators');
        handleError(error);
      }
    });

  // Get validator info
  validator
    .command('info')
    .description('Get detailed validator information')
    .argument('<address>', 'Validator address')
    .action(async (validatorAddr, options, command) => {
      const spinner = ora('Fetching validator info...').start();
      try {
        const rpc = command.optsWithGlobals().rpc;
        const client = createRpcClient(rpc);
        
        const info = await client.call<ValidatorInfo>('consensus_getValidatorInfo', [validatorAddr]);
        
        spinner.succeed('Validator info retrieved');
        
        console.log(chalk.cyan('\n🏛️  Validator Information\n'));
        console.log(chalk.white('Address:        '), chalk.gray(info.address));
        console.log(chalk.white('Total Stake:    '), chalk.green(formatCGT(info.stake)), chalk.cyan('CGT'));
        console.log(chalk.white('Commission:     '), chalk.yellow(info.commission + '%'));
        console.log(chalk.white('Nominators:     '), chalk.blue(info.nominators.toString()));
        console.log(chalk.white('Status:         '), 
          info.status === 'active' ? chalk.green('Active') :
          info.status === 'inactive' ? chalk.yellow('Inactive') :
          chalk.red('Jailed')
        );
        console.log(chalk.white('Rewards Earned: '), chalk.green(formatCGT(info.rewardsEarned)), chalk.cyan('CGT'));
        console.log(chalk.white('Blocks Produced:'), chalk.blue(info.blocksProduced.toString()));
        console.log('');
      } catch (error) {
        spinner.fail('Failed to fetch validator info');
        handleError(error);
      }
    });

  // Register as validator
  validator
    .command('register')
    .description('Register as a new validator')
    .requiredOption('-w, --wallet <file>', 'Wallet file for signing')
    .option('-s, --stake <amount>', 'Initial stake amount in CGT', '1000000')
    .option('-c, --commission <percent>', 'Commission rate (0-100)', '10')
    .action(async (options, command) => {
      try {
        const wallet = loadWallet(options.wallet);
        const validatorAddr = wallet.address();
        const stake = options.stake;
        const commission = parseInt(options.commission);
        
        if (commission < 0 || commission > 100) {
          throw new Error('Commission must be between 0 and 100');
        }
        
        console.log(chalk.cyan('\n🏛️  Registering Validator\n'));
        console.log(chalk.white('Address:   '), chalk.gray(validatorAddr));
        console.log(chalk.white('Stake:     '), chalk.green(formatCGT(stake)), chalk.cyan('CGT'));
        console.log(chalk.white('Commission:'), chalk.yellow(commission + '%'));
        console.log('');
        
        const spinner = ora('Submitting registration...').start();
        
        const rpc = command.optsWithGlobals().rpc;
        const client = createRpcClient(rpc);
        
        // Convert stake to base units (18 decimals)
        const stakeWei = (BigInt(Math.floor(parseFloat(stake) * 1e6)) * BigInt(1e12)).toString();
        
        // Create and sign registration transaction
        const txData = {
          type: 'register_validator',
          validator: validatorAddr,
          stake: stakeWei,
          commission,
          timestamp: Date.now(),
        };
        
        const txBytes = new TextEncoder().encode(JSON.stringify(txData));
        const signature = wallet.signHex(Buffer.from(txBytes).toString('hex'));
        
        const result = await client.call<{ hash: string }>('consensus_registerValidator', [{
          validator: validatorAddr,
          stake: stakeWei,
          commission,
          signature,
        }]);
        
        spinner.succeed('Registration submitted');
        
        successBox('Validator Registration Submitted', [
          ['Transaction Hash', chalk.cyan(result.hash)],
          ['Validator Address', formatAddress(validatorAddr, 12)],
          ['Initial Stake', formatCGT(stake) + ' CGT'],
          ['Commission Rate', commission + '%'],
        ]);
        
        warningBox('Important', 
          'Your validator will become active after the next epoch if you meet the minimum stake requirement.'
        );
      } catch (error) {
        handleError(error);
      }
    });

  // Stake to validator (nominate)
  validator
    .command('stake')
    .description('Nominate/stake to a validator')
    .argument('<validator>', 'Validator address to stake to')
    .argument('<amount>', 'Amount to stake (CGT)')
    .requiredOption('-w, --wallet <file>', 'Wallet file for signing')
    .action(async (validatorAddr, amount, options, command) => {
      try {
        const wallet = loadWallet(options.wallet);
        const nominator = wallet.address();
        
        console.log(chalk.cyan('\n🏛️  Staking to Validator\n'));
        console.log(chalk.white('Validator:'), chalk.gray(formatAddress(validatorAddr, 12)));
        console.log(chalk.white('Amount:   '), chalk.green(formatCGT(amount)), chalk.cyan('CGT'));
        console.log(chalk.white('From:     '), chalk.gray(formatAddress(nominator, 12)));
        console.log('');
        
        const spinner = ora('Submitting stake...').start();
        
        const rpc = command.optsWithGlobals().rpc;
        const client = createRpcClient(rpc);
        
        // Convert amount to base units
        const amountWei = (BigInt(Math.floor(parseFloat(amount) * 1e6)) * BigInt(1e12)).toString();
        
        // Create and sign staking transaction
        const txData = {
          type: 'stake',
          nominator,
          validator: validatorAddr,
          amount: amountWei,
          timestamp: Date.now(),
        };
        
        const txBytes = new TextEncoder().encode(JSON.stringify(txData));
        const signature = wallet.signHex(Buffer.from(txBytes).toString('hex'));
        
        const result = await client.call<{ hash: string }>('consensus_stake', [{
          nominator,
          validator: validatorAddr,
          amount: amountWei,
          signature,
        }]);
        
        spinner.succeed('Stake submitted');
        
        successBox('Staking Transaction Submitted', [
          ['Transaction Hash', chalk.cyan(result.hash)],
          ['Validator', formatAddress(validatorAddr, 12)],
          ['Amount Staked', formatCGT(amount) + ' CGT'],
        ]);
      } catch (error) {
        handleError(error);
      }
    });

  // Unstake from validator
  validator
    .command('unstake')
    .description('Remove stake from a validator')
    .argument('<validator>', 'Validator address to unstake from')
    .argument('<amount>', 'Amount to unstake (CGT)')
    .requiredOption('-w, --wallet <file>', 'Wallet file for signing')
    .action(async (validatorAddr, amount, options, command) => {
      try {
        const wallet = loadWallet(options.wallet);
        const nominator = wallet.address();
        
        console.log(chalk.cyan('\n🏛️  Unstaking from Validator\n'));
        console.log(chalk.white('Validator:'), chalk.gray(formatAddress(validatorAddr, 12)));
        console.log(chalk.white('Amount:   '), chalk.green(formatCGT(amount)), chalk.cyan('CGT'));
        console.log('');
        
        const spinner = ora('Submitting unstake request...').start();
        
        const rpc = command.optsWithGlobals().rpc;
        const client = createRpcClient(rpc);
        
        const amountWei = (BigInt(Math.floor(parseFloat(amount) * 1e6)) * BigInt(1e12)).toString();
        
        const txData = {
          type: 'unstake',
          nominator,
          validator: validatorAddr,
          amount: amountWei,
          timestamp: Date.now(),
        };
        
        const txBytes = new TextEncoder().encode(JSON.stringify(txData));
        const signature = wallet.signHex(Buffer.from(txBytes).toString('hex'));
        
        const result = await client.call<{ hash: string; unlockTime: number }>('consensus_unstake', [{
          nominator,
          validator: validatorAddr,
          amount: amountWei,
          signature,
        }]);
        
        spinner.succeed('Unstake request submitted');
        
        const unlockDate = new Date(result.unlockTime);
        
        successBox('Unstake Request Submitted', [
          ['Transaction Hash', chalk.cyan(result.hash)],
          ['Amount', formatCGT(amount) + ' CGT'],
          ['Available At', chalk.yellow(unlockDate.toLocaleString())],
        ]);
        
        warningBox('Unbonding Period',
          'Your stake will be available to withdraw after the unbonding period (typically 7 days).'
        );
      } catch (error) {
        handleError(error);
      }
    });

  // Query pending rewards (read-only)
  validator
    .command('rewards')
    .description('Query pending staking rewards')
    .option('-a, --address <address>', 'Address to check (uses wallet address if not specified)')
    .option('-w, --wallet <file>', 'Wallet file (used if --address not provided)')
    .option('-v, --validator <address>', 'Filter by validator')
    .action(async (options, command) => {
      try {
        let address = options.address;

        if (!address && options.wallet) {
          const wallet = loadWallet(options.wallet);
          address = wallet.address();
        }

        if (!address) {
          throw new Error('Either --address or --wallet must be provided');
        }

        const spinner = ora('Fetching pending rewards...').start();

        const rpc = command.optsWithGlobals().rpc;
        const client = createRpcClient(rpc);

        const rewards = await client.call<{ total: string; breakdown: { validator: string; amount: string }[] }>(
          'consensus_getPendingRewards',
          [address, options.validator]
        );

        spinner.succeed('Rewards retrieved');

        console.log(chalk.cyan('\n💰 Pending Rewards\n'));
        console.log(chalk.white('Address:'), chalk.gray(formatAddress(address, 12)));

        if (rewards.breakdown && rewards.breakdown.length > 0) {
          rewards.breakdown.forEach((r) => {
            console.log(chalk.white(`  ${formatAddress(r.validator, 8)}:`), chalk.green(formatCGT(r.amount)), chalk.cyan('CGT'));
          });
          console.log('');
        }

        console.log(chalk.white('Total:'), chalk.green.bold(formatCGT(rewards.total)), chalk.cyan('CGT'));
        console.log('');
      } catch (error) {
        handleError(error);
      }
    });

  // Claim rewards
  validator
    .command('claim-rewards')
    .description('Claim staking rewards')
    .requiredOption('-w, --wallet <file>', 'Wallet file for signing')
    .option('-v, --validator <address>', 'Claim rewards from specific validator only')
    .action(async (options, command) => {
      try {
        const wallet = loadWallet(options.wallet);
        const address = wallet.address();
        
        const spinner = ora('Fetching pending rewards...').start();
        
        const rpc = command.optsWithGlobals().rpc;
        const client = createRpcClient(rpc);
        
        // Get pending rewards
        const rewards = await client.call<{ total: string; breakdown: { validator: string; amount: string }[] }>(
          'consensus_getPendingRewards',
          [address, options.validator]
        );
        
        spinner.text = 'Claiming rewards...';
        
        if (rewards.total === '0') {
          spinner.info('No pending rewards to claim');
          return;
        }
        
        console.log(chalk.cyan('\n💰 Pending Rewards\n'));
        
        if (rewards.breakdown.length > 0) {
          rewards.breakdown.forEach((r) => {
            console.log(chalk.white(`  ${formatAddress(r.validator, 8)}:`), chalk.green(formatCGT(r.amount)), chalk.cyan('CGT'));
          });
          console.log('');
        }
        
        console.log(chalk.white('Total:'), chalk.green.bold(formatCGT(rewards.total)), chalk.cyan('CGT'));
        console.log('');
        
        // Submit claim transaction
        const txData = {
          type: 'claim_rewards',
          claimer: address,
          validator: options.validator || null,
          timestamp: Date.now(),
        };
        
        const txBytes = new TextEncoder().encode(JSON.stringify(txData));
        const signature = wallet.signHex(Buffer.from(txBytes).toString('hex'));
        
        const result = await client.call<{ hash: string; amount: string }>('consensus_claimRewards', [{
          claimer: address,
          validator: options.validator || null,
          signature,
        }]);
        
        spinner.succeed('Rewards claimed');
        
        successBox('Rewards Claimed', [
          ['Transaction Hash', chalk.cyan(result.hash)],
          ['Amount Claimed', chalk.green(formatCGT(result.amount)) + ' CGT'],
        ]);
      } catch (error) {
        handleError(error);
      }
    });

  // Get staking status for an account
  validator
    .command('status')
    .description('Get staking status for your account')
    .option('-a, --address <address>', 'Address to check (uses wallet address if not specified)')
    .option('-w, --wallet <file>', 'Wallet file (used if --address not provided)')
    .action(async (options, command) => {
      try {
        let address = options.address;
        
        if (!address && options.wallet) {
          const wallet = loadWallet(options.wallet);
          address = wallet.address();
        }
        
        if (!address) {
          throw new Error('Either --address or --wallet must be provided');
        }
        
        const spinner = ora('Fetching staking status...').start();
        
        const rpc = command.optsWithGlobals().rpc;
        const client = createRpcClient(rpc);
        
        const status = await client.call<{
          isValidator: boolean;
          totalStaked: string;
          nominations: { validator: string; amount: string; rewards: string }[];
          pendingRewards: string;
          unbonding: { amount: string; availableAt: number }[];
        }>('consensus_getStakingStatus', [address]);
        
        spinner.succeed('Status retrieved');
        
        console.log(chalk.cyan('\n📊 Staking Status\n'));
        console.log(chalk.white('Address:        '), chalk.gray(address));
        console.log(chalk.white('Is Validator:   '), status.isValidator ? chalk.green('Yes') : chalk.gray('No'));
        console.log(chalk.white('Total Staked:   '), chalk.green(formatCGT(status.totalStaked)), chalk.cyan('CGT'));
        console.log(chalk.white('Pending Rewards:'), chalk.yellow(formatCGT(status.pendingRewards)), chalk.cyan('CGT'));
        
        if (status.nominations.length > 0) {
          console.log(chalk.cyan('\n📋 Active Nominations\n'));
          
          const table = new Table({
            head: [chalk.cyan('Validator'), chalk.cyan('Staked'), chalk.cyan('Rewards')],
            colWidths: [20, 18, 18],
          });
          
          status.nominations.forEach((n) => {
            table.push([
              formatAddress(n.validator, 8),
              chalk.white(formatCGT(n.amount) + ' CGT'),
              chalk.green(formatCGT(n.rewards) + ' CGT'),
            ]);
          });
          
          console.log(table.toString());
        }
        
        if (status.unbonding.length > 0) {
          console.log(chalk.cyan('\n⏳ Unbonding\n'));
          
          status.unbonding.forEach((u) => {
            const availableDate = new Date(u.availableAt);
            console.log(
              chalk.white(`  ${formatCGT(u.amount)} CGT`),
              chalk.gray('available'),
              chalk.yellow(availableDate.toLocaleDateString())
            );
          });
        }
        
        console.log('');
      } catch (error) {
        handleError(error);
      }
    });

  // Update validator commission
  validator
    .command('set-commission')
    .description('Update validator commission rate')
    .argument('<percent>', 'New commission rate (0-100)')
    .requiredOption('-w, --wallet <file>', 'Validator wallet file')
    .action(async (percent, options, command) => {
      try {
        const commission = parseInt(percent);
        
        if (isNaN(commission) || commission < 0 || commission > 100) {
          throw new Error('Commission must be a number between 0 and 100');
        }
        
        const wallet = loadWallet(options.wallet);
        const validatorAddr = wallet.address();
        
        console.log(chalk.cyan('\n🏛️  Updating Commission Rate\n'));
        console.log(chalk.white('Validator:     '), chalk.gray(formatAddress(validatorAddr, 12)));
        console.log(chalk.white('New Commission:'), chalk.yellow(commission + '%'));
        console.log('');
        
        const spinner = ora('Submitting update...').start();
        
        const rpc = command.optsWithGlobals().rpc;
        const client = createRpcClient(rpc);
        
        const txData = {
          type: 'update_commission',
          validator: validatorAddr,
          commission,
          timestamp: Date.now(),
        };
        
        const txBytes = new TextEncoder().encode(JSON.stringify(txData));
        const signature = wallet.signHex(Buffer.from(txBytes).toString('hex'));
        
        const result = await client.call<{ hash: string }>('consensus_updateCommission', [{
          validator: validatorAddr,
          commission,
          signature,
        }]);
        
        spinner.succeed('Commission update submitted');
        
        successBox('Commission Updated', [
          ['Transaction Hash', chalk.cyan(result.hash)],
          ['New Commission', commission + '%'],
        ]);
        
        warningBox('Note',
          'Commission changes may take effect in the next epoch.'
        );
      } catch (error) {
        handleError(error);
      }
    });
}
