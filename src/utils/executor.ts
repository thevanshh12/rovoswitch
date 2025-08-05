import { spawn } from 'child_process';
import chalk from 'chalk';

export interface ExecutionResult {
  success: boolean;
  output: string;
  error?: string;
}

export class CommandExecutor {
  /**
   * Executes the acli rovodev auth status command to get current auth info
   */
  public static async executeAuthStatus(): Promise<ExecutionResult> {
    return new Promise((resolve) => {
      const child = spawn('acli', ['rovodev', 'auth', 'status'], {
        stdio: ['pipe', 'pipe', 'pipe']
      });

      let output = '';
      let error = '';

      child.stdout?.on('data', (data) => {
        output += data.toString();
      });

      child.stderr?.on('data', (data) => {
        error += data.toString();
      });

      child.on('close', (code) => {
        const success = code === 0;
        resolve({
          success,
          output,
          error: success ? undefined : error || `Command exited with code ${code}`
        });
      });

      child.on('error', (err) => {
        resolve({
          success: false,
          output,
          error: `Failed to execute command: ${err.message}`
        });
      });
    });
  }

  /**
   * Executes the acli rovodev auth login command
   */
  public static async executeAuthLogin(email: string, token: string): Promise<ExecutionResult> {
    return new Promise((resolve) => {
      console.log(chalk.blue(`Executing: acli rovodev auth login --email "${email}" --token <stdin>`));
      
      const child = spawn('acli', ['rovodev', 'auth', 'login', '--email', email, '--token'], {
        stdio: ['pipe', 'pipe', 'pipe']
      });

      let output = '';
      let error = '';

      // Write token to stdin and close it
      if (child.stdin) {
        child.stdin.write(token);
        child.stdin.end();
      }

      child.stdout?.on('data', (data) => {
        const text = data.toString();
        output += text;
        process.stdout.write(text);
      });

      child.stderr?.on('data', (data) => {
        const text = data.toString();
        error += text;
        process.stderr.write(text);
      });

      child.on('close', (code) => {
        const success = code === 0;
        resolve({
          success,
          output,
          error: success ? undefined : error || `Command exited with code ${code}`
        });
      });

      child.on('error', (err) => {
        resolve({
          success: false,
          output,
          error: `Failed to execute command: ${err.message}`
        });
      });
    });
  }
}