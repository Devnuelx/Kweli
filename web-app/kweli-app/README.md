# Kweli - Product Authentication & Verification Platform

Kweli is a blockchain-powered product authentication platform that enables businesses to verify product authenticity using QR codes and AI-powered image analysis. Built with Next.js, Hedera Hashgraph, and OpenAI.

## Features

- **QR Code Product Verification** - Scan QR codes to verify product authenticity on the blockchain
- **AI-Powered Verification** - Upload product images for AI-based authenticity verification
- **Token Rewards System** - Earn tokens for verifying products
- **Transaction History** - Track all token earnings and transfers
- **Blockchain Integration** - Powered by Hedera Hashgraph for transparent, immutable records
- **Product Management** - Companies can register and manage products
- **Design Templates** - Automatic QR code embedding in product designs

## Tech Stack

- **Frontend:** Next.js 15, React 19, TailwindCSS
- **Backend:** Next.js API Routes
- **Database:** Supabase (PostgreSQL)
- **Blockchain:** Hedera Hashgraph
- **AI:** OpenAI Vision API (GPT-4o-mini)
- **Authentication:** JWT

## Getting Started

### Prerequisites

- Node.js 18+ installed
- Supabase account and project
- Hedera testnet account
- OpenAI API key (optional, for AI verification)

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd kweli-app
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
```

Add the following to `.env.local`:
```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Hedera
HEDERA_ACCOUNT_ID=0.0.xxxxx
HEDERA_PRIVATE_KEY=your_private_key
HEDERA_TOKEN_ID=0.0.xxxxx

# JWT
NEXTAUTH_SECRET=your_secret_key

# OpenAI (for AI verification)
OPENAI_API_KEY=sk-your-key
```

4. Run database migrations:
```bash
# Open Supabase SQL Editor and run migrations from:
# database/migrations/
```

5. Start the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## New Features: AI Verification & Transaction History

### AI Product Verification
Upload product images to verify authenticity using AI. The system:
- Extracts brand and product information
- Searches for official product information online
- Calculates confidence score (0-100%)
- Awards 5 tokens for verified products (≥70% confidence)

**Endpoint:** `POST /api/verify-ai`

### Transaction History
Track all your token earnings and transfers with:
- Paginated transaction list
- Running balance calculation
- Summary statistics by transaction type
- Product details for each transaction

**Endpoint:** `GET /api/user/history`

### Enhanced QR Code Scanning
QR code scanning now includes automatic token rewards:
- 10 tokens for each successful scan
- Automatic transaction logging
- Hedera blockchain integration

**Endpoint:** `GET /api/products/scan/:qr_hash`

## Documentation

Comprehensive documentation available in the `docs/` folder:

- **[API Quick Reference](docs/API_QUICK_REFERENCE.md)** - Quick API endpoint reference
- **[Setup Guide](docs/SETUP_GUIDE.md)** - Step-by-step setup instructions
- **[AI Verification & History](docs/AI_VERIFICATION_AND_HISTORY.md)** - Detailed API documentation
- **[Example Components](docs/EXAMPLE_COMPONENTS.md)** - React component examples
- **[Implementation Summary](docs/IMPLEMENTATION_SUMMARY.md)** - Technical overview

## API Endpoints

### Authentication
- `POST /api/auth/consumer/login` - User login
- `POST /api/auth/consumer/signup` - User registration

### Product Verification
- `GET /api/products/scan/:qr_hash` - QR code scanning (10 tokens)
- `POST /api/verify-ai` - AI image verification (5 tokens)

### Token Management
- `GET /api/user/history` - Transaction history
- `POST /api/transfer` - Transfer tokens

### Product Management
- `POST /api/products/register` - Register new product
- `POST /api/products/csv-import` - Bulk import products
- `GET /api/products/list` - List all products

## Token Rewards

| Action | Tokens Earned | Requirements |
|--------|---------------|--------------|
| QR Code Scan | 10 | Authentication required |
| AI Verification | 5 | Authentication optional, ≥70% confidence |
| Direct Transfer | Variable | Admin initiated |

## Project Structure

```
kweli-app/
├── app/                          # Next.js app directory
│   ├── (app)/                    # Authenticated routes
│   │   └── dashboard/            # Company dashboard
│   ├── (public)/                 # Public routes
│   └── api/                      # API routes
│       ├── verify-ai/            # AI verification endpoint
│       ├── user/history/         # Transaction history
│       └── products/             # Product endpoints
├── components/                   # React components
├── lib/                          # Utility libraries
│   ├── hedera/                   # Hedera blockchain utilities
│   ├── services/                 # Business logic services
│   │   ├── ai/                   # AI verification service
│   │   ├── csv/                  # CSV processing
│   │   └── qr/                   # QR code services
│   └── supabase/                 # Supabase client
├── database/migrations/          # Database migrations
├── docs/                         # Documentation
└── public/                       # Static assets
```

## Database Schema

Key tables:
- `users` - Consumer accounts with token balances
- `companies` - Business accounts
- `products` - Registered products
- `token_transactions` - Token earning/transfer history
- `scans` - Product scan logs
- `design_templates` - QR placement templates

## Development

```bash
# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Lint code
npm run lint
```

## Environment

The application supports multiple environments:
- **Development:** Local development with hot reload
- **Staging:** Testing environment
- **Production:** Live deployment

## Contributing

1. Create a feature branch
2. Make your changes
3. Test thoroughly
4. Submit a pull request

## License

[Your License Here]

## Support

For questions or issues:
1. Check the documentation in `docs/`
2. Review API endpoints in `docs/API_QUICK_REFERENCE.md`
3. Contact support team

## Acknowledgments

- Built with [Next.js](https://nextjs.org)
- Powered by [Hedera Hashgraph](https://hedera.com)
- AI by [OpenAI](https://openai.com)
- Database by [Supabase](https://supabase.com)
