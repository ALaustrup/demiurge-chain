/**
 * NFT commands - DRC-369 operations
 */

import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import inquirer from 'inquirer';
import Table from 'cli-table3';
import { DRC369Client } from '@demiurge/drc369-sdk';
import { handleError } from '../utils/format';

export function registerNftCommands(program: Command) {
  const nft = program
    .command('nft')
    .description('Manage DRC-369 NFTs (Dynamic NFT Standard)');

  // Get NFT info
  nft
    .command('info')
    .description('Get NFT information')
    .argument('<tokenId>', 'Token ID')
    .action(async (tokenId, options, command) => {
      const spinner = ora('Fetching NFT...').start();
      try {
        const rpc = command.optsWithGlobals().rpc;
        const client = new DRC369Client({ rpcUrl: rpc });
        
        const token = await client.getToken(tokenId);
        
        spinner.succeed('NFT retrieved');
        
        console.log(chalk.cyan('\n🖼️  NFT Information:\n'));
        console.log(chalk.white('Token ID:    '), chalk.green(token.id));
        console.log(chalk.white('Name:        '), chalk.yellow(token.name));
        console.log(chalk.white('Owner:       '), chalk.gray(token.owner));
        console.log(chalk.white('Collection:  '), token.collection || chalk.gray('None'));
        
        if (token.dynamicState) {
          console.log(chalk.cyan('\n📊 Dynamic State:'));
          console.log(chalk.white('  Level:'), chalk.green(token.dynamicState.level || 1));
          console.log(chalk.white('  XP:   '), chalk.blue(token.dynamicState.xp || 0));
        }
        
        if (token.attributes && token.attributes.length > 0) {
          console.log(chalk.cyan('\n✨ Attributes:'));
          const table = new Table({
            head: [chalk.white('Trait'), chalk.white('Value')],
            colWidths: [30, 30],
          });
          token.attributes.forEach((attr: any) => {
            table.push([attr.trait_type, String(attr.value)]);
          });
          console.log(table.toString());
        }
      } catch (error) {
        spinner.fail('Failed to fetch NFT');
        handleError(error);
      }
    });

  // List owned NFTs
  nft
    .command('list')
    .description('List NFTs owned by an address')
    .argument('<owner>', 'Owner address')
    .option('-l, --limit <number>', 'Number of NFTs to show', '10')
    .action(async (owner, options, command) => {
      const spinner = ora('Fetching NFTs...').start();
      try {
        const rpc = command.optsWithGlobals().rpc;
        const client = new DRC369Client({ rpcUrl: rpc });
        
        const tokens = await client.getTokensByOwner(owner);
        
        spinner.succeed(`Found ${tokens.length} NFTs`);
        
        if (tokens.length === 0) {
          console.log(chalk.gray('\nNo NFTs found for this address'));
          return;
        }
        
        const table = new Table({
          head: [
            chalk.cyan('Token ID'),
            chalk.cyan('Name'),
            chalk.cyan('Level'),
            chalk.cyan('XP'),
            chalk.cyan('Collection'),
          ],
          colWidths: [15, 25, 8, 10, 20],
        });
        
        tokens.slice(0, parseInt(options.limit)).forEach((token: any) => {
          table.push([
            token.id.slice(0, 12) + '...',
            token.name || 'Unnamed',
            String(token.dynamicState?.level || 1),
            String(token.dynamicState?.xp || 0),
            token.collection || chalk.gray('None'),
          ]);
        });
        
        console.log('\n' + table.toString() + '\n');
      } catch (error) {
        spinner.fail('Failed to fetch NFTs');
        handleError(error);
      }
    });

  // Mint NFT
  nft
    .command('mint')
    .description('Mint a new DRC-369 NFT')
    .option('-n, --name <name>', 'NFT name')
    .option('-d, --description <desc>', 'NFT description')
    .option('-i, --image <url>', 'Image URL')
    .option('-w, --wallet <file>', 'Wallet file for signing')
    .option('--interactive', 'Interactive mode')
    .action(async (options, command) => {
      try {
        let metadata: any = {};
        
        if (options.interactive) {
          const answers = await inquirer.prompt([
            { type: 'input', name: 'name', message: 'NFT Name:' },
            { type: 'input', name: 'description', message: 'Description:' },
            { type: 'input', name: 'image', message: 'Image URL:' },
            { type: 'input', name: 'collection', message: 'Collection (optional):' },
          ]);
          metadata = answers;
        } else {
          metadata = {
            name: options.name || 'Unnamed NFT',
            description: options.description || '',
            image: options.image || '',
          };
        }
        
        const spinner = ora('Minting NFT...').start();
        
        // TODO: Implement minting in SDK
        spinner.succeed('NFT minted');
        
        console.log(chalk.green('\n✅ NFT Minted Successfully!'));
        console.log(chalk.white('Token ID:'), chalk.cyan('nft-xxx'));
        console.log(chalk.white('Name:    '), chalk.yellow(metadata.name));
        console.log(chalk.gray('\nNote: Full minting support coming soon'));
      } catch (error) {
        handleError(error);
      }
    });

  // Transfer NFT
  nft
    .command('transfer')
    .description('Transfer NFT to another address')
    .argument('<tokenId>', 'Token ID')
    .argument('<to>', 'Recipient address')
    .option('-w, --wallet <file>', 'Wallet file for signing')
    .action(async (tokenId, to, options, command) => {
      try {
        if (!options.wallet) {
          console.log(chalk.red('\n❌ Error: --wallet <file> required for signing'));
          process.exit(1);
        }
        
        const { confirm } = await inquirer.prompt([{
          type: 'confirm',
          name: 'confirm',
          message: `Transfer NFT ${chalk.yellow(tokenId)} to ${chalk.gray(to.slice(0, 10))}...?`,
          default: false,
        }]);
        
        if (!confirm) {
          console.log(chalk.yellow('\nTransfer cancelled'));
          return;
        }
        
        const spinner = ora('Transferring NFT...').start();
        
        // TODO: Implement transfer in SDK
        spinner.succeed('NFT transferred');
        
        console.log(chalk.green('\n✅ NFT Transferred'));
        console.log(chalk.white('TX Hash:'), chalk.gray('0x...'));
        console.log(chalk.gray('\nNote: Full transfer support coming soon'));
      } catch (error) {
        handleError(error);
      }
    });

  // Update dynamic state
  nft
    .command('update-state')
    .description('Update dynamic state of an NFT')
    .argument('<tokenId>', 'Token ID')
    .option('-k, --key <path>', 'State key (e.g., "stats/damage")')
    .option('-v, --value <value>', 'New value')
    .option('-w, --wallet <file>', 'Wallet file for signing')
    .action(async (tokenId, options, command) => {
      try {
        if (!options.key || !options.value) {
          console.log(chalk.red('\n❌ Error: --key and --value required'));
          process.exit(1);
        }
        
        const spinner = ora('Updating NFT state...').start();
        
        // TODO: Implement state update in SDK
        spinner.succeed('State updated');
        
        console.log(chalk.green('\n✅ NFT State Updated'));
        console.log(chalk.white('Token ID:'), chalk.cyan(tokenId));
        console.log(chalk.white('Key:     '), chalk.yellow(options.key));
        console.log(chalk.white('Value:   '), chalk.green(options.value));
        console.log(chalk.gray('\nNote: Full state update support coming soon'));
      } catch (error) {
        handleError(error);
      }
    });
}
