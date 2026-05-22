# Quick Setup Guide - AI Verification & Transaction History

## Prerequisites

- Node.js installed
- Supabase project setup
- OpenAI API account (free tier available)

## Step-by-Step Setup

### 1. Run Database Migration

Open your Supabase SQL Editor and run:

```sql
-- File: database/migrations/005_token_transactions.sql

CREATE TABLE IF NOT EXISTS token_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  transaction_type VARCHAR(50) NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  description TEXT,
  hedera_transaction_id VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_token_transactions_user_id ON token_transactions(user_id);
CREATE INDEX idx_token_transactions_created_at ON token_transactions(created_at DESC);

ALTER TABLE users ADD COLUMN IF NOT EXISTS hedera_account_id VARCHAR(50);
ALTER TABLE users ADD COLUMN IF NOT EXISTS hedera_private_key TEXT;

CREATE INDEX IF NOT EXISTS idx_users_hedera_account_id ON users(hedera_account_id);
```

### 2. Get OpenAI API Key

1. Visit https://platform.openai.com/signup
2. Sign up (free $5 credit included)
3. Go to https://platform.openai.com/api-keys
4. Click "Create new secret key"
5. Copy the key (starts with `sk-...`)

### 3. Update Environment Variables

Add to your `.env.local` file:

```env
# OpenAI API Key (for AI verification)
OPENAI_API_KEY=sk-your-key-here

# JWT Secret (for authentication)
NEXTAUTH_SECRET=your-secret-here

# Hedera (if not already set)
HEDERA_ACCOUNT_ID=0.0.xxxxx
HEDERA_PRIVATE_KEY=your-private-key
HEDERA_TOKEN_ID=0.0.xxxxx
```

### 4. Install Dependencies (Already Done)

All required packages are already installed:
- ✅ openai
- ✅ cheerio
- ✅ axios
- ✅ jsonwebtoken

### 5. Restart Development Server

```bash
npm run dev
```

## Testing the Features

### Test 1: AI Product Verification

**Using cURL:**

```bash
# Without authentication (no token reward)
curl -X POST http://localhost:3000/api/verify-ai \
  -H "Content-Type: application/json" \
  -d '{
    "image": "base64_image_string_here"
  }'

# With authentication (gets token reward)
curl -X POST http://localhost:3000/api/verify-ai \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "image": "base64_image_string_here"
  }'
```

**Using JavaScript:**

```javascript
// Convert image file to base64
const fileInput = document.querySelector('input[type="file"]');
const file = fileInput.files[0];
const reader = new FileReader();

reader.readAsDataURL(file);
reader.onload = async () => {
  const base64 = reader.result.split(',')[1];
  
  const response = await fetch('/api/verify-ai', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + localStorage.getItem('token')
    },
    body: JSON.stringify({ image: base64 })
  });
  
  const result = await response.json();
  console.log(result);
};
```

### Test 2: Transaction History

```bash
# Get user's transaction history
curl http://localhost:3000/api/user/history?page=1&limit=10 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**JavaScript:**

```javascript
const response = await fetch('/api/user/history?page=1&limit=10', {
  headers: {
    'Authorization': 'Bearer ' + localStorage.getItem('token')
  }
});

const data = await response.json();
console.log('Current Balance:', data.summary.currentBalance);
console.log('Total Scans:', data.summary.totalScans);
console.log('Transactions:', data.transactions);
```

### Test 3: QR Code Scan (Now with Rewards!)

```bash
# Scan QR code (with authentication for rewards)
curl http://localhost:3000/api/products/scan/QR_HASH_HERE \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**JavaScript:**

```javascript
const qrHash = 'your_qr_hash_here';
const response = await fetch(`/api/products/scan/${qrHash}`, {
  headers: {
    'Authorization': 'Bearer ' + localStorage.getItem('token')
  }
});

const result = await response.json();
if (result.reward.credited) {
  alert(`You earned ${result.reward.amount} tokens!`);
}
```

## Verifying Setup

### 1. Check Database Tables

Run in Supabase SQL Editor:

```sql
-- Check if token_transactions table exists
SELECT * FROM token_transactions LIMIT 5;

-- Check if user columns exist
SELECT hedera_account_id, hedera_private_key 
FROM users 
LIMIT 1;
```

### 2. Test OpenAI Connection

Create a test file `test-openai.js`:

```javascript
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

async function test() {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: "Say hello!" }],
      max_tokens: 10
    });
    console.log('✅ OpenAI API working!');
    console.log(response.choices[0].message.content);
  } catch (error) {
    console.error('❌ OpenAI API error:', error.message);
  }
}

test();
```

Run: `node test-openai.js`

### 3. Check API Endpoints

```bash
# Should return 401 (authentication required) - this means endpoint exists
curl http://localhost:3000/api/user/history

# Should return 400 (missing image) - this means endpoint exists
curl -X POST http://localhost:3000/api/verify-ai \
  -H "Content-Type: application/json" \
  -d '{}'
```

## Common Issues

### Issue: "OpenAI API key not found"
**Solution:** Make sure `OPENAI_API_KEY` is set in `.env.local`

### Issue: "Table 'token_transactions' does not exist"
**Solution:** Run the database migration SQL in Supabase

### Issue: "Invalid or expired token"
**Solution:** 
1. User must login first via `/api/auth/consumer/login`
2. Use the JWT token from login response
3. Token expires after 7 days

### Issue: AI verification returns low confidence
**Solution:**
- Use clear, well-lit product photos
- Ensure product text/branding is visible
- Try different angles
- Use higher resolution images

### Issue: No tokens credited after verification
**Solution:**
1. Check if user is logged in (JWT token provided)
2. Verify confidence score is ≥ 70%
3. Check console logs for errors
4. Verify user exists in database

## Token Reward Flow

```
┌─────────────────┐
│  User Action    │
└────────┬────────┘
         │
    ┌────▼─────┐
    │ QR Scan  │───► 10 tokens
    └──────────┘
         │
    ┌────▼─────────┐
    │ AI Verify    │───► 5 tokens (if confidence ≥ 70%)
    └──────────────┘
         │
    ┌────▼─────────────────┐
    │ Update user balance  │
    └──────────────────────┘
         │
    ┌────▼─────────────────┐
    │ Log to transactions  │
    └──────────────────────┘
         │
    ┌────▼──────────────────┐
    │ Transfer via Hedera*  │ (*if user has Hedera account)
    └───────────────────────┘
```

## Next Steps

1. ✅ Database migration completed
2. ✅ OpenAI API key configured
3. ✅ Test AI verification endpoint
4. ✅ Test transaction history endpoint
5. 🎨 Build frontend UI for image upload
6. 🎨 Build frontend UI for transaction history
7. 📱 Add camera capture for mobile
8. 🎁 Setup Hedera accounts for users (optional)

## Need Help?

- Check `docs/AI_VERIFICATION_AND_HISTORY.md` for detailed API documentation
- Review console logs for error messages
- Verify all environment variables are set
- Ensure database migration completed successfully

## Production Checklist

Before deploying to production:

- [ ] Add OpenAI API key to production environment
- [ ] Run database migration on production database
- [ ] Set rate limits for AI verification (prevent abuse)
- [ ] Monitor OpenAI API usage/costs
- [ ] Add error tracking (Sentry, etc.)
- [ ] Implement image size validation
- [ ] Add user feedback mechanism
- [ ] Setup monitoring for token transactions
- [ ] Test Hedera transfers thoroughly
- [ ] Add analytics for verification success rates

