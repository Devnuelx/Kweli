# API Quick Reference Guide

Quick reference for all token-related endpoints.

## Authentication

All endpoints that require authentication use JWT tokens in the Authorization header:

```
Authorization: Bearer <JWT_TOKEN>
```

Get JWT token from `/api/auth/consumer/login`.

---

## Endpoints

### 1. AI Product Verification

```
POST /api/verify-ai
```

**Headers:**
```
Content-Type: application/json
Authorization: Bearer <TOKEN> (optional)
```

**Request:**
```json
{
  "image": "base64_encoded_image_string"
}
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
  "reward": {
    "amount": 5,
    "credited": true
  }
}
```

**Token Reward:** 5 tokens (if confidence ≥ 70% and authenticated)

---

### 2. Transaction History

```
GET /api/user/history?page=1&limit=10
```

**Headers:**
```
Authorization: Bearer <TOKEN> (required)
```

**Query Parameters:**
- `page` (optional, default: 1)
- `limit` (optional, default: 50)

**Response:**
```json
{
  "success": true,
  "transactions": [
    {
      "id": "uuid",
      "type": "qr_scan",
      "amount": 10,
      "description": "QR scan reward",
      "balanceAfter": 25,
      "timestamp": "2025-10-17T10:30:00Z"
    }
  ],
  "summary": {
    "currentBalance": 25,
    "totalScans": 8,
    "totalTransactions": 10
  },
  "pagination": {
    "currentPage": 1,
    "totalPages": 2
  }
}
```

---

### 3. QR Code Scan

```
GET /api/products/scan/:qr_hash
```

**Headers:**
```
Authorization: Bearer <TOKEN> (optional)
```

**Response:**
```json
{
  "success": true,
  "product": {
    "name": "Product Name",
    "manufacturer": "Company",
    "isExpired": false
  },
  "reward": {
    "amount": 10,
    "credited": true
  },
  "message": "✅ Product verified as authentic!"
}
```

**Token Reward:** 10 tokens (if authenticated)

---

### 4. Token Transfer

```
POST /api/transfer
```

**Request:**
```json
{
  "receiverId": "0.0.xxxxx",
  "amount": 100,
  "userId": "user_uuid",
  "description": "Reward transfer"
}
```

**Response:**
```json
{
  "status": "success",
  "receipt": {},
  "transactionId": "0.0.xxxxx@xxxxx"
}
```

---

### 5. User Login

```
POST /api/auth/consumer/login
```

**Request:**
```json
{
  "email": "user@example.com",
  "password": "password"
}
```

**Response:**
```json
{
  "success": true,
  "token": "eyJhbGc...",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "totalRewards": 25
  }
}
```

---

### 6. User Signup

```
POST /api/auth/consumer/signup
```

**Request:**
```json
{
  "email": "user@example.com",
  "password": "password",
  "name": "John Doe",
  "phone": "+1234567890"
}
```

**Response:**
```json
{
  "success": true,
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "total_rewards": 0
  }
}
```

---

## Token Rewards Summary

| Endpoint | Tokens | Auth Required | Notes |
|----------|--------|---------------|-------|
| `/api/verify-ai` | 5 | No* | Tokens only if authenticated & confidence ≥ 70% |
| `/api/products/scan/:hash` | 10 | No* | Tokens only if authenticated |
| `/api/transfer` | Variable | No | Admin/treasury transfer |

*Endpoint works without auth but tokens only credited if authenticated

---

## Transaction Types

| Type | Description | Typical Amount |
|------|-------------|----------------|
| `qr_scan` | QR code product scan | 10 tokens |
| `ai_verification` | AI product verification | 5 tokens |
| `transfer` | Direct token transfer | Variable |
| `reward` | Other rewards | Variable |

---

## Error Codes

| Status | Error | Cause |
|--------|-------|-------|
| 400 | Invalid image format | Image not base64 or invalid |
| 401 | Authentication required | No JWT token provided |
| 401 | Invalid or expired token | JWT token invalid/expired |
| 404 | Product not found | QR hash doesn't exist |
| 500 | Internal server error | Server/API error |

---

## Rate Limits

**Recommended (implement in production):**
- AI Verification: 10 requests/minute per user
- QR Scans: 20 requests/minute per user
- History: 30 requests/minute per user

---

## Example cURL Commands

### AI Verification
```bash
curl -X POST http://localhost:3000/api/verify-ai \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"image": "BASE64_STRING"}'
```

### Get History
```bash
curl http://localhost:3000/api/user/history?page=1&limit=10 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Scan QR Code
```bash
curl http://localhost:3000/api/products/scan/QR_HASH \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Login
```bash
curl -X POST http://localhost:3000/api/auth/consumer/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password"}'
```

---

## Response Status Codes

- `200` - Success
- `400` - Bad Request (invalid input)
- `401` - Unauthorized (auth required/invalid)
- `404` - Not Found (resource doesn't exist)
- `500` - Server Error

---

## JavaScript Fetch Examples

### AI Verification
```javascript
const response = await fetch('/api/verify-ai', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({ image: base64Image })
});
const data = await response.json();
```

### Get History
```javascript
const response = await fetch('/api/user/history?page=1&limit=10', {
  headers: { 'Authorization': `Bearer ${token}` }
});
const data = await response.json();
```

### QR Scan
```javascript
const response = await fetch(`/api/products/scan/${qrHash}`, {
  headers: { 'Authorization': `Bearer ${token}` }
});
const data = await response.json();
```

---

## Testing Tips

1. **Get JWT Token First:**
   ```bash
   curl -X POST http://localhost:3000/api/auth/consumer/login \
     -H "Content-Type: application/json" \
     -d '{"email":"test@test.com","password":"test123"}'
   ```

2. **Convert Image to Base64:**
   ```bash
   base64 -i image.jpg -o image.txt
   ```

3. **Test Without Auth:**
   Omit the Authorization header to test anonymous access

4. **Check Token Expiry:**
   Tokens expire after 7 days

---

## Environment Setup

Required environment variables:
```env
OPENAI_API_KEY=sk-...
NEXTAUTH_SECRET=your-secret
HEDERA_ACCOUNT_ID=0.0.xxxxx
HEDERA_PRIVATE_KEY=...
HEDERA_TOKEN_ID=0.0.xxxxx
```

---

## Database Tables

### token_transactions
- `id` - UUID
- `user_id` - UUID (references users)
- `transaction_type` - VARCHAR(50)
- `amount` - DECIMAL(10,2)
- `product_id` - UUID (references products, nullable)
- `description` - TEXT
- `hedera_transaction_id` - VARCHAR(255)
- `created_at` - TIMESTAMP

### users (updated fields)
- `hedera_account_id` - VARCHAR(50)
- `hedera_private_key` - TEXT
- `total_rewards` - DECIMAL (existing)
- `total_scans` - INTEGER (existing)

---

## Support

For detailed documentation, see:
- `docs/AI_VERIFICATION_AND_HISTORY.md` - Full API docs
- `docs/SETUP_GUIDE.md` - Setup instructions
- `docs/EXAMPLE_COMPONENTS.md` - React examples
- `docs/IMPLEMENTATION_SUMMARY.md` - Technical overview

