import { Command } from 'commander';
import chalk from 'chalk';
import * as readline from 'readline';
import { ConfigManager } from '../utils/config.js';
import { CommandExecutor } from '../utils/executor.js';
import { CryptoManager } from '../utils/crypto.js';

/**
 * Prompts for Y/n confirmation
 */
async function promptConfirmation(message: string): Promise<boolean> {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    rl.question(chalk.cyan(message), (answer) => {
      rl.close();
      const normalized = answer.trim().toLowerCase();
      // Default to Yes if empty, or if starts with 'y'
      resolve(normalized === '' || normalized === 'y' || normalized === 'yes');
    });
  });
}

export function createProfileCommand(): Command {
  const profileCommand = new Command('profile');
  profileCommand.description('Profile management commands');

  // List profiles
  profileCommand
    .command('list')
    .description('List all available profiles')
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
              return (email && email === currentEmail);
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

  // Add/update profile
  profileCommand
    .command('set')
    .description('Add or update a profile')
    .argument('<n>', 'Profile name')
    .option('-e, --email <email>', 'Email address')
    .option('-t, --token <token>', 'Authentication token')
    .action(async (name, options) => {
      if (!options.email || !options.token) {
        console.error(chalk.red('Both --email and --token are required.'));
        process.exit(1);
      }

      const configManager = new ConfigManager();
      let token = options.token;
      let encrypted = false;

      // If encryption is enabled, encrypt the token
      if (configManager.isEncryptionEnabledOrFix()) {
        const password = await CryptoManager.promptPassword();
        if (!configManager.checkPasswordConsistency(password)) {
          console.error(chalk.red('Incorrect password'));
          process.exit(1);
        }
        token = CryptoManager.encryptToken(options.token, password);
        encrypted = true;
      }

      configManager.setProfile(name, {
        email: options.email,
        token: token,
        encrypted: encrypted,
      });

      console.log(chalk.green(`✓ Profile '${name}' saved successfully.`));
    });

  // Show profile details
  profileCommand
    .command('show')
    .description('Show profile details')
    .argument('<n>', 'Profile name')
    .option('-d, --decrypt', 'Decrypt token')
    .action(async (name, options) => {
      const configManager = new ConfigManager();
      const profile = configManager.getProfile(name);

      if (!profile) {
        console.error(chalk.red(`Profile '${name}' not found.`));
        process.exit(1);
      }

      let displayToken = profile.encrypted ? `${chalk.yellow('[Encrypted]')} ${profile.token.substring(0, 8)}...` : profile.token;
      const displayStatus = profile.encrypted ? chalk.green('Encrypted') : chalk.red('Plain text');
      
      if (profile.encrypted && options.decrypt) {
        const password = await CryptoManager.promptPassword();
        try {
          displayToken = CryptoManager.decryptToken(profile.token, password);
        } catch (error) {
          console.error(chalk.red('✗ Failed to decrypt token:'), (error as Error).message);
          process.exit(1);
        }
      }

      console.log(chalk.blue(`Profile: ${name}`));
      console.log(`  Email: ${profile.email}`);
      console.log(`  Status: ${displayStatus}`);
      console.log(`  Token: ${displayToken}`);
    });

  // Remove profile
  profileCommand
    .command('remove')
    .description('Remove a profile')
    .argument('<n>', 'Profile name')
    .action(async (name) => {
      const configManager = new ConfigManager();
      const profile = configManager.getProfile(name);

      if (!profile) {
        console.error(chalk.red(`Profile '${name}' not found.`));
        process.exit(1);
      }

      // Interactive confirmation
      const confirmed = await promptConfirmation(`Are you sure you want to remove profile '${name}'? (Y/n): `);
      
      if (!confirmed) {
        console.log(chalk.yellow('Operation cancelled.'));
        return;
      }

      const success = configManager.removeProfile(name);
      
      if (success) {
        console.log(chalk.green(`✓ Profile '${name}' removed successfully.`));
        
        // Fix encryption status after removal
        configManager.isEncryptionEnabledOrFix();
      } else {
        console.error(chalk.red(`Failed to remove profile '${name}'.`));
        process.exit(1);
      }
    });

  return profileCommand;
}