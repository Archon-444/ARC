#!/usr/bin/env node
/**
 * Circle Configuration Verification Script
 * Verifies that Circle SDK credentials are properly configured
 */

// Load environment variables
require('dotenv').config({ path: '.env.local' });

// Get environment
const getCircleEnvironment = () => {
  const env = process.env.NEXT_PUBLIC_CIRCLE_ENVIRONMENT?.toLowerCase();
  return env === 'mainnet' ? 'mainnet' : 'testnet';
};

// Get credentials based on environment
const getCircleApiKey = () => {
  const env = getCircleEnvironment();
  return env === 'mainnet'
    ? process.env.CIRCLE_API_KEY_MAINNET
    : process.env.CIRCLE_API_KEY_TESTNET;
};

const getCircleAppId = () => {
  const env = getCircleEnvironment();
  return env === 'mainnet'
    ? process.env.NEXT_PUBLIC_CIRCLE_APP_ID_MAINNET
    : process.env.NEXT_PUBLIC_CIRCLE_APP_ID_TESTNET;
};

const getCircleEntitySecret = () => {
  const env = getCircleEnvironment();
  return env === 'mainnet'
    ? process.env.CIRCLE_ENTITY_SECRET_MAINNET
    : process.env.CIRCLE_ENTITY_SECRET_TESTNET;
};

// Validate configuration
const validateCircleConfig = () => {
  const errors = [];
  const env = getCircleEnvironment();

  const apiKey = getCircleApiKey();
  const appId = getCircleAppId();
  const entitySecret = getCircleEntitySecret();

  if (!apiKey) {
    errors.push(`❌ CIRCLE_API_KEY_${env.toUpperCase()} is not configured`);
  }

  if (!appId) {
    errors.push(`❌ NEXT_PUBLIC_CIRCLE_APP_ID_${env.toUpperCase()} is not configured`);
  }

  if (!entitySecret) {
    errors.push(`⚠️  CIRCLE_ENTITY_SECRET_${env.toUpperCase()} is not configured (optional for Smart Contract Platform)`);
  }

  return {
    isValid: errors.filter(e => e.startsWith('❌')).length === 0,
    errors,
  };
};

// Get configuration summary
const getCircleConfigSummary = () => {
  const env = getCircleEnvironment();
  const apiKey = getCircleApiKey();
  const appId = getCircleAppId();
  const entitySecret = getCircleEntitySecret();

  return {
    environment: env,
    hasApiKey: !!apiKey,
    hasAppId: !!appId,
    hasEntitySecret: !!entitySecret,
    apiKeyPreview: apiKey ? `${apiKey.substring(0, 20)}...` : 'Not set',
    appIdPreview: appId || 'Not set',
  };
};

// Run verification
console.log('🔍 Circle SDK Configuration Verification\n');
console.log('=' .repeat(60));

const summary = getCircleConfigSummary();
console.log('\n📊 Configuration Summary:');
console.log(`   Environment: ${summary.environment}`);
console.log(`   API Key: ${summary.hasApiKey ? '✅' : '❌'} ${summary.apiKeyPreview}`);
console.log(`   App ID: ${summary.hasAppId ? '✅' : '❌'} ${summary.appIdPreview}`);
console.log(`   Entity Secret: ${summary.hasEntitySecret ? '✅' : '⚠️ '} ${summary.hasEntitySecret ? 'Configured' : 'Not configured (optional)'}`);

console.log('\n' + '=' .repeat(60));

const validation = validateCircleConfig();
console.log('\n📋 Validation Results:\n');

if (validation.isValid) {
  console.log('✅ Circle SDK configuration is valid!');
  console.log('\n🎉 You can now use Circle User-Controlled Wallets SDK');
  console.log('   - Backend SDK: User authentication and wallet management');
  console.log('   - Web SDK: PIN/biometric challenge handling');

  if (!summary.hasEntitySecret) {
    console.log('\n⚠️  Note: Entity Secret not configured');
    console.log('   This is only needed for Smart Contract Platform (programmatic deployment)');
    console.log('   User-Controlled Wallets will work without it.');
  }

  console.log('\n🚀 Next steps:');
  console.log('   1. Configure OAuth providers (Google, Facebook, Apple) for social login');
  console.log('   2. Start your development server: npm run dev');
  console.log('   3. Test wallet creation with Circle integration');
} else {
  console.log('❌ Circle SDK configuration has issues:\n');
  validation.errors.forEach(error => console.log(`   ${error}`));

  console.log('\n💡 To fix:');
  console.log('   1. Check your .env.local file');
  console.log('   2. Ensure credentials are from Circle Console:');
  console.log('      https://console.circle.com/api-keys');
  console.log('   3. Make sure you\'re using the correct environment (testnet/mainnet)');
}

console.log('\n' + '=' .repeat(60) + '\n');

process.exit(validation.isValid ? 0 : 1);
