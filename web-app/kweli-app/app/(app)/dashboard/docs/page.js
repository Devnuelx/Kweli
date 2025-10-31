"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  BookOpen, 
  Key, 
  Code, 
  Shield, 
  AlertTriangle,
  CheckCircle,
  Copy,
  ExternalLink,
  Zap,
  Database,
  Globe,
  Play,
  Send,
  Loader2
} from "lucide-react";

export default function DocsPage() {
  const [activeSection, setActiveSection] = useState('authentication');
  const [copiedCode, setCopiedCode] = useState('');
  const [playgroundResponse, setPlaygroundResponse] = useState('');
  const [playgroundLoading, setPlaygroundLoading] = useState(false);
  const [playgroundParams, setPlaygroundParams] = useState({
    qrHash: 'abc123def456',
    batchNumber: 'BATCH-2025-001',
    companyId: 'comp_456',
    page: 1,
    limit: 50
  });
  
  const sections = [
    { id: 'authentication', title: 'Authentication', icon: Key },
    { id: 'scan-product', title: 'Scan Product', icon: Shield },
    { id: 'batch-products', title: 'Batch Products', icon: Database },
    { id: 'company-products', title: 'Company Products', icon: Globe },
    { id: 'error-handling', title: 'Error Handling', icon: AlertTriangle },
    { id: 'playground', title: 'Try it out', icon: Play }
  ];
  const ActiveIcon = sections.find(s => s.id === activeSection)?.icon;

  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(id);
    setTimeout(() => setCopiedCode(''), 2000);
  };

  const testEndpoint = async (endpoint, params = {}) => {
    setPlaygroundLoading(true);
    setPlaygroundResponse('');
    
    try {
      let url = endpoint;
      
      // Replace placeholders with actual values
      if (endpoint.includes('{qr_hash}')) {
        url = url.replace('{qr_hash}', params.qrHash || 'abc123def456');
      }
      if (endpoint.includes('{batch_number}')) {
        url = url.replace('{batch_number}', params.batchNumber || 'BATCH-2025-001');
      }
      if (endpoint.includes('{company_id}')) {
        url = url.replace('{company_id}', params.companyId || 'comp_456');
      }
      
      // Add query parameters
      const queryParams = new URLSearchParams();
      if (params.page) queryParams.append('page', params.page);
      if (params.limit) queryParams.append('limit', params.limit);
      
      if (queryParams.toString()) {
        url += `?${queryParams.toString()}`;
      }
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          // Note: In a real implementation, you'd get the API key from the user
          'Authorization': 'Bearer kw_demo_key_for_testing'
        }
      });
      
      const data = await response.json();
      setPlaygroundResponse(JSON.stringify(data, null, 2));
    } catch (error) {
      setPlaygroundResponse(JSON.stringify({
        error: 'Failed to make request',
        message: error.message
      }, null, 2));
    } finally {
      setPlaygroundLoading(false);
    }
  };

  const codeExamples = {
    authentication: {
      title: "API Key Authentication",
      description: "All API requests require authentication using your API key in the Authorization header.",
      code: `curl -X GET "https://api.kweli.com/products/scan/abc123" \\
  -H "Authorization: Bearer kw_your_api_key_here" \\
  -H "Content-Type: application/json"`,
      response: `{
  "success": true,
  "product": {
    "id": "prod_123",
    "name": "Premium Coffee",
    "authenticity": {
      "verified": true,
      "blockchain": "Hedera Hashgraph"
    }
  }
}`
    },
    'scan-product': {
      title: "Scan Product by QR Hash",
      description: "Verify a product's authenticity using its QR hash.",
      code: `curl -X GET "https://api.kweli.com/products/scan/abc123def456" \\
  -H "Authorization: Bearer kw_your_api_key_here" \\
  -H "Content-Type: application/json"`,
      response: `{
  "success": true,
  "product": {
    "id": "prod_123",
    "productId": "PROD-001",
    "name": "Premium Coffee Beans",
    "category": "Food & Beverage",
    "manufacturer": "Coffee Co.",
    "batchNumber": "BATCH-2025-001",
    "manufacturingDate": "2025-01-15",
    "expiryDate": "2026-01-15",
    "isExpired": false,
    "company": {
      "id": "comp_456",
      "name": "Coffee Company",
      "location": "Lagos, Nigeria"
    },
    "hederaExplorerUrl": "https://hashscan.io/testnet/topic/0.0.123456"
  },
  "authenticity": {
    "verified": true,
    "blockchain": "Hedera Hashgraph",
    "transactionId": "0.0.123456@1234567890.123456789",
    "topicId": "0.0.123456"
  }
}`
    },
    'batch-products': {
      title: "Get Products by Batch",
      description: "Retrieve all products in a specific batch with pagination.",
      code: `curl -X GET "https://api.kweli.com/products/batch/BATCH-2025-001?page=1&limit=50" \\
  -H "Authorization: Bearer kw_your_api_key_here" \\
  -H "Content-Type: application/json"`,
      response: `{
  "success": true,
  "products": [
    {
      "id": "prod_123",
      "productId": "PROD-001",
      "name": "Premium Coffee",
      "batchNumber": "BATCH-2025-001",
      "manufacturingDate": "2025-01-15",
      "expiryDate": "2026-01-15",
      "isExpired": false,
      "company": {
        "id": "comp_456",
        "name": "Coffee Company"
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 100,
    "pages": 2
  }
}`
    },
    'company-products': {
      title: "Get Company Products",
      description: "Retrieve all products for a company with scan statistics.",
      code: `curl -X GET "https://api.kweli.com/products/company/comp_456?page=1&limit=50" \\
  -H "Authorization: Bearer kw_your_api_key_here" \\
  -H "Content-Type: application/json"`,
      response: `{
  "success": true,
  "products": [
    {
      "id": "prod_123",
      "productId": "PROD-001",
      "name": "Premium Coffee",
      "scanStats": {
        "totalScans": 45,
        "authenticScans": 44,
        "lastScanned": "2025-01-20T10:30:00Z"
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 150,
    "pages": 3
  }
}`
    },
    'error-handling': {
      title: "Error Handling & Rate Limits",
      description: "Understanding API errors and rate limiting.",
      code: `// Rate Limit Response
{
  "success": false,
  "error": "Rate limit exceeded",
  "code": "RATE_LIMIT_EXCEEDED",
  "retryAfter": 60
}

// Product Not Found
{
  "success": false,
  "error": "Product not found",
  "code": "PRODUCT_NOT_FOUND"
}

// Invalid API Key
{
  "success": false,
  "error": "Invalid API key",
  "code": "UNAUTHORIZED"
}`,
       response: `## Rate Limits
- 1000 requests per minute per company
- 10,000 requests per day per company

## Error Codes
- 400: Bad Request
- 401: Unauthorized (Invalid API key)
- 404: Not Found (Product doesn't exist)
- 429: Rate Limit Exceeded
- 500: Internal Server Error

## Best Practices
- Implement exponential backoff for rate limits
- Cache responses when appropriate
- Use pagination for large datasets
- Handle all error responses gracefully`
     },
     playground: {
       title: "API Playground",
       description: "Test the API endpoints directly with real requests and see the responses.",
       endpoints: [
         {
           name: "Scan Product",
           method: "GET",
           path: "/api/products/scan/{qr_hash}",
           description: "Verify a product's authenticity using its QR hash",
           params: { qrHash: 'abc123def456' }
         },
         {
           name: "Get Batch Products",
           method: "GET", 
           path: "/api/products/batch/{batch_number}",
           description: "Retrieve all products in a specific batch",
           params: { batchNumber: 'BATCH-2025-001', page: 1, limit: 50 }
         },
         {
           name: "Get Company Products",
           method: "GET",
           path: "/api/products/company/{company_id}",
           description: "Retrieve all products for a company",
           params: { companyId: 'comp_456', page: 1, limit: 50 }
         }
       ]
     }
   };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Developer Documentation</h1>
        <p className="text-muted-foreground">
          API documentation for integrating with Kweli&apos;s product verification system
        </p>
      </div>

      <div className="grid lg:grid-cols-4 gap-6">
        {/* Sidebar */}
        <div className="lg:col-span-1">
          <Card className="glass-effect">
            <CardHeader>
              <CardTitle className="flex items-center">
                <BookOpen className="w-5 h-5 mr-2" />
                API Reference
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <nav className="space-y-1">
                {sections.map((section) => (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    className={`w-full flex items-center space-x-3 px-4 py-3 text-left hover:bg-accent transition-colors ${
                      activeSection === section.id ? 'bg-accent' : ''
                    }`}
                  >
                    <section.icon className="w-4 h-4" />
                    <span className="text-sm">{section.title}</span>
                  </button>
                ))}
              </nav>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3">
          <Card className="glass-effect">
            <CardHeader>
              <CardTitle className="flex items-center">
                {ActiveIcon && <ActiveIcon className="w-5 h-5 mr-2" />}
                {sections.find(s => s.id === activeSection)?.title}
              </CardTitle>
              <CardDescription>
                {codeExamples[activeSection]?.description}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Code Example */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold">Request Example</h3>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(codeExamples[activeSection]?.code, 'request')}
                  >
                    <Copy className="w-4 h-4 mr-1" />
                    {copiedCode === 'request' ? 'Copied!' : 'Copy'}
                  </Button>
                </div>
                <div className="bg-muted rounded-lg p-4 overflow-x-auto">
                  <pre className="text-sm font-mono whitespace-pre-wrap">
                    {codeExamples[activeSection]?.code}
                  </pre>
                </div>
              </div>

              {/* Response Example */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold">Response Example</h3>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(codeExamples[activeSection]?.response, 'response')}
                  >
                    <Copy className="w-4 h-4 mr-1" />
                    {copiedCode === 'response' ? 'Copied!' : 'Copy'}
                  </Button>
                </div>
                <div className="bg-muted rounded-lg p-4 overflow-x-auto">
                  <pre className="text-sm font-mono whitespace-pre-wrap">
                    {codeExamples[activeSection]?.response}
                  </pre>
                </div>
              </div>

               {/* Playground Section */}
               {activeSection === 'playground' && (
                 <div className="space-y-6">
                   <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
                     <div className="flex items-center space-x-3 mb-4">
                       <Play className="w-6 h-6 text-blue-600" />
                       <div>
                         <h4 className="font-semibold text-blue-900 dark:text-blue-100">Interactive API Testing</h4>
                         <p className="text-sm text-blue-700 dark:text-blue-300">
                           Test API endpoints with real requests and see live responses
                         </p>
                       </div>
                     </div>
                     
                     <div className="grid md:grid-cols-2 gap-4">
                       {codeExamples.playground.endpoints.map((endpoint, index) => (
                         <div key={index} className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                           <div className="flex items-center justify-between mb-3">
                             <div>
                               <h5 className="font-semibold">{endpoint.name}</h5>
                               <p className="text-sm text-gray-600 dark:text-gray-400">{endpoint.description}</p>
                             </div>
                             <Badge variant="outline" className="text-xs">
                               {endpoint.method}
                             </Badge>
                           </div>
                           
                           <div className="space-y-3">
                             <div>
                               <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                                 Endpoint Path
                               </label>
                               <code className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                                 {endpoint.path}
                               </code>
                             </div>
                             
                             <div className="flex space-x-2">
                               <Button
                                 size="sm"
                                 onClick={() => testEndpoint(endpoint.path, endpoint.params)}
                                 disabled={playgroundLoading}
                                 className="flex-1"
                               >
                                 {playgroundLoading ? (
                                   <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                                 ) : (
                                   <Send className="w-4 h-4 mr-1" />
                                 )}
                                 Test
                               </Button>
                             </div>
                           </div>
                         </div>
                       ))}
                     </div>
                   </div>
                   
                   {/* Response Display */}
                   {playgroundResponse && (
                     <div>
                       <div className="flex items-center justify-between mb-3">
                         <h3 className="font-semibold">Response</h3>
                         <Button
                           variant="outline"
                           size="sm"
                           onClick={() => copyToClipboard(playgroundResponse, 'playground')}
                         >
                           <Copy className="w-4 h-4 mr-1" />
                           {copiedCode === 'playground' ? 'Copied!' : 'Copy'}
                         </Button>
                       </div>
                       <div className="bg-muted rounded-lg p-4 overflow-x-auto">
                         <pre className="text-sm font-mono whitespace-pre-wrap">
                           {playgroundResponse}
                         </pre>
                       </div>
                     </div>
                   )}
                   
                   {/* Parameters Section */}
                   <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                     <h4 className="font-semibold mb-3">Test Parameters</h4>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                       <div>
                         <label className="block text-sm font-medium mb-2">QR Hash</label>
                         <input
                           type="text"
                           value={playgroundParams.qrHash}
                           onChange={(e) => setPlaygroundParams({...playgroundParams, qrHash: e.target.value})}
                           className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-sm"
                           placeholder="abc123def456"
                         />
                       </div>
                       <div>
                         <label className="block text-sm font-medium mb-2">Batch Number</label>
                         <input
                           type="text"
                           value={playgroundParams.batchNumber}
                           onChange={(e) => setPlaygroundParams({...playgroundParams, batchNumber: e.target.value})}
                           className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-sm"
                           placeholder="BATCH-2025-001"
                         />
                       </div>
                       <div>
                         <label className="block text-sm font-medium mb-2">Company ID</label>
                         <input
                           type="text"
                           value={playgroundParams.companyId}
                           onChange={(e) => setPlaygroundParams({...playgroundParams, companyId: e.target.value})}
                           className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-sm"
                           placeholder="comp_456"
                         />
                       </div>
                       <div>
                         <label className="block text-sm font-medium mb-2">Page</label>
                         <input
                           type="number"
                           value={playgroundParams.page}
                           onChange={(e) => setPlaygroundParams({...playgroundParams, page: parseInt(e.target.value) || 1})}
                           className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-sm"
                           min="1"
                         />
                       </div>
                       <div>
                         <label className="block text-sm font-medium mb-2">Limit</label>
                         <input
                           type="number"
                           value={playgroundParams.limit}
                           onChange={(e) => setPlaygroundParams({...playgroundParams, limit: parseInt(e.target.value) || 50})}
                           className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-sm"
                           min="1"
                           max="100"
                         />
                       </div>
                     </div>
                   </div>
                 </div>
               )}

               {/* Additional Info for specific sections */}
               {activeSection === 'authentication' && (
                 <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                   <div className="flex items-start space-x-3">
                     <Shield className="w-5 h-5 text-blue-600 mt-0.5" />
                     <div>
                       <h4 className="font-semibold text-blue-900 dark:text-blue-100">Security Note</h4>
                       <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                         Keep your API key secure and never expose it in client-side code. 
                         Store it securely in environment variables or secure key management systems.
                       </p>
                     </div>
                   </div>
                 </div>
               )}

               {activeSection === 'error-handling' && (
                 <div className="grid md:grid-cols-2 gap-4">
                   <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                     <div className="flex items-center space-x-2 mb-2">
                       <CheckCircle className="w-4 h-4 text-green-600" />
                       <span className="font-semibold text-green-900 dark:text-green-100">Success Response</span>
                     </div>
                     <p className="text-sm text-green-700 dark:text-green-300">
                       All successful responses include a&quot;success: true&quot; field and the requested data.
                     </p>
                   </div>
                   
                   <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                     <div className="flex items-center space-x-2 mb-2">
                       <AlertTriangle className="w-4 h-4 text-red-600" />
                       <span className="font-semibold text-red-900 dark:text-red-100">Error Response</span>
                     </div>
                     <p className="text-sm text-red-700 dark:text-red-300">
                       Error responses include &quot;success&quot;: false, an error message, and an error code.
                     </p>
                   </div>
                 </div>
               )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Quick Start */}
      <Card className="glass-effect">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Zap className="w-5 h-5 mr-2" />
            Quick Start Guide
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Key className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">1. Get Your API Key</h3>
              <p className="text-sm text-muted-foreground">
                Generate your API key in the Settings page to start making requests.
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Code className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">2. Make Your First Request</h3>
              <p className="text-sm text-muted-foreground">
                Use the scan endpoint to verify product authenticity with a QR hash.
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">3. Handle Responses</h3>
              <p className="text-sm text-muted-foreground">
                Process the response to display product information and authenticity status.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

