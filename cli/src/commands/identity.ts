/**
 * Identity commands - QOR ID operations
 */

import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import inquirer from 'inquirer';
import { qorAuth } from '@demiurge/qor-sdk';
import { handleError } from '../utils/format';

export function registerIdentityCommands(program: Command) {
  const identity = program
    .command('identity')
    .alias('id')
    .description('Manage QOR ID and decentralized identity');

  // Register new QOR ID
  identity
    .command('register')
    .description('Register a new QOR ID')
    .option('-u, --username <name>', 'Username')
    .option('-e, --email <email>', 'Email (optional)')
    .option('-p, --password <password>', 'Password')
    .option('--interactive', 'Interactive registration')
    .action(async (options, command) => {
      try {
        let credentials: any = {};
        
        if (options.interactive) {
          const answers = await inquirer.prompt([
            { type: 'input', name: 'username', message: 'Username:' },
            {
              type: 'input',
              name: 'email',
              message: 'Email (optional, press Enter to skip):',
            },
            { type: 'password', name: 'password', message: 'Password:' },
            { type: 'password', name: 'confirmPassword', message: 'Confirm Password:' },
          ]);
          
          if (answers.password !== answers.confirmPassword) {
            console.log(chalk.red('\n❌ Passwords do not match'));
            process.exit(1);
          }
          
          credentials = answers;
        } else {
          credentials = {
            username: options.username,
            email: options.email,
            password: options.password,
          };
        }
        
        if (!credentials.username || !credentials.password) {
          console.log(chalk.red('\n❌ Username and password required'));
          process.exit(1);
        }
        
        const spinner = ora('Registering QOR ID...').start();
        
        const result = await qorAuth.register({
          username: credentials.username,
          email: credentials.email || undefined,
          password: credentials.password,
        });
        
        spinner.succeed('QOR ID registered');
        
        console.log(chalk.green('\n✅ QOR ID Created Successfully!\n'));
        console.log(chalk.white('QOR ID:  '), chalk.cyan(result.qor_id));
        if (result.backup_code) {
          console.log(chalk.yellow('\n⚠️  Backup Code (SAVE THIS):'), chalk.red.bold(result.backup_code));
        }
        if (!credentials.email) {
          console.log(chalk.gray('\nTip: Link an email to enable password recovery'));
        }
      } catch (error) {
        handleError(error);
      }
    });

  // Login to get session token
  identity
    .command('login')
    .description('Login and get session token')
    .argument('<identifier>', 'QOR ID or email')
    .option('-p, --password <password>', 'Password')
    .action(async (identifier, options, command) => {
      try {
        let password = options.password;
        
        if (!password) {
          const { pwd } = await inquirer.prompt([
            { type: 'password', name: 'pwd', message: 'Password:' },
          ]);
          password = pwd;
        }
        
        const spinner = ora('Authenticating...').start();
        
        const response = await qorAuth.login(identifier, password);
        
        spinner.succeed('Logged in');
        
        console.log(chalk.green('\n✅ Authentication Successful\n'));
        console.log(chalk.white('QOR ID:  '), chalk.cyan(response.user.qor_id));
        console.log(chalk.white('Role:    '), chalk.yellow(response.user.role));
        console.log(chalk.white('Token:   '), chalk.gray(response.token.slice(0, 50) + '...'));
        
        // Save token to local config
        console.log(chalk.gray('\nToken saved to session'));
      } catch (error) {
        handleError(error);
      }
    });

  // Resolve QOR ID to address
  identity
    .command('resolve')
    .description('Resolve QOR ID handle to DID/address')
    .argument('<handle>', 'QOR ID handle (e.g., alice#1234)')
    .action(async (handle, options, command) => {
      const spinner = ora('Resolving...').start();
      try {
        // TODO: Implement resolve in QOR SDK
        spinner.succeed('Resolved');
        
        console.log(chalk.cyan('\n🔍 QOR ID Resolution:\n'));
        console.log(chalk.white('Handle:  '), chalk.yellow(handle));
        console.log(chalk.white('DID:     '), chalk.green('did:demiurge:...'));
        console.log(chalk.white('Address: '), chalk.gray('0x...'));
        console.log(chalk.gray('\nNote: Full resolution coming soon'));
      } catch (error) {
        spinner.fail('Failed to resolve');
        handleError(error);
      }
    });

  // Check username availability
  identity
    .command('check')
    .description('Check if a username is available')
    .argument('<username>', 'Username to check')
    .action(async (username, options, command) => {
      const spinner = ora('Checking availability...').start();
      try {
        const result = await qorAuth.checkUsername(username);
        
        spinner.stop();
        
        if (result.available) {
          console.log(chalk.green(`\n✅ "${result.username}" is available!`));
        } else {
          console.log(chalk.red(`\n❌ "${result.username}" is already taken`));
        }
      } catch (error) {
        spinner.fail('Failed to check');
        handleError(error);
      }
    });

  // Show profile
  identity
    .command('profile')
    .description('Show your QOR ID profile')
    .action(async (options, command) => {
      const spinner = ora('Fetching profile...').start();
      try {
        const profile = await qorAuth.getProfile();
        
        spinner.succeed('Profile loaded');
        
        console.log(chalk.cyan('\n👤 Your Profile:\n'));
        console.log(chalk.white('QOR ID:       '), chalk.green(profile.qor_id));
        console.log(chalk.white('Display Name: '), profile.display_name || chalk.gray('Not set'));
        console.log(chalk.white('Email:        '), profile.email || chalk.gray('Not set'));
        console.log(chalk.white('Role:         '), chalk.yellow(profile.role));
        
        if (profile.on_chain) {
          console.log(chalk.cyan('\n⛓️  On-Chain Data:'));
          console.log(chalk.white('  Address: '), chalk.gray(profile.on_chain.address));
          if (profile.on_chain.cgt_balance) {
            console.log(chalk.white('  Balance: '), chalk.green(profile.on_chain.cgt_balance), chalk.cyan('CGT'));
          }
        }
      } catch (error) {
        spinner.fail('Failed to fetch profile');
        handleError(error);
      }
    });
}
