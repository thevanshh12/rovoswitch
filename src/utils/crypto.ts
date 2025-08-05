import * as CryptoJS from 'crypto-js';
import * as readline from 'readline';
import { prompt } from 'enquirer';
import chalk from 'chalk';

export class CryptoManager {
  /**
   * Encrypts a token with a password
   */
  public static encryptToken(token: string, password: string): string {
    return CryptoJS.AES.encrypt(token, password).toString();
  }

  /**
   * Decrypts a token with a password
   */
  public static decryptToken(encryptedToken: string, password: string): string {
    try {
      const bytes = CryptoJS.AES.decrypt(encryptedToken, password);
      const decrypted = bytes.toString(CryptoJS.enc.Utf8);
      if (!decrypted) {
        throw new Error('Invalid password');
      }
      return decrypted;
    } catch (error) {
      throw new Error('Invalid password or corrupted data');
    }
  }

  static async promptPassword(): Promise<string> {
    const { password } = await prompt<{ password: string }>({
      type: 'password',
      name: 'password',
      message: 'Enter password',
    });
    return password;
  }

  static async promptPasswordWithConfirm(): Promise<string> {
    const password = await this.promptPassword();

    const { confirm } = await prompt<{ confirm: string }>({
      type: 'password',
      name: 'confirm',
      message: 'Confirm password',
    });

    if (password !== confirm) {
      throw new Error('Passwords do not match.');
    }

    return password;
  }
}