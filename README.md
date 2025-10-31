# Kweli

> **Built for Hedera Hack Africa 2025**  
> Know the kweli, it will set you free.

We're building a blockchain-powered authentication platform that makes it super simple for businesses to protect their products and for consumers to verify what they're buying—all while earning rewards for doing the right thing. Businesses help save lives, get thier trust and value back users earn $VFY

---

## Submission Materials

- **Pitch Deck:** [View our pitch deck here](https://drive.google.com/drive/u/0/folders/1f5Z8o_3AICdk-6hQe4S0FTRMZhHM5M8N)
- **Hedera Certification:** [View certification](./submission-material/Hashgraph%20Certificate.pdf)
-**Live Demo:**[View Demo](https://youtu.be/BFePv2-5DUw)
- **Webapp Demo:** [kweli-web.vercel.app](https://kweli-web.vercel.app)
- **Mobile App:** [Try with Expo](https://expo.dev/preview/update?message=Added+index+entry+point&updateRuntimeVersion=1.0.0&createdAt=2025-10-28T05%3A39%3A29.412Z&slug=exp&projectId=aea820d4-6839-4ab6-a9ef-be6944be8cf0&group=f17efc63-436e-42dd-b5f1-a78ad467a46e)
**X:**:[text](https://x.com/Kweliofficial?t=Os_Q_U-PrZJi-OTnYcWXRw&s=09)
---

## Inspiration

Every year, 500,000 people die in Sub-Saharan Africa because of fake medicines and counterfeit products. In Nigeria alone, 70% of pharmaceutical products in circulation are either fake or substandard. This isn't just a business problem—it's a human tragedy that costs lives and destroys trust.

### The Numbers That Keep Us Up at Night
- **$1.79 trillion** — that's how big the global counterfeit market will be by 2030. A 75% jump from 2023.
- **500,000 deaths every year** in Sub-Saharan Africa from fake products
- **267,000 people** die from counterfeit anti-malarial drugs alone
- **169,271 children** lose their lives annually to fake pneumonia antibiotics

### What This Looks Like in Nigeria
I've seen this firsthand. Walk into any market in Lagos, and you'll find:
- **70% of medicines** are fake or substandard (NPHD, 2022)
- **₦200 billion** ($130M) lost every year just from counterfeit drugs
- **240+ illegal production shops** discovered in just one market raid in Aba
- **60% of smartphones** in some areas are knockoffs
- **40% of Pfizer medicines in Nigeria are illegally imported fakes**

---

## Our Solution

Kweli is a blockchain-powered authentication platform that makes product verification as easy as scanning a QR code. No complex integrations, no expensive overhauls, just straightforward protection built on Hedera's lightning-fast infrastructure.

### How It Works

1. **Businesses** Creates company accounts register their products on our dashboard in minutes and upload thier product design as template
2. We generate a **unique QR code** for each product, secured on the Hedera blockchain, ready to download as individual qrcode or directly embed it to products design, this removes a huge pain point and extra cost.
3. **Consumers** scan the code with our mobile app (or upload a photo for AI verification)
4. If it's legit, they get confirmation instantly—plus **VFY tokens** they can redeem for airtime or data
5. Everything is **tamper-proof** and recorded permanently on the blockchain

---

## What Makes Kweli Different

### **Dual Verification System**
- **QR Code Scanning:** Point, click, verify. Takes 3 seconds. Earn 10 tokens.
- **AI Image Analysis:** No QR code? No problem. Upload a photo and our AI checks if it's real. Earn 5-15 tokens based on confidence.

### **Rewards That Matter**
We're not giving out useless points. VFY tokens can be redeemed for:
- Mobile airtime
- Data bundles
- Future: Discounts with partner brands

Because fighting counterfeits should benefit everyone, not just businesses.

### **Business Dashboard Built for Reality**
Most anti-counterfeit solutions require you to redesign your entire packaging line. Not ours.
- Register products one-by-one or bulk import via CSV
- Generate QR codes in seconds
- Track verifications in real-time
- View supply chain analytics
- Set up in **Minutes**, not 6 months

### **Mobile-First Design**
Our app works where your customers are—on their phones, even with spotty internet:
- Offline-first architecture
- Built-in wallet for VFY tokens
- Verification history
- Achievement badges (because gamification works)
- Camera-first UX designed for markets, not boardrooms

### **Security That Actually Works**
- SHA-384 hashing for QR generation (using company-specific secrets)
- Hedera Consensus Service for immutable logging
- Duplicate scan prevention
- Tamper-proof audit trails

---

## Why We Chose Hedera

We will process alot of transaction and it will require speed and low cost so as not to overwhelm bussinesses with too much cost and make sure to have something to reward users from .Hedera is the only blockchain that makes sense for supply chain integration, cost and speed is everything.

### **Hedera Consensus Service (HCS)**
We use HCS to log every single action:
- Product registrations
- QR verifications
- AI checks
- Supply chain events

Everything gets a consensus timestamp and becomes permanent. No one can fake this. Not businesses, not us, not anyone.

### **Hedera Token Service (HTS)**
Our VFY token runs on HTS:
- **100 million fixed supply** (no inflation shenanigans)
- 2 decimals for easy math
- Treasury and operator keys for security
- Automatic rewards distribution based on verification points

### **The Numbers That Matter**
- **$0.0001 per transaction** vs $5-50 on Ethereum (99.8% cost savings)
- **10,000 TPS** vs 12-15 on Ethereum (667x faster)
- **0.000003 kWh per transaction** vs 800 kWh on Bitcoin (266 million times more efficient)

We're not trying to save the planet here, but we're also not trying to destroy it.

---

## Why Businesses Should Care (ROI Breakdown)

Let me show you the actual money we're saving companies:

| Traditional Problem | Old Cost | Kweli Solution | Your Savings |
|---------------------|----------|----------------|--------------|
| Redesigning packaging | $50K-$500K | Digital integration in 48hrs | **Save $50K-$500K** |
| Building blockchain infra | $120K-$200K/year dev team | Plug-and-play dashboard | **Save $150K-$300K/year** |
| Manual supply chain tracking | Hours of labor daily | Real-time blockchain logs | **70% time, 30-37% cost reduction** |
| Customer engagement | Passive protection only | Active reward system | **15-25% revenue growth potential** |
| Ethereum gas fees | $5-$50/transaction | Hedera fixed at $0.0001 | **99.8% cost savings** |

Plus you get compliance records for free, avoid regulatory fines, and build consumer trust that actually translates to sales.

---

## Tech Stack

We built this to be maintainable and scalable:

**Frontend:** Next.js (because React is king and server-side rendering matters)  
**Backend:** Next.js API Routes (keep it simple)  
**Blockchain:** Hedera Hashgraph (obviously)  
**Database:** Supabase (PostgreSQL that doesn't hate you)  
**Mobile:** React Native with Expo (write once, run everywhere)  
**Auth:** NextAuth.js + Supabase + JWT  
**AI:** OpenAI GPT-4 Vision (for image verification)  

---

## 📂 Project Structure

```
kweli/
├── web-app/                 # Main business dashboard
│   ├── app/
│   │   ├── (app)/          # Protected routes
│   │   │   └── dashboard/  # Business management
│   │   └── (public)/       # Public pages
│   │       ├── login/
│   │       ├── signup/
│   │       └── verify/     # Consumer verification
│   ├── api/                # Backend endpoints
│   ├── components/         # Reusable UI
│   ├── lib/
│   │   ├── hedera/        # Hedera SDK integration
│   │   └── services/      # AI, QR, CSV logic
│   └── database/          # Supabase migrations
│
├── mobile-app/             # Consumer mobile app
│   ├── app/
│   │   ├── (tabs)/        # Home, wallet, history
│   │   ├── auth/          # Login/signup
│   │   └── result/        # Verification results
│   ├── services/          # API & storage
│   └── components/        # Mobile UI components
│
└── docs/                  # Documentation
```

---

## Getting Started

### What You'll Need
- Node.js 18+ (use 20.x for best results)
- A Supabase account (free tier works fine)
- Hedera testnet account ([portal.hedera.com](https://portal.hedera.com))
- OpenAI API key
- Expo Go app (for mobile testing)

### Setting Up the Web App

```bash
# Clone and enter the project
git clone https://github.com/Tuunechi/kweli.git
cd kweli/web-app/kweli-app

# Install dependencies
npm install

# Set up your environment variables
cp .env.example .env.local
# Edit .env.local with your keys:
# - NEXT_PUBLIC_SUPABASE_URL
# - NEXT_PUBLIC_SUPABASE_ANON_KEY
# - HEDERA_ACCOUNT_ID
# - HEDERA_PRIVATE_KEY
# - HEDERA_TOKEN_ID
# - OPENAI_API_KEY
# - NEXTAUTH_SECRET
# - NEXTAUTH_URL

# Run the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and you're live.

### Setting Up the Mobile App

```bash
cd kweli/mobile-app/kweli-user-app

# Install dependencies
npm install

# Start the Expo dev server
npm start
```

Scan the QR code with Expo Go on your phone. Make sure to grant camera permissions when prompted.

---

## API Endpoints

Our backend is straightforward. Here's what's available:

| Endpoint | Method | What It Does |
|----------|--------|--------------|
| `/api/auth/consumer/signup` | POST | Register new user |
| `/api/auth/consumer/login` | POST | User login |
| `/api/products/register` | POST | Register single product |
| `/api/products/csv-import` | POST | Bulk import products |
| `/api/products/list` | GET | List all products |
| `/api/products/scan/:qr_hash` | GET | Verify QR code |
| `/api/verify-ai` | POST | AI image verification |
| `/api/user/history` | GET | User's verification history |
| `/api/transfer` | POST | Transfer VFY tokens |

---

## Token Rewards

We keep the rewards simple:

| Action | Tokens Earned | Requirements |
|--------|---------------|--------------|
| QR Code Scan | 10 VFY | Must be logged in |
| AI Verification | 5-15 VFY | AI confidence ≥ 70% |
| Achievement Milestones | Bonus VFY | Badges at 1, 10, 50, 100 scans |

---

## Running Tests & Building

```bash
# Lint your code
npm run lint

# Build for production (web)
npm run build

# Build mobile app
cd mobile-app/kweli-user-app
eas build
```

---

## What's Next

We're just getting started. Here's what we're building next:

1. **DIve Deeper into AI verification** (using and training specialised models)
2. **Partnerships with NAFDAC** (Nigeria's FDA equivalent)
3. **Supply chain tracking** (full journey from manufacturer to consumer)
4. **Token redemption partnerships** (telcos, retailers, pharmacies)

---

##  Contributing

Want to help fight counterfeits? Here's how:

1. Fork this repo
2. Create a feature branch (`git checkout -b feature/amazing-idea`)
3. Write clean, tested code
4. Commit with clear messages
5. Submit a pull request

We review PRs within 48 hours.

---

## License

MIT License — Use it, modify it, build on it. Just make the world a little safer.

---

## Thanks To

- **Hedera** for making blockchain actually usable in Africa
- **OpenAI** for the vision models that power our AI verification
- **Supabase** for database infrastructure that just works
- **The Hedera Africa community** for the support and feedback

---

## Final Thoughts

Every time someone scans a QR code on Kweli, they're not just verifying a product, they're casting a vote for a more transparent, trustworthy marketplace. They're protecting their families. They're saving lives.

This isn't some abstract blockchain experiment. This is about making sure a mother in Lagos doesn't lose her child to fake antibiotics. It's about ensuring a farmer's investment in fertilizer actually helps his crops grow. It's about trust, transparency, and accountability in markets where all three have been destroyed by counterfeits.

We're not trying to win a hackathon (okay, maybe a little). We're trying to solve a real problem that's killing real people. And we think Hedera gives us the best shot at actually making this work.

Thanks for taking the time to check out Kweli. Let's build something that matters.

---

🔗 **Live Demo:** [kweli-web.vercel.app](https://kweli-web.vercel.app) 
**COntact:** Kweliteam@gmail.com