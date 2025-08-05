#!/bin/bash

# RovoSwitch Installation Script

echo "Installing RovoSwitch CLI..."

# Install dependencies
echo "Installing dependencies..."
npm install

# Build the project
echo "Building the project..."
npm run build

# Install globally
echo "Installing globally..."
npm install -g .

echo "✓ RovoSwitch has been installed successfully!"
echo ""
echo "Usage examples:"
echo "  rovoswitch profile set work --email 'work@company.com' --token 'your-token'"
echo "  rovoswitch work"
echo "  rovoswitch --help"
echo ""
echo "Configuration will be stored in: ~/.rovoswitch/config.yaml"