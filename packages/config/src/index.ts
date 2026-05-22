// Shared configuration for Kweli platform
// Used by both @kweli/web and @kweli/mobile

// API Configuration
export const API_CONFIG = {
    // Production URL - deployed web app
    PRODUCTION_URL: 'https://kweli-web.vercel.app',
    // Local development URL
    DEVELOPMENT_URL: 'http://localhost:3000',
} as const;

// Hedera Configuration
export const HEDERA_CONFIG = {
    // Network
    NETWORK: 'testnet',
    // Token details
    TOKEN_NAME: 'VFY',
    TOKEN_SYMBOL: 'VFY',
    TOKEN_DECIMALS: 2,
    // Fixed supply
    TOTAL_SUPPLY: 100_000_000,
} as const;

// Reward Configuration
export const REWARDS = {
    // Points earned per action
    QR_SCAN: 10,
    AI_VERIFICATION_MIN: 5,
    AI_VERIFICATION_MAX: 15,
    // AI confidence threshold
    AI_CONFIDENCE_THRESHOLD: 70,
    // Achievement milestones
    MILESTONES: [1, 10, 50, 100, 500, 1000],
} as const;

// App Metadata
export const APP_CONFIG = {
    NAME: 'Kweli',
    TAGLINE: 'Know the kweli, it will set you free.',
    DESCRIPTION: 'Hedera-powered product authentication platform',
    VERSION: '1.0.0',
} as const;
