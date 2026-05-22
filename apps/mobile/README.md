# Kweli User App

A production-ready React Native app for product verification using QR codes and AI-powered image recognition. Built with Expo and NativeWind.

## How it works

Kweli is a blockchain-backed product verification platform that enables users to authenticate products and earn rewards. Here's how the app operates:

### 1. Dual Verification System
Users can verify products in two ways:
- **QR Code Scanning**: Tap the button to open the camera scanner, align the QR code in the frame, and instantly verify
- **AI Photo Verification**: Press and hold for 1 second to capture a photo for AI-powered verification

### 2. Verification Flow
```
User Action → Camera Capture → API Verification → Local Storage → Hedera Blockchain
```

1. **Scan/Capture**: User scans QR code or captures product photo
2. **API Validation**: Backend verifies product authenticity via `/api/products/verify` or `/api/verify-ai`
3. **Local Storage**: Results stored locally using AsyncStorage for offline access
4. **Reward Distribution**: Points awarded locally; synced to Hedera network for logged-in users
5. **Duplicate Prevention**: Hash-based tracking prevents double rewards

### 3. Rewards System
- **QR Verification**: 10 points per verified product
- **AI Verification**: 15 points per verified product
- **Achievement Badges**: Progressive rewards for 1, 10, 50, and 100 verifications
- **Transaction History**: Complete audit trail of all verifications and rewards

### 4. Data Synchronization
- **Offline-First**: All data stored locally; works without internet
- **Background Sync**: Syncs to backend when online
- **Hedera Integration**: For logged-in users with Hedera account ID, tokens sync to blockchain
- **Transaction Tracking**: Real-time balance updates via VFY tokens

### 5. Authentication (Optional)
Users can:
- Use app without login for scanning
- Login/Register to sync data to Hedera blockchain
- Track achievements across devices after login
- Earn and redeem VFY tokens on-chain

## Features

### 🔍 Product Verification
- **QR Code Scanning**: Instant verification by scanning product QR codes
- **AI Photo Verification**: Take a photo of products for AI-powered authenticity checks
- Real-time verification status with detailed product information
- Glass morphism UI with immersive dark blue gradient

### 💰 Wallet & Rewards
- VFY token balance tracking
- Achievement system with progressive milestones:
  - First Scan (1 scan)
  - 10 Scans
  - 50 Scans
  - 100 Scans
- Recent transaction history
- Earn rewards for each successful verification (login required)

### 📜 History
- Complete verification history
- Product details with verification status
- Timestamp and verification method (QR/AI)
- Points earned per verification

### 🔐 Authentication
- Optional login system
- Users can scan without logging in
- Points only awarded to logged-in users
- Local data persistence with AsyncStorage

## Installation

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- Expo CLI

### Setup

1. Clone the repository:
```bash
git clone <repository-url>
cd Kweli-user-app
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm start
```

4. Run on your device:
- **iOS**: Press `i` or scan QR code with Camera app
- **Android**: Press `a` or scan QR code with Expo Go app
- **Web**: Press `w`

## Project Structure

```
Kweli-user-app/
├── app/
│   ├── (tabs)/
│   │   ├── _layout.tsx          # Tab navigation with glass tab bar
│   │   ├── index.tsx            # Home screen (verification)
│   │   ├── wallet.tsx           # Wallet screen
│   │   └── history.tsx          # History screen
│   ├── auth/
│   │   └── login.tsx            # Login/signup screen
│   └── _layout.tsx              # Root layout
├── services/
│   ├── api.ts                   # API integration
│   └── storage.ts               # Local storage utilities
├── types/
│   └── index.ts                 # TypeScript type definitions
├── assets/
│   └── images/                  # App images and icons
├── global.css                   # Global styles
├── tailwind.config.js           # Tailwind configuration
└── package.json
```

## API Integration

The app integrates with the Kweli backend API:

### Endpoints

**QR Code Verification**
```
POST https://kweli-web.vercel.app/api/products/verify
Body: { "hash": "qr-code-hash" }
```

**AI Photo Verification**
```
POST https://kweli-web.vercel.app/api/products/verify-ai
Body: FormData with image file
```

**User Wallet**
```
GET https://kweli-web.vercel.app/api/user/wallet/:userId
```

**Sync User Data**
```
POST https://kweli-web.vercel.app/api/user/sync
Body: { "points": number, "history": array, "stats": object }
```

## Design System

### Colors
- **Primary Dark**: `#0A1628`
- **Primary Medium**: `#1E3A5F`
- **Primary Light**: `#2563EB`
- **Glass Effects**: White with 10% opacity + backdrop blur

### Typography
- Headers: Bold, white
- Body: Regular, white with 80% opacity
- Labels: White with 60% opacity

### Components
All UI components use glass morphism design:
- Background: `bg-white/10`
- Border: `border-white/20`
- Blur: `backdrop-blur-md`

## Permissions

The app requires the following permissions:
- **Camera**: For QR code scanning and photo capture
- **Photo Library** (optional): For selecting existing photos

Permissions are requested at runtime when needed.

## Local Storage

User data is stored locally using AsyncStorage:
- User profile and authentication state
- Verification history
- Achievements progress
- Transaction history
- Points balance

Data syncs with the backend when the user is logged in.

## Tech Stack

### Frontend & Framework
- **React Native** (v0.81.4) - Cross-platform mobile development
- **Expo** (~54.0.13) - Development platform with built-in tooling
- **TypeScript** (~5.9.2) - Type-safe JavaScript
- **Expo Router** (~6.0.11) - File-based routing system

### UI & Styling
- **NativeWind** (^4.2.1) - Tailwind CSS for React Native
- **Tailwind CSS** (^3.4.17) - Utility-first CSS framework
- **expo-linear-gradient** (~15.0.7) - Gradient backgrounds
- **expo-blur** (~15.0.7) - Glass morphism effects
- **@expo/vector-icons** (^15.0.2) - Icon library (Ionicons)

### Camera & Media
- **expo-camera** (~17.0.8) - Camera access and preview
- **expo-barcode-scanner** (^13.0.1) - QR code scanning
- **expo-image-picker** (~17.0.8) - Photo capture and selection
- **expo-image** (~3.0.9) - Optimized image rendering
- **expo-av** (~16.0.7) - Video/image handling

### State & Storage
- **AsyncStorage** (^2.2.0) - Local key-value storage
- **React Hooks** - State management with useState, useEffect, useCallback

### Blockchain Integration
- **Hedera Consensus Service** - Blockchain verification and rewards
- **VFY Token** - ERC-20 compatible reward token on Hedera

### Development Tools
- **ESLint** (^9.25.0) - Code linting
- **Metro Bundler** - JavaScript bundler
- **Babel** - JavaScript transpiler
- **React Native Reanimated** (~4.1.1) - Smooth animations
- **Haptic Feedback** - expo-haptics for tactile responses

### Navigation
- **Expo Router** - Built-in navigation
- **React Native Screens** (^4.16.0) - Native screen management
- **Safe Area Context** (^5.6.0) - Device safe areas

### APIs & Network
- **Fetch API** - HTTP requests to backend
- **REST API** - Communication with Kweli backend at `kweli-web.vercel.app`

## How to test

### Prerequisites
- Node.js v16 or higher
- npm or yarn package manager
- Expo Go app on your mobile device (iOS/Android)
- A valid QR code or product for testing

### Quick Start Testing

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Start Development Server**
   ```bash
   npm start
   ```

3. **Run on Device**
   - Scan the QR code with Expo Go app (Android)
   - Or press `i` for iOS simulator
   - Or press `a` for Android emulator
   - Or press `w` for web browser

### Testing Features

#### 1. QR Code Verification
- Tap the main button on home screen
- Allow camera permissions when prompted
- Scan a product QR code
- Verify results show product information
- Check points are awarded in wallet

#### 2. AI Photo Verification
- Press and hold the main button for 1 second
- Allow camera permissions
- Take a photo of a product
- Verify AI processes the image
- Confirm product details and rewards

#### 3. Authentication Flow
- Tap login button (if available)
- Test login with existing credentials
- Test signup for new users
- Verify data syncs with backend
- Check Hedera blockchain integration

#### 4. Wallet & Rewards
- Navigate to Wallet tab
- Verify VFY token balance
- Check transaction history
- Confirm reward calculations
- Test points accumulation

#### 5. Achievement System
- Navigate to Achievements tab
- Verify achievement progress
- Check badge unlocks
- Test milestone rewards
- Confirm progress tracking

#### 6. History Tracking
- Navigate to History tab
- Verify all scans are recorded
- Check product details
- Confirm verification types (QR/AI)
- Test date and timestamp accuracy

### Manual Testing Checklist

- [ ] QR scanning works with valid product codes
- [ ] AI verification processes photos correctly
- [ ] Points are awarded only for verified products
- [ ] Duplicate scans don't award additional points
- [ ] Local storage persists data correctly
- [ ] Offline mode functions without internet
- [ ] Login/signup creates user accounts
- [ ] Hedera blockchain sync works for logged-in users
- [ ] Achievements unlock at correct milestones
- [ ] Transaction history shows all activities
- [ ] Camera permissions are requested properly
- [ ] UI animations render smoothly
- [ ] Glass morphism effects display correctly
- [ ] Tab navigation works across all screens

### Testing on Physical Devices

**iOS:**
1. Install Expo Go from App Store
2. Scan QR code from terminal
3. Camera permissions handled automatically

**Android:**
1. Install Expo Go from Play Store
2. Scan QR code from terminal
3. Grant camera permissions manually if needed

### API Testing
- Test against production API: `https://kweli-web.vercel.app`
- Verify all endpoints respond correctly
- Check error handling for failed requests
- Test network timeout scenarios

## Development

### Running the App
```bash
# Start development server
npm start

# Run on iOS
npm run ios

# Run on Android
npm run android

# Run on web
npm run web
```

### Linting
```bash
npm run lint
```

## Building for Production

### iOS
```bash
eas build --platform ios
```

### Android
```bash
eas build --platform android
```

See [Expo EAS Build](https://docs.expo.dev/build/introduction/) for more details.

## Key Features Implementation

### Glass Morphism Tab Bar
- Floating tab bar with blur effect
- Platform-specific styling (iOS BlurView, Android transparency)
- Active/inactive states with color transitions

### Dual Verification System
- QR scanning with real-time camera preview
- AI photo verification with image picker
- Unified result display with glass modal

### Achievement System
- Progressive milestones (1, 10, 50, 100 scans)
- Visual progress bars
- Reward points per achievement

### Offline-First Architecture
- Local data persistence
- Optimistic UI updates
- Background sync when online

## Future Improvements

### Enhanced AI Verification
- **Deep Learning Models**: Upgrade AI models for better accuracy in product recognition
- **Batch Processing**: Support multiple product photos for comprehensive verification
- **Confidence Scoring**: Display AI confidence levels with visual indicators
- **Model Training**: User feedback loop to improve AI accuracy over time

### Social Features
- **Leaderboards**: Compare verification counts with other users
- **Community Challenges**: Monthly verification challenges with bonus rewards
- **Social Sharing**: Share achievements and verified products on social media
- **Friend System**: Connect with other users and share progress

### Advanced Verification
- **AR Product Overlay**: Augmented reality product information overlay
- **Barcode Support**: Extend verification to include traditional barcodes
- **NFC Support**: Near-field communication for contactless verification
- **Multi-Step Verification**: Combine multiple methods for enhanced security

### Blockchain Enhancements
- **Token Staking**: Allow users to stake VFY tokens for additional rewards
- **NFT Achievements**: Convert achievement badges to NFTs on Hedera
- **DAO Governance**: Community voting on verification rules and rewards
- **Cross-Chain Bridge**: Enable VFY token bridging to other networks

### User Experience
- **Dark Mode**: Toggle between light and dark themes
- **Multilingual Support**: Support for multiple languages
- **Accessibility**: Screen reader support and enhanced contrast modes
- **Customizable UI**: User preference for colors and layouts
- **Advanced Filters**: Search and filter history by date, product, or verification type

### Enterprise Features
- **Bulk Verification**: APIs for manufacturers to verify multiple products
- **Analytics Dashboard**: Detailed analytics for businesses
- **Anti-Counterfeit Reports**: Generate detailed counterfeit reports
- **Supply Chain Tracking**: Track products through entire supply chain

### Performance & Optimization
- **Image Compression**: Optimize photo uploads for faster processing
- **Caching Strategy**: Implement intelligent caching for offline mode
- **Background Sync**: Efficient background data synchronization
- **Code Splitting**: Optimize bundle size for faster load times

### Security & Privacy
- **Biometric Authentication**: Fingerprint/Face ID for login
- **Two-Factor Authentication**: Enhanced security for user accounts
- **Privacy Mode**: Anonymous verification without user tracking
- **Data Encryption**: End-to-end encryption for sensitive data

### Product Discovery
- **Product Marketplace**: Browse and discover verified products
- **Manufacturer Profiles**: View company information and certifications
- **Product Reviews**: User reviews and ratings for verified products
- **Sustainability Score**: Track eco-friendly and sustainable products

### Developer Tools
- **API SDK**: Open-source SDK for third-party integrations
- **Webhook Support**: Real-time notifications for verified products
- **Testing Suite**: Comprehensive testing tools for developers
- **Documentation**: Enhanced API documentation and guides

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is proprietary and confidential.

## Support

For support, email support@kweli.app or join our Slack channel.

---

**Note**: Make sure to run `npm install` after pulling updates to ensure all dependencies are installed.
