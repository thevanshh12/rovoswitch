import { Command } from 'commander';
import chalk from 'chalk';
import { ConfigManager } from '../utils/config.js';
import { CryptoManager } from '../utils/crypto.js';

export function createCryptCommand(): Command {
  const cryptCommand = new Command('crypt');
  cryptCommand.description('Encryption management commands');

  // Enable encryption
  cryptCommand
    .command('enable')
    .description('Enable encryption for all profiles')
    .action(async () => {
      const configManager = new ConfigManager();

      if (configManager.readConfig().encrypted) {
        console.log(chalk.yellow('Encryption is already enabled.'));
        return;
      }

      const profiles = configManager.listProfiles();
      if (profiles.length === 0) {
        console.log(chalk.yellow('No profiles found. Create profiles first.'));
        return;
      }

      console.log(chalk.blue('Enabling encryption for all profiles...'));
      const password = await CryptoManager.promptPasswordWithConfirm();

      // Encrypt all existing profiles
      for (const profileName of profiles) {
        const profile = configManager.getProfile(profileName);
        if (profile && !profile.encrypted) {
          profile.token = CryptoManager.encryptToken(profile.token, password);
          profile.encrypted = true;
          configManager.setProfile(profileName, profile);
        }
      }

      // Mark config as encrypted
      const config = configManager.readConfig();
      config.encrypted = true;
      configManager.writeConfig(config);

      console.log(chalk.green('✓ Encryption enabled for all profiles.'));
    });

  // Disable encryption
  cryptCommand
    .command('disable')
    .description('Disable encryption for all profiles')
    .action(async () => {
      const configManager = new ConfigManager();

      if (!configManager.readConfig().encrypted) {
        console.log(chalk.yellow('Encryption is not enabled.'));
        return;
      }

      console.log(chalk.blue('Disabling encryption for all profiles...'));
      const password = await CryptoManager.promptPassword();

      const profiles = configManager.listProfiles();
      
      try {
        // Decrypt all profiles
        for (const profileName of profiles) {
          const profile = configManager.getProfile(profileName);
          if (profile && profile.encrypted) {
            profile.token = CryptoManager.decryptToken(profile.token, password);
            profile.encrypted = false;
            configManager.setProfile(profileName, profile);
          }
        }

        // Mark config as not encrypted
        const config = configManager.readConfig();
        config.encrypted = false;
        configManager.writeConfig(config);

        console.log(chalk.green('✓ Encryption disabled for all profiles.'));
      } catch (error) {
        console.error(chalk.red('✗ Failed to decrypt profiles:'), (error as Error).message);
        process.exit(1);
      }
    });

  // Show encryption status
  cryptCommand
    .command('status')
    .description('Show encryption status')
    .action(() => {
      const configManager = new ConfigManager();
      const config = configManager.readConfig();
      const profiles = configManager.listProfiles();

      console.log(chalk.blue('Encryption Status:'));
      console.log(`  Global encryption: ${config.encrypted ? chalk.green('Enabled') : chalk.red('Disabled')}`);
      
      if (profiles.length > 0) {
        console.log(chalk.blue('\nProfile Status:'));
        profiles.forEach(profileName => {
          const profile = configManager.getProfile(profileName);
          const status = profile?.encrypted ? chalk.green('Encrypted') : chalk.red('Plain text');
          console.log(`  ${profileName}: ${status}`);
        });
      } else {
        console.log(chalk.yellow('\nNo profiles found.'));
      }
    });

  return cryptCommand;
}