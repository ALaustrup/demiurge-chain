/**
 * Agent commands - Deploy and manage AI agents
 */

import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import inquirer from 'inquirer';
import Table from 'cli-table3';
import { createAgent } from '@demiurge/agent-foundry';
import { handleError } from '../utils/format';
import * as fs from 'fs';

export function registerAgentCommands(program: Command) {
  const agent = program
    .command('agent')
    .description('Deploy and manage autonomous AI agents');

  // Deploy new agent
  agent
    .command('deploy')
    .description('Deploy a new AI agent')
    .option('-n, --name <name>', 'Agent name')
    .option('-m, --mission <text>', 'Agent mission/purpose')
    .option('-a, --autonomy <level>', 'Autonomy level (supervised|bounded|autonomous|sovereign)', 'bounded')
    .option('-l, --limit <amount>', 'Spending limit in CGT', '100')
    .option('--llm <provider>', 'LLM provider (openai|gemini|ollama)', 'gemini')
    .option('--api-key <key>', 'API key for LLM provider')
    .option('--interactive', 'Interactive deployment wizard')
    .action(async (options, command) => {
      try {
        let config: any = {};
        
        if (options.interactive) {
          const answers = await inquirer.prompt([
            { type: 'input', name: 'name', message: 'Agent Name:' },
            { type: 'input', name: 'mission', message: 'Agent Mission:' },
            {
              type: 'list',
              name: 'autonomy',
              message: 'Autonomy Level:',
              choices: [
                { name: 'Supervised (requires approval for all actions)', value: 'supervised' },
                { name: 'Bounded (pre-approved actions + spending limit)', value: 'bounded' },
                { name: 'Autonomous (full signing authority)', value: 'autonomous' },
                { name: 'Sovereign (can spawn sub-agents)', value: 'sovereign' },
              ],
            },
            { type: 'input', name: 'limit', message: 'Spending Limit (CGT):', default: '100' },
            {
              type: 'list',
              name: 'llm',
              message: 'LLM Provider:',
              choices: ['openai', 'gemini', 'ollama'],
            },
            { type: 'password', name: 'apiKey', message: 'API Key (leave empty for Ollama):' },
            {
              type: 'checkbox',
              name: 'capabilities',
              message: 'Agent Capabilities:',
              choices: [
                { name: 'Read blockchain data', value: 'read' },
                { name: 'Analyze patterns', value: 'analyze' },
                { name: 'Execute trades', value: 'trade' },
                { name: 'Transfer CGT', value: 'transfer' },
                { name: 'Submit bounty bids', value: 'bounty' },
              ],
            },
          ]);
          config = answers;
        } else {
          config = {
            name: options.name || 'Agent',
            mission: options.mission || 'General purpose agent',
            autonomy: options.autonomy,
            limit: options.limit,
            llm: options.llm,
            apiKey: options.apiKey || process.env.OPENAI_API_KEY || process.env.GEMINI_API_KEY,
            capabilities: ['read', 'analyze'],
          };
        }
        
        const spinner = ora('Deploying agent...').start();
        
        try {
          // TODO: Full agent deployment
          // const agent = await createAgent({
          //   name: config.name,
          //   llm: {
          //     provider: config.llm,
          //     apiKey: config.apiKey,
          //   },
          //   autonomy: config.autonomy,
          //   capabilities: config.capabilities,
          //   spendingLimit: `${config.limit} CGT`,
          // });
          
          spinner.succeed('Agent deployed');
          
          console.log(chalk.green('\n✅ Agent Deployed Successfully!\n'));
          console.log(chalk.white('Name:       '), chalk.yellow(config.name));
          console.log(chalk.white('DID:        '), chalk.cyan('did:demiurge:agent:...'));
          console.log(chalk.white('Autonomy:   '), chalk.blue(config.autonomy));
          console.log(chalk.white('Limit:      '), chalk.green(`${config.limit} CGT`));
          console.log(chalk.white('Provider:   '), chalk.magenta(config.llm));
          console.log(chalk.gray('\nNote: Full agent deployment coming soon'));
        } catch (err) {
          spinner.fail('Agent deployment failed');
          throw err;
        }
      } catch (error) {
        handleError(error);
      }
    });

  // List agents
  agent
    .command('list')
    .description('List deployed agents')
    .option('-o, --owner <address>', 'Filter by owner')
    .option('--all', 'Show all agents (not just yours)')
    .action(async (options, command) => {
      const spinner = ora('Fetching agents...').start();
      try {
        // TODO: Query agents from blockchain
        spinner.succeed('Agents retrieved');
        
        console.log(chalk.cyan('\n🤖 Deployed Agents:\n'));
        console.log(chalk.gray('No agents deployed yet'));
      } catch (error) {
        spinner.fail('Failed to fetch agents');
        handleError(error);
      }
    });

  // Query agent status
  agent
    .command('status')
    .description('Get agent status and metrics')
    .argument('<did>', 'Agent DID')
    .action(async (did, options, command) => {
      const spinner = ora('Querying agent...').start();
      try {
        // TODO: Query agent status from blockchain
        spinner.succeed('Agent status retrieved');
        
        console.log(chalk.cyan('\n🤖 Agent Status:\n'));
        console.log(chalk.white('DID:        '), chalk.cyan(did));
        console.log(chalk.white('Status:     '), chalk.green('● Active'));
        console.log(chalk.gray('\nNote: Full agent queries coming soon'));
      } catch (error) {
        spinner.fail('Failed to query agent');
        handleError(error);
      }
    });

  // Stop agent
  agent
    .command('stop')
    .description('Stop a running agent')
    .argument('<did>', 'Agent DID')
    .option('-r, --reason <text>', 'Stop reason')
    .action(async (did, options, command) => {
      try {
        const { confirm } = await inquirer.prompt([{
          type: 'confirm',
          name: 'confirm',
          message: `Stop agent ${chalk.cyan(did)}?`,
          default: false,
        }]);
        
        if (!confirm) {
          console.log(chalk.yellow('\nCancelled'));
          return;
        }
        
        const spinner = ora('Stopping agent...').start();
        
        // TODO: Implement agent stop
        spinner.succeed('Agent stopped');
        
        console.log(chalk.green('\n✅ Agent Stopped'));
        if (options.reason) {
          console.log(chalk.white('Reason:'), chalk.gray(options.reason));
        }
      } catch (error) {
        handleError(error);
      }
    });

  // Agent logs
  agent
    .command('logs')
    .description('View agent activity logs')
    .argument('<did>', 'Agent DID')
    .option('-f, --follow', 'Follow logs in real-time')
    .option('-n, --lines <number>', 'Number of lines to show', '50')
    .action(async (did, options, command) => {
      const spinner = ora('Fetching logs...').start();
      try {
        // TODO: Implement agent logs retrieval
        spinner.succeed('Logs retrieved');
        
        console.log(chalk.cyan(`\n📋 Agent Logs (${did}):\n`));
        console.log(chalk.gray('No logs available (agent logs coming soon)'));
      } catch (error) {
        spinner.fail('Failed to fetch logs');
        handleError(error);
      }
    });
}
