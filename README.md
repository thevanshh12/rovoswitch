# RovoSwitch

A TypeScript CLI application for managing Rovo authentication profiles and executing authentication commands with encryption support.

## Table of Contents

1. [Features](#1-features)
2. [Installation](#2-installation)
3. [Usage](#3-usage)
   - 3.1. [Quick Login (Main Feature)](#31-quick-login-main-feature)
   - 3.2. [Profile Management](#32-profile-management)
     - [Create/Update a Profile](#createupdate-a-profile)
     - [List Profiles](#list-profiles)
     - [Show Profile Details](#show-profile-details)
     - [Remove a Profile](#remove-a-profile)
   - 3.3. [Authentication Commands](#33-authentication-commands)
     - [Login with Profile](#login-with-profile)
     - [Login with Direct Credentials](#332-login-with-direct-credentials)
   - 3.4. [Encryption Management](#34-encryption-management)
     - [Enable Encryption](#enable-encryption)
     - [Disable Encryption](#disable-encryption)
     - [Check Encryption Status](#check-encryption-status)
4. [Configuration](#4-configuration)
   - 4.1. [Example Configuration (Unencrypted)](#41-example-configuration-unencrypted)
   - 4.2. [Example Configuration (Encrypted)](#42-example-configuration-encrypted)
   - 4.3. [Security Features](#43-security-features)
5. [Development](#5-development)
   - 5.1. [Build](#51-build)
   - 5.2. [Development Mode](#52-development-mode)
   - 5.3. [Project Structure](#53-project-structure)
6. [Dependencies](#6-dependencies)
7. [Command Reference](#7-command-reference)
   - 7.1. [Main Commands](#71-main-commands)
   - 7.2. [Profile Commands](#72-profile-commands)
   - 7.3. [Authentication Commands](#73-authentication-commands)
   - 7.4. [Encryption Commands](#74-encryption-commands)

## 1. Features

- **Secure Profile Management**: Store and manage multiple authentication profiles with optional encryption
- **Token Encryption**: Protect your authentication tokens with AES-256 encryption
- **Quick Authentication**: Execute `acli rovodev auth login` commands with stored profiles
- **Profile Status Detection**: Automatically detect which profile is currently active
- **Config Storage**: Creates a `.rovoswitch` folder in the user's home directory on first run
- **YAML Configuration**: Stores configuration in YAML format with support for multiple profiles
- **Interactive Commands**: User-friendly prompts and confirmations for sensitive operations

## 2. Installation

1. Clone or download this project
2. Install dependencies:
   ```bash
   npm install
   ```
3. Build the project:
   ```bash
   npm run build
   ```
4. Install globally (optional):
   ```bash
   npm install -g .
   ```

## 3. Usage

### 3.1. Quick Login (Main Feature)
Execute authentication using a profile:
```bash
# Use specific profile (main command)
rovoswitch work
rovoswitch personal
```

### 3.2. Profile Management

#### Create/Update a Profile
```bash
rovoswitch profile set work --email "work@company.com" --token "your-work-token"
rovoswitch profile set personal --email "personal@gmail.com" --token "your-personal-token"
```

#### List Profiles
```bash
rovoswitch profile list
# or use the shortcut
rovoswitch list
```

#### Show Profile Details
```bash
rovoswitch profile show work

# Show with decrypted token (if encrypted)
rovoswitch profile show work --decrypt
```

#### Remove a Profile
```bash
rovoswitch profile remove work
```

### 3.3. Authentication Commands

#### Login with Profile
```bash
rovoswitch auth login --profile work
```

#### Login with Direct Credentials
```bash
rovoswitch auth login --email "user@example.com" --token "your-token"
```

### 3.4. Encryption Management

#### Enable Encryption
Encrypt all existing profiles and enable encryption for new profiles:
```bash
rovoswitch crypt enable
```

#### Disable Encryption
Decrypt all profiles and disable encryption:
```bash
rovoswitch crypt disable
```

#### Check Encryption Status
```bash
rovoswitch crypt status
```

## 4. Configuration

The application stores configuration in `~/.rovoswitch/config.yaml`. 

### 4.1. Example Configuration (Unencrypted)
```yaml
profiles:
  work:
    email: "work@company.com"
    token: "your-work-token-here"
    encrypted: false
  personal:
    email: "personal@gmail.com"
    token: "your-personal-token-here"
    encrypted: false

encrypted: false
```

### 4.2. Example Configuration (Encrypted)
```yaml
profiles:
  work:
    email: "work@company.com"
    token: "U2FsdGVkX1+encrypted-token-data-here"
    encrypted: true
  personal:
    email: "personal@gmail.com"
    token: "U2FsdGVkX1+another-encrypted-token"
    encrypted: true

encrypted: true
```

### 4.3. Security Features
- **Token Encryption**: When encryption is enabled, all tokens are encrypted using AES-256
- **Password Protection**: Encrypted profiles require a password for access
- **Automatic Detection**: The app warns when profiles are stored in plain text
- **Consistent State**: All profiles share the same encryption status

## 5. Development

### 5.1. Build
```bash
npm run build
```

### 5.2. Development Mode
```bash
npm run dev
```

### 5.3. Project Structure
```
src/
├── index.ts              # Main CLI entry point
├── commands/
│   ├── auth.ts          # Authentication commands
│   ├── profile.ts       # Profile management commands
│   └── crypt.ts         # Encryption management commands
└── utils/
    ├── config.ts        # Configuration management
    ├── crypto.ts        # Encryption utilities
    └── executor.ts      # Command execution utilities
```


## 6. Dependencies

- **commander**: CLI framework for building command-line interfaces
- **yaml**: YAML parsing and stringification
- **chalk**: Terminal styling and colors
- **crypto-js**: Encryption and decryption utilities
- **enquirer**: Interactive prompts for user input
- **typescript**: TypeScript compiler
- **ts-node**: TypeScript execution for development

## 7. Command Reference

### 7.1. Main Commands
| Command | Description |
|---------|-------------|
| `rovoswitch <profile>` | Quick login using specified profile |
| `rovoswitch list` | List all profiles with current status |

### 7.2. Profile Commands
| Command | Description |
|---------|-------------|
| `rovoswitch profile list` | List all available profiles |
| `rovoswitch profile set <name> --email <email> --token <token>` | Create or update a profile |
| `rovoswitch profile show <name>` | Show profile details |
| `rovoswitch profile show <name> --decrypt` | Show profile with decrypted token |
| `rovoswitch profile remove <name>` | Remove a profile (with confirmation) |

### 7.3. Authentication Commands
| Command | Description |
|---------|-------------|
| `rovoswitch auth login --profile <name>` | Login using a specific profile |
| `rovoswitch auth login --email <email> --token <token>` | Login with direct credentials |

### 7.4. Encryption Commands
| Command | Description |
|---------|-------------|
| `rovoswitch crypt enable` | Enable encryption for all profiles |
| `rovoswitch crypt disable` | Disable encryption for all profiles |
| `rovoswitch crypt status` | Show encryption status for all profiles |