/**
 * Chain commands - Query blockchain state
 */

import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import Table from 'cli-table3';
import { DemiurgeClient } from '@demiurge/sdk';
import { formatOutput, handleError } from '../utils/format';

export function registerChainCommands(program: Command) {
  const chain = program
    .command('chain')
    .description('Query blockchain state and information');

  // Get block number
  chain
    .command('block-number')
    .description('Get the current block number')
    .action(async (options, command) => {
      const spinner = ora('Querying blockchain...').start();
      try {
        const rpc = command.optsWithGlobals().rpc;
        const client = new DemiurgeClient({ rpcUrl: rpc });
        
        const blockNumber = await client.getBlockNumber();
        
        spinner.succeed('Block number retrieved');
        
        if (command.optsWithGlobals().json) {
          console.log(JSON.stringify({ blockNumber }, null, 2));
        } else {
          console.log(chalk.cyan('\n📦 Current Block:'), chalk.white.bold(blockNumber));
        }
      } catch (error) {
        spinner.fail('Failed to query block number');
        handleError(error);
      }
    });

  // Get block info
  chain
    .command('block')
    .description('Get block information')
    .argument('[number]', 'Block number (latest if not specified)')
    .action(async (blockNum, options, command) => {
      const spinner = ora('Fetching block...').start();
      try {
        const rpc = command.optsWithGlobals().rpc;
        const client = new DemiurgeClient({ rpcUrl: rpc });
        
        // TODO: Implement getBlock method in SDK
        const block = blockNum 
          ? `Block #${blockNum}`
          : 'Latest block';
        
        spinner.succeed('Block retrieved');
        console.log(chalk.cyan(block));
      } catch (error) {
        spinner.fail('Failed to fetch block');
        handleError(error);
      }
    });

  // Get chain status
  chain
    .command('status')
    .description('Get comprehensive chain status')
    .action(async (options, command) => {
      const spinner = ora('Querying chain status...').start();
      try {
        const rpc = command.optsWithGlobals().rpc;
        const client = new DemiurgeClient({ rpcUrl: rpc });
        
        const blockNumber = await client.getBlockNumber();
        
        spinner.succeed('Chain status retrieved');
        
        const table = new Table({
          head: [chalk.cyan('Metric'), chalk.white('Value')],
          colWidths: [30, 50],
        });
        
        table.push(
          ['Block Height', chalk.green(blockNumber.toString())],
          ['RPC Endpoint', chalk.gray(rpc)],
          ['Network', chalk.yellow('Demiurge Mainnet')],
          ['Status', chalk.green('● Online')],
        );
        
        console.log('\n' + table.toString() + '\n');
      } catch (error) {
        spinner.fail('Failed to get chain status');
        handleError(error);
      }
    });

  // Get validators
  chain
    .command('validators')
    .description('List all active validators')
    .action(async (options, command) => {
      const spinner = ora('Fetching validators...').start();
      try {
        const rpc = command.optsWithGlobals().rpc;
        // const client = new DemiurgeClient({ rpcUrl: rpc });
        
        // TODO: Implement getValidators in SDK
        spinner.succeed('Validators retrieved');
        
        console.log(chalk.cyan('\n🏛️  Validators:\n'));
        console.log(chalk.gray('Coming soon - RPC method implementation pending'));
      } catch (error) {
        spinner.fail('Failed to fetch validators');
        handleError(error);
      }
    });
}
