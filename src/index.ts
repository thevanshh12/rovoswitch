#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import { createAuthCommand } from './commands/auth.js';
import { createProfileCommand } from './commands/profile.js';
import { createCryptCommand } from './commands/crypt.js';
import { ConfigManager } from './utils/config.js';
import { CommandExecutor } from './utils/executor.js';

const program = new Command();

program
  .name('rovoswitch')
  .description('A CLI application for managing Rovo authentication profiles')
  .version('1.0.0');

// Add auth command
program.addCommand(createAuthCommand());

// Add profile command
program.addCommand(createProfileCommand());

// Add crypt command
program.addCommand(createCryptCommand());

// Add list shortcut command
program
  .command('list')
  .description('List all available profiles (shortcut for profile list)')
  .action(async () => {
    const configManager = new ConfigManager();
    const profiles = configManager.listProfiles();

    if (profiles.length === 0) {
      console.log(chalk.yellow('No profiles found.'));
      return;
    }

    // Get current auth status to determine which profile is currently active
    let currentEmail: string | null = null;
    try {
      const authResult = await CommandExecutor.executeAuthStatus();
      if (authResult.success) {
        // Parse the email from the output
        const emailMatch = authResult.output.match(/Email:\s*(.+)/);
        if (emailMatch) {
          currentEmail = emailMatch[1].trim();
        }
      }
    } catch (error) {
      // Ignore errors, just don't show current profile
    }

    // Find which profile matches the current email
    let currentProfile: string | null = null;
    if (currentEmail) {
      for (const profileName of profiles) {
        const profileEmail = configManager.getProfileEmail(profileName);
        if (profileEmail && profileEmail === currentEmail) {
          // Only show as current if there's exactly one match
          const matchingProfiles = profiles.filter(p => {
            const email = configManager.getProfileEmail(p);
            return email && email === currentEmail;
          });
          if (matchingProfiles.length === 1) {
            currentProfile = profileName;
          }
          break;
        }
      }
    }

    console.log(chalk.blue('Available profiles:'));
    profiles.forEach(profile => {
      const isCurrent = profile === currentProfile;
      const marker = isCurrent ? chalk.green(' < current') : '';
      console.log(`  ${profile}${marker}`);
    });

    // Show encryption warning if not enabled
    if (!configManager.isEncryptionEnabled()) {
      console.log();
      console.log(chalk.yellow('⚠️  Warning: Encryption is not enabled. Your tokens are stored in plain text.'));
      console.log(chalk.yellow('   Use "rovoswitch crypt enable" to encrypt your profiles.'));
    }
  });

// Quick login command (main feature)
program
  .argument('<profile>', 'Profile name to use for login')
  .description('Quick login using a profile')
  .action(async (profileName) => {
    const configManager = new ConfigManager();
    
    let profile;
    try {
      profile = await configManager.getProfileDecrypted(profileName);
    } catch (error) {
      console.error(chalk.red('✗ Failed to decrypt profile:'), (error as Error).message);
      process.exit(1);
    }
    
    if (!profile) {
      console.error(chalk.red(`Profile '${profileName}' not found.`));
      console.log(chalk.yellow('Available profiles:'), configManager.listProfiles().join(', '));
      console.log(chalk.blue('Use "rovoswitch profile set <n> --email <email> --token <token>" to create a profile.'));
      process.exit(1);
    }

    console.log(chalk.green(`Using profile: ${profileName}`));
    
    // Show encryption warning if not enabled
    if (!configManager.isEncryptionEnabled()) {
      console.log(chalk.yellow('⚠️  Warning: This profile is not encrypted. Consider enabling encryption with "rovoswitch crypt enable".'));
    }
    
    try {
      const result = await CommandExecutor.executeAuthLogin(profile.email, profile.token);
      
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

// Show help if no arguments provided
if (process.argv.length === 2) {
  program.help();
}

program.parse();