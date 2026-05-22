# Example React Components

Example components showing how to integrate AI verification and transaction history into your frontend.

## 1. AI Product Verification Component

```jsx
// components/AiProductVerifier.jsx
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export default function AiProductVerifier() {
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [preview, setPreview] = useState(null);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target.result);
    reader.readAsDataURL(file);

    // Store file for upload
    setImage(file);
    setResult(null);
  };

  const verifyProduct = async () => {
    if (!image) return;

    setLoading(true);
    setResult(null);

    try {
      // Convert image to base64
      const reader = new FileReader();
      reader.readAsDataURL(image);

      reader.onload = async () => {
        const base64Image = reader.result.split(',')[1];

        // Get token from localStorage
        const token = localStorage.getItem('token');

        const response = await fetch('/api/verify-ai', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token && { 'Authorization': `Bearer ${token}` })
          },
          body: JSON.stringify({ image: base64Image })
        });

        const data = await response.json();
        setResult(data);
        setLoading(false);
      };
    } catch (error) {
      console.error('Verification error:', error);
      setResult({
        success: false,
        error: 'Failed to verify product'
      });
      setLoading(false);
    }
  };

  const getConfidenceColor = (confidence) => {
    if (confidence >= 80) return 'text-green-600';
    if (confidence >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <Card className="p-6">
        <h2 className="text-2xl font-bold mb-4">AI Product Verification</h2>
        <p className="text-gray-600 mb-6">
          Upload a photo of the product to verify its authenticity using AI
        </p>

        {/* Image Upload */}
        <div className="mb-6">
          <input
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            className="hidden"
            id="image-upload"
          />
          <label htmlFor="image-upload">
            <Button as="span" className="cursor-pointer">
              Choose Image
            </Button>
          </label>
        </div>

        {/* Image Preview */}
        {preview && (
          <div className="mb-6">
            <img
              src={preview}
              alt="Preview"
              className="max-w-full h-64 object-contain rounded-lg border"
            />
          </div>
        )}

        {/* Verify Button */}
        {image && (
          <Button
            onClick={verifyProduct}
            disabled={loading}
            className="w-full mb-6"
          >
            {loading ? 'Verifying...' : 'Verify Product'}
          </Button>
        )}

        {/* Results */}
        {result && (
          <div className="mt-6 p-4 border rounded-lg">
            {result.success ? (
              <>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-semibold">
                    {result.verified ? '✅ Verified' : '⚠️ Uncertain'}
                  </h3>
                  <span className={`text-2xl font-bold ${getConfidenceColor(result.confidence)}`}>
                    {result.confidence}%
                  </span>
                </div>

                <div className="space-y-2 mb-4">
                  <p><strong>Brand:</strong> {result.product.brandName}</p>
                  <p><strong>Product:</strong> {result.product.productName}</p>
                  <p><strong>Category:</strong> {result.product.category}</p>
                  <p><strong>Packaging Quality:</strong> {result.product.packagingQuality}/10</p>
                </div>

                {/* Analysis */}
                <div className="mb-4">
                  <h4 className="font-semibold mb-2">Analysis:</h4>
                  <ul className="list-disc list-inside space-y-1">
                    {result.analysis.map((item, idx) => (
                      <li key={idx} className="text-sm">{item}</li>
                    ))}
                  </ul>
                </div>

                {/* Reward Info */}
                {result.reward.credited && (
                  <div className="bg-green-50 border border-green-200 rounded p-3">
                    <p className="text-green-800 font-semibold">
                      🎉 You earned {result.reward.amount} tokens!
                    </p>
                  </div>
                )}

                {result.reward.requiresLogin && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
                    <p className="text-yellow-800">
                      🔒 Login to earn tokens for verifications
                    </p>
                  </div>
                )}

                <p className="text-sm text-gray-600 mt-4">{result.message}</p>
              </>
            ) : (
              <div className="text-red-600">
                <p className="font-semibold">Error</p>
                <p>{result.error}</p>
              </div>
            )}
          </div>
        )}
      </Card>
    </div>
  );
}
```

## 2. Transaction History Component

```jsx
// components/TransactionHistory.jsx
'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function TransactionHistory() {
  const [transactions, setTransactions] = useState([]);
  const [summary, setSummary] = useState(null);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  useEffect(() => {
    fetchHistory();
  }, [page]);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/user/history?page=${page}&limit=10`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (data.success) {
        setTransactions(data.transactions);
        setSummary(data.summary);
        setPagination(data.pagination);
      }
    } catch (error) {
      console.error('Failed to fetch history:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'qr_scan': return '📱';
      case 'ai_verification': return '🤖';
      case 'transfer': return '💸';
      case 'reward': return '🎁';
      default: return '💰';
    }
  };

  const getTypeLabel = (type) => {
    switch (type) {
      case 'qr_scan': return 'QR Scan';
      case 'ai_verification': return 'AI Verification';
      case 'transfer': return 'Transfer';
      case 'reward': return 'Reward';
      default: return type;
    }
  };

  const formatDate = (timestamp) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center p-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Summary Card */}
      {summary && (
        <Card className="p-6 mb-6 bg-gradient-to-r from-blue-50 to-purple-50">
          <h2 className="text-2xl font-bold mb-4">Token Balance</h2>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-gray-600 text-sm">Current Balance</p>
              <p className="text-3xl font-bold text-blue-600">
                {summary.currentBalance}
              </p>
              <p className="text-sm text-gray-500">tokens</p>
            </div>
            <div>
              <p className="text-gray-600 text-sm">Total Scans</p>
              <p className="text-3xl font-bold text-green-600">
                {summary.totalScans}
              </p>
              <p className="text-sm text-gray-500">products</p>
            </div>
            <div>
              <p className="text-gray-600 text-sm">Transactions</p>
              <p className="text-3xl font-bold text-purple-600">
                {summary.totalTransactions}
              </p>
              <p className="text-sm text-gray-500">total</p>
            </div>
          </div>
        </Card>
      )}

      {/* Transaction List */}
      <Card className="p-6">
        <h3 className="text-xl font-bold mb-4">Transaction History</h3>

        {transactions.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <p className="text-lg">No transactions yet</p>
            <p className="text-sm">Start scanning products to earn tokens!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {transactions.map((tx) => (
              <div
                key={tx.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition"
              >
                <div className="flex items-center space-x-4 flex-1">
                  <div className="text-3xl">{getTypeIcon(tx.type)}</div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-semibold">{getTypeLabel(tx.type)}</span>
                      <span className="text-green-600 font-bold">+{tx.amount}</span>
                    </div>
                    <p className="text-sm text-gray-600">{tx.description}</p>
                    {tx.product && (
                      <p className="text-xs text-gray-500">
                        {tx.product.name} • {tx.product.company?.name}
                      </p>
                    )}
                    <p className="text-xs text-gray-400">{formatDate(tx.timestamp)}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500">Balance</p>
                  <p className="font-semibold">{tx.balanceAfter}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div className="flex justify-center items-center space-x-4 mt-6">
            <Button
              onClick={() => setPage(page - 1)}
              disabled={!pagination.hasPreviousPage}
              variant="outline"
            >
              Previous
            </Button>
            <span className="text-sm text-gray-600">
              Page {pagination.currentPage} of {pagination.totalPages}
            </span>
            <Button
              onClick={() => setPage(page + 1)}
              disabled={!pagination.hasNextPage}
              variant="outline"
            >
              Next
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
}
```

## 3. QR Scanner with Rewards Component

```jsx
// components/QrScannerWithRewards.jsx
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export default function QrScannerWithRewards() {
  const [qrHash, setQrHash] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const scanProduct = async () => {
    if (!qrHash) return;

    setLoading(true);
    setResult(null);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/products/scan/${qrHash}`, {
        headers: {
          ...(token && { 'Authorization': `Bearer ${token}` })
        }
      });

      const data = await response.json();
      setResult(data);
    } catch (error) {
      console.error('Scan error:', error);
      setResult({
        success: false,
        error: 'Failed to scan product'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <Card className="p-6">
        <h2 className="text-2xl font-bold mb-4">Scan QR Code</h2>

        <div className="mb-4">
          <input
            type="text"
            value={qrHash}
            onChange={(e) => setQrHash(e.target.value)}
            placeholder="Enter QR hash"
            className="w-full px-4 py-2 border rounded-lg"
          />
        </div>

        <Button
          onClick={scanProduct}
          disabled={loading || !qrHash}
          className="w-full"
        >
          {loading ? 'Scanning...' : 'Scan Product'}
        </Button>

        {result && (
          <div className="mt-6">
            {result.success ? (
              <div className="space-y-4">
                <div className="bg-green-50 border border-green-200 rounded p-4">
                  <p className="font-semibold text-green-800">{result.message}</p>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Product Information</h3>
                  <p><strong>Name:</strong> {result.product.name}</p>
                  <p><strong>Manufacturer:</strong> {result.product.manufacturer}</p>
                  <p><strong>Batch:</strong> {result.product.batchNumber}</p>
                  {result.product.isExpired && (
                    <p className="text-red-600 font-semibold">⚠️ EXPIRED</p>
                  )}
                </div>

                {result.reward.credited && (
                  <div className="bg-blue-50 border border-blue-200 rounded p-4">
                    <p className="text-blue-800 font-semibold text-center text-lg">
                      🎉 You earned {result.reward.amount} tokens!
                    </p>
                  </div>
                )}

                {result.reward.requiresLogin && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded p-4">
                    <p className="text-yellow-800 text-center">
                      🔒 Login to earn {result.reward.amount} tokens per scan
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-red-50 border border-red-200 rounded p-4">
                <p className="text-red-800">{result.error}</p>
              </div>
            )}
          </div>
        )}
      </Card>
    </div>
  );
}
```

## 4. User Dashboard with All Features

```jsx
// app/dashboard/user/page.jsx
'use client';

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AiProductVerifier from '@/components/AiProductVerifier';
import TransactionHistory from '@/components/TransactionHistory';
import QrScannerWithRewards from '@/components/QrScannerWithRewards';

export default function UserDashboard() {
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-8">User Dashboard</h1>

      <Tabs defaultValue="verify" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="verify">AI Verify</TabsTrigger>
          <TabsTrigger value="scan">QR Scan</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        <TabsContent value="verify">
          <AiProductVerifier />
        </TabsContent>

        <TabsContent value="scan">
          <QrScannerWithRewards />
        </TabsContent>

        <TabsContent value="history">
          <TransactionHistory />
        </TabsContent>
      </Tabs>
    </div>
  );
}
```

## Usage

1. Copy these components to your project
2. Adjust imports based on your file structure
3. Update styling to match your design system
4. Add these routes to your app:
   - `/verify` - AI verification page
   - `/history` - Transaction history page
   - `/scan` - QR scanning page

## Customization

- Modify the UI components to match your design system
- Add loading skeletons for better UX
- Implement camera capture for mobile
- Add filters for transaction history
- Export transaction history to CSV
- Add charts/graphs for token earnings

## Notes

- Store JWT tokens securely (httpOnly cookies preferred over localStorage)
- Add proper error boundaries
- Implement retry logic for failed API calls
- Add optimistic UI updates for better UX
- Consider using React Query or SWR for data fetching

