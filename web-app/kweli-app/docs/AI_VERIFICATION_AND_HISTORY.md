# AI Product Verification & Transaction History

This document describes the AI-powered product verification system and transaction history features.

## Overview

The system provides two main features:
1. **AI Product Verification** - Verify products by scanning images using AI
2. **Transaction History** - Track all token credits and transfers for users

## Database Setup

Before using these features, run the migration:

```sql
-- Run this in your Supabase SQL editor
-- File: database/migrations/005_token_transactions.sql
```

This creates:
- `token_transactions` table - tracks all token movements
- Adds `hedera_account_id` and `hedera_private_key` fields to `users` table

## Environment Variables

Add to your `.env.local`:

```env
OPENAI_API_KEY=your_openai_api_key_here
NEXTAUTH_SECRET=your_jwt_secret_here
```

### Getting OpenAI API Key

1. Go to https://platform.openai.com/api-keys
2. Sign up (get $5 free credit for testing)
3. Create a new API key
4. Add it to `.env.local`

## API Endpoints

### 1. AI Product Verification

**Endpoint:** `POST /api/verify-ai`

Verifies product authenticity by analyzing product images using AI.

**Request:**
```json
{
  "image": "base64_encoded_image_string"
}
```

**Headers:**
```
Authorization: Bearer <JWT_TOKEN> (optional - for token rewards)
Content-Type: application/json
```

**Response:**
```json
{
  "success": true,
  "verified": true,
  "confidence": 85,
  "product": {
    "brandName": "Nike",
    "productName": "Air Max 90",
    "category": "Footwear",
    "packagingQuality": 9
  },
  "analysis": [
    "High quality packaging detected",
    "Brand identified: Nike",
    "Official brand website found online"
  ],
  "webSearch": {
    "found": true,
    "hasOfficialWebsite": true,
    "totalResults": 5
  },
  "reward": {
    "eligible": true,
    "amount": 5,
    "credited": true,
    "requiresLogin": false,
    "hederaTransactionId": "0.0.xxxxx@xxxx"
  },
  "message": "✅ Product verified with 85% confidence!"
}
```

**How it Works:**
1. Upload product image (base64 encoded)
2. AI extracts brand name, product info, and quality assessment
3. System searches web for official product information
4. Compares AI analysis with web results
5. Returns confidence score (0-100%)
6. If confidence ≥ 70% and user is logged in, awards **5 tokens**

**Token Rewards:**
- ✅ Verified product (≥70% confidence): **5 tokens**
- ❌ Not verified (<70% confidence): **0 tokens**
- 🔒 Anonymous users: See results but no tokens (must login)

---

### 2. Transaction History

**Endpoint:** `GET /api/user/history`

Get user's complete token transaction history.

**Headers:**
```
Authorization: Bearer <JWT_TOKEN> (required)
```

**Query Parameters:**
- `page` (optional) - Page number (default: 1)
- `limit` (optional) - Items per page (default: 50)

**Example Request:**
```
GET /api/user/history?page=1&limit=20
Authorization: Bearer eyJhbGc...
```

**Response:**
```json
{
  "success": true,
  "transactions": [
    {
      "id": "uuid",
      "type": "qr_scan",
      "amount": 10,
      "description": "QR scan reward - Nike Air Max",
      "product": {
        "id": "product_uuid",
        "name": "Nike Air Max",
        "productId": "NIKE-001",
        "company": {
          "name": "Nike Inc.",
          "logo": "https://..."
        }
      },
      "hederaTransactionId": "0.0.xxxxx@xxxx",
      "balanceAfter": 25,
      "timestamp": "2025-10-17T10:30:00Z"
    },
    {
      "id": "uuid",
      "type": "ai_verification",
      "amount": 5,
      "description": "AI verification reward - Adidas Shoe",
      "product": null,
      "hederaTransactionId": null,
      "balanceAfter": 15,
      "timestamp": "2025-10-17T09:15:00Z"
    }
  ],
  "summary": {
    "totalTransactions": 10,
    "currentBalance": 25,
    "totalScans": 8,
    "transactionsByType": {
      "qr_scan": {
        "count": 6,
        "totalAmount": 60
      },
      "ai_verification": {
        "count": 4,
        "totalAmount": 20
      }
    }
  },
  "pagination": {
    "currentPage": 1,
    "totalPages": 1,
    "totalItems": 10,
    "itemsPerPage": 20,
    "hasNextPage": false,
    "hasPreviousPage": false
  }
}
```

**Transaction Types:**
- `qr_scan` - Tokens earned from QR code scanning (10 tokens)
- `ai_verification` - Tokens earned from AI verification (5 tokens)
- `transfer` - Direct token transfers
- `reward` - Other rewards

---

### 3. QR Code Scanning (Updated)

**Endpoint:** `GET /api/products/scan/:qr_hash`

Now includes automatic token rewards!

**Headers:**
```
Authorization: Bearer <JWT_TOKEN> (optional - for token rewards)
```

**Token Rewards:**
- ✅ Successful QR scan: **10 tokens**
- 🔒 Anonymous users: No tokens (must login)

**Response includes:**
```json
{
  "success": true,
  "product": { ... },
  "authenticity": { ... },
  "reward": {
    "amount": 10,
    "credited": true,
    "requiresLogin": false,
    "hederaTransactionId": "0.0.xxxxx@xxxx"
  },
  "message": "✅ Product verified as authentic!"
}
```

---

### 4. Token Transfer (Updated)

**Endpoint:** `POST /api/transfer`

Now logs transactions to database.

**Request:**
```json
{
  "receiverId": "0.0.xxxxx",
  "amount": 100,
  "userId": "user_uuid_optional",
  "description": "Reward for beta testing"
}
```

---

## Token Reward Summary

| Action | Tokens Earned | Authentication Required |
|--------|---------------|------------------------|
| QR Code Scan | 10 | Yes |
| AI Verification | 5 | Optional* |
| Direct Transfer | Variable | No |

*AI verification works without login but tokens only credited if authenticated

---

## Usage Examples

### Frontend - AI Verification

```javascript
async function verifyProductByPhoto(imageFile) {
  // Convert image to base64
  const reader = new FileReader();
  reader.readAsDataURL(imageFile);
  
  reader.onload = async () => {
    const base64Image = reader.result.split(',')[1];
    
    const response = await fetch('/api/verify-ai', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${userToken}` // Optional
      },
      body: JSON.stringify({ image: base64Image })
    });
    
    const result = await response.json();
    
    if (result.success && result.verified) {
      console.log(`Verified! Confidence: ${result.confidence}%`);
      console.log(`Tokens earned: ${result.reward.amount}`);
    }
  };
}
```

### Frontend - Transaction History

```javascript
async function getUserHistory(page = 1) {
  const response = await fetch(`/api/user/history?page=${page}&limit=20`, {
    headers: {
      'Authorization': `Bearer ${userToken}`
    }
  });
  
  const data = await response.json();
  
  console.log(`Current Balance: ${data.summary.currentBalance} tokens`);
  console.log(`Total Scans: ${data.summary.totalScans}`);
  
  data.transactions.forEach(tx => {
    console.log(`${tx.type}: +${tx.amount} tokens - ${tx.description}`);
  });
}
```

### Frontend - QR Scan with Rewards

```javascript
async function scanQRCode(qrHash) {
  const response = await fetch(`/api/products/scan/${qrHash}`, {
    headers: {
      'Authorization': `Bearer ${userToken}` // Required for rewards
    }
  });
  
  const result = await response.json();
  
  if (result.success) {
    console.log(result.message);
    if (result.reward.credited) {
      console.log(`You earned ${result.reward.amount} tokens!`);
    }
  }
}
```

---

## How AI Verification Works

### Step 1: Image Analysis
OpenAI Vision API (GPT-4o-mini) analyzes the product image and extracts:
- Brand name
- Product name/description
- Category
- Packaging quality score (1-10)
- Suspicious elements
- Legitimacy indicators

### Step 2: Web Search
System searches Google for:
```
{brandName} {productName} official product
```
Extracts top 5 results and checks for official website presence.

### Step 3: Confidence Scoring

| Factor | Points | Description |
|--------|--------|-------------|
| Packaging Quality | +20 | High quality packaging |
| Brand Recognition | +15 | Clear brand identification |
| Product Info Clarity | +10 | Clear product details |
| Online Presence | +15 | Found on official websites |
| Legitimacy Indicators | +10 | Security features, holograms |
| Suspicious Elements | -15 | Poor printing, misspellings |

**Base Score:** 50 points
**Verification Threshold:** 70 points (70% confidence)

### Step 4: Token Crediting
If confidence ≥ 70% and user is logged in:
1. Credit 5 tokens to user's account
2. Log transaction in database
3. Transfer tokens via Hedera (if user has Hedera account)

---

## Security & Privacy

- ✅ JWT authentication for protected endpoints
- ✅ Images not stored (processed in memory only)
- ✅ User tokens stored as total balance
- ✅ Hedera blockchain for transparent token transfers
- ✅ All transactions logged with timestamps

---

## Limitations

1. **OpenAI Free Tier:** $5 credit = ~1,000-2,000 image verifications
2. **Web Scraping:** Google may rate-limit requests
3. **Accuracy:** AI confidence depends on image quality
4. **Coverage:** Works best for well-known brands with online presence

---

## Troubleshooting

### "Invalid image format" Error
- Ensure image is base64 encoded
- Remove data URI prefix if present: `data:image/jpeg;base64,`

### No Tokens Credited
- Check if user is logged in (JWT token valid)
- Verify confidence score ≥ 70%
- Check database logs for errors

### AI Returns Low Confidence
- Use higher quality images
- Ensure good lighting
- Include full product packaging in frame
- Avoid blurry or obscured text

### Transaction History Empty
- User must complete at least one scan/verification
- Check JWT token is valid
- Verify database migration ran successfully

---

## Support

For issues or questions:
1. Check console logs for error messages
2. Verify environment variables are set
3. Ensure database migration completed
4. Check OpenAI API quota/status

---

## Future Enhancements

- [ ] Support for multiple images per verification
- [ ] Machine learning model training on verified products
- [ ] Batch verification for multiple products
- [ ] Fraud detection patterns
- [ ] Export transaction history to CSV
- [ ] Webhook notifications for token credits

