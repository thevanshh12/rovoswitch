import { Command } from 'commander';
import chalk from 'chalk';
import { ConfigManager } from '../utils/config.js';
import { CommandExecutor } from '../utils/executor.js';

export function createAuthCommand(): Command {
  const authCommand = new Command('auth');
  authCommand.description('Authentication commands');

  // Login command that executes acli rovodev auth login
  authCommand
    .command('login')
    .description('Login using a profile or direct credentials')
    .option('-p, --profile <profile>', 'Profile name to use for login')
    .option('-e, --email <email>', 'Email address')
    .option('-t, --token <token>', 'Authentication token')
    .action(async (options) => {
      const configManager = new ConfigManager();

      let email: string;
      let token: string;

      if (options.profile) {
        // Use profile
        let profile;
        try {
          profile = await configManager.getProfileDecrypted(options.profile);
        } catch (error) {
          console.error(chalk.red('✗ Failed to decrypt profile:'), (error as Error).message);
          process.exit(1);
        }
        
        if (!profile) {
          console.error(chalk.red(`Profile '${options.profile}' not found.`));
          console.log(chalk.yellow('Available profiles:'), configManager.listProfiles().join(', '));
          process.exit(1);
        }
        email = profile.email;
        token = profile.token;
        console.log(chalk.green(`Using profile: ${options.profile}`));
        
        // Show encryption warning if not enabled
        if (!configManager.isEncryptionEnabled()) {
          console.log(chalk.yellow('⚠️  Warning: This profile is not encrypted. Consider enabling encryption with "rovoswitch crypt enable".'));
        }
      } else if (options.email && options.token) {
        // Use direct credentials
        email = options.email;
        token = options.token;
        console.log(chalk.green('Using provided credentials'));
      } else {
        // Require profile to be specified
        console.error(chalk.red('Please specify a profile with --profile or provide --email and --token'));
        console.log(chalk.yellow('Available profiles:'), configManager.listProfiles().join(', '));
        process.exit(1);
      }

      // Execute the acli command
      try {
        const result = await CommandExecutor.executeAuthLogin(email, token);
        
        if (result.success) {
          console.log(chalk.green('✓ Authentication successful!'));
        } else {
          console.error(chalk.red('✗ Authentication failed:'));
          if (result.error) {
            console.error(chalk.red(result.error));
          }
          process.exit(1);
        }
      } catch (error) {
        console.error(chalk.red('✗ Failed to execute authentication:'), error);
        process.exit(1);
      }
    });

  return authCommand;
}