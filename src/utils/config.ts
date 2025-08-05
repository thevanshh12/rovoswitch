import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import * as yaml from 'yaml';
import { CryptoManager } from './crypto.js';

export interface ProfileConfig {
  email: string;
  token: string;
  type?: string; // Optional for backward compatibility
  encrypted?: boolean; // Whether the token is encrypted
}

export interface AppConfig {
  profiles: Record<string, ProfileConfig>;
  encrypted?: boolean; // Whether encryption is enabled globally
}

export class ConfigManager {
  private configDir: string;
  private configFile: string;

  constructor() {
    this.configDir = path.join(os.homedir(), '.rovoswitch');
    this.configFile = path.join(this.configDir, 'config.yaml');
  }

  /**
   * Ensures the config directory exists
   */
  private ensureConfigDir(): void {
    if (!fs.existsSync(this.configDir)) {
      fs.mkdirSync(this.configDir, { recursive: true });
    }
  }

  /**
   * Reads the configuration file
   */
  public readConfig(): AppConfig {
    this.ensureConfigDir();
    
    if (!fs.existsSync(this.configFile)) {
      // Create default config if it doesn't exist
      const defaultConfig: AppConfig = {
        profiles: {},
      };
      this.writeConfig(defaultConfig);
      return defaultConfig;
    }

    try {
      const configContent = fs.readFileSync(this.configFile, 'utf8');
      return yaml.parse(configContent) as AppConfig;
    } catch (error) {
      throw new Error(`Failed to read config file: ${error}`);
    }
  }

  /**
   * Writes the configuration file
   */
  public writeConfig(config: AppConfig): void {
    this.ensureConfigDir();
    
    try {
      const yamlContent = yaml.stringify(config, {
        indent: 2,
        lineWidth: 0,
        minContentWidth: 0
      });
      fs.writeFileSync(this.configFile, yamlContent, 'utf8');
    } catch (error) {
      throw new Error(`Failed to write config file: ${error}`);
    }
  }

  /**
   * Gets a specific profile
   */
  public getProfile(profileName: string): ProfileConfig | null {
    const config = this.readConfig();
    return config.profiles[profileName] || null;
  }

  /**
   * Gets a specific profile with decrypted token
   */
  public async getProfileDecrypted(profileName: string, password?: string): Promise<ProfileConfig | null> {
    const profile = this.getProfile(profileName);
    if (!profile) return null;

    if (profile.encrypted) {
      if (!password) {
        password = await CryptoManager.promptPassword();
      }
      try {
        const decryptedProfile = { ...profile };
        decryptedProfile.token = CryptoManager.decryptToken(profile.token, password);
        return decryptedProfile;
      } catch (error) {
        throw new Error('Invalid password');
      }
    }

    return profile;
  }

  /**
   * Gets profile email for identification without decryption
   */
  public getProfileEmail(profileName: string): string | null {
    const profile = this.getProfile(profileName);
    if (!profile) return null;
    
    // Use actual email for non-encrypted profiles
    return profile.email;
  }

  /**
   * Checks if encryption is enabled
   */
  public isEncryptionEnabled(): boolean {
    const config = this.readConfig();
    return config.encrypted || false;
  }

  /**
   * Checks if encryption is enabled and fixes config if no encrypted profiles exist
   */
  public isEncryptionEnabledOrFix(): boolean {
    const config = this.readConfig();
    
    if (!config.encrypted) {
      return false;
    }

    // Check if any profiles are actually encrypted
    const profiles = this.listProfiles();
    const hasEncryptedProfiles = profiles.some(profileName => {
      const profile = this.getProfile(profileName);
      return profile && profile.encrypted;
    });

    // If no encrypted profiles exist, disable global encryption
    if (!hasEncryptedProfiles) {
      config.encrypted = false;
      this.writeConfig(config);
      return false;
    }

    return true;
  }

  public checkPasswordConsistency(password: string): boolean {
    const config = this.readConfig();
    if (!this.isEncryptionEnabledOrFix()) {
      throw new Error('Encryption is not enabled, try enabling it first');
    }
    const firstProfile = this.getFirstProfile();
    if (!firstProfile) {
      throw new Error('No profiles found, create a profile first');
    }
    try {
      CryptoManager.decryptToken(firstProfile.token, password);
      return true;
    } catch (error) {
      return false;
    }
  }

  public getFirstProfile(): ProfileConfig | null {
    const config = this.readConfig();
    return config.profiles && config.profiles[Object.keys(config.profiles)[0]] || null;
  }

  /**
   * Sets a profile
   */
  public setProfile(profileName: string, profile: ProfileConfig): void {
    const config = this.readConfig();
    config.profiles[profileName] = profile;
    this.writeConfig(config);
  }

  /**
   * Lists all available profiles
   */
  public listProfiles(): string[] {
    const config = this.readConfig();
    return Object.keys(config.profiles);
  }

  /**
   * Removes a profile
   */
  public removeProfile(profileName: string): boolean {
    const config = this.readConfig();
    
    if (!config.profiles[profileName]) {
      return false;
    }

    delete config.profiles[profileName];
    this.writeConfig(config);
    return true;
  }

  /**
   * Gets the config directory path
   */
  public getConfigDir(): string {
    return this.configDir;
  }

  /**
   * Gets the config file path
   */
  public getConfigFile(): string {
    return this.configFile;
  }
}