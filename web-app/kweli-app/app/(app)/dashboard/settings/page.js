"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Settings, 
  User, 
  Shield, 
  Bell,
  Key,
  Save,
  Loader2
} from "lucide-react";

export default function SettingsPage() {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [apiKeyLoading, setApiKeyLoading] = useState(false);
  const [companyInfo, setCompanyInfo] = useState({
    name: session?.user?.name || '',
    email: session?.user?.email || '',
    website: '',
    description: ''
  });

  useEffect(() => {
    fetchApiKey();
  }, []);

  const fetchApiKey = async () => {
    try {
      const response = await fetch('/api/settings/api-key');
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setApiKey(data.apiKey);
        }
      }
    } catch (error) {
      console.error('Error fetching API key:', error);
    }
  };

  const regenerateApiKey = async () => {
    setApiKeyLoading(true);
    try {
      const response = await fetch('/api/settings/api-key/regenerate', {
        method: 'POST',
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setApiKey(data.apiKey);
          alert('API key regenerated successfully! Please save this key securely.');
        }
      } else {
        alert('Failed to regenerate API key');
      }
    } catch (error) {
      alert('Error regenerating API key');
    } finally {
      setApiKeyLoading(false);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    setLoading(false);
    alert('Settings saved successfully!');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground">
          Manage your company profile and preferences
        </p>
      </div>

      {/* Company Profile */}
      <Card className="glass-effect">
        <CardHeader>
          <CardTitle className="flex items-center">
            <User className="w-5 h-5 mr-2" />
            Company Profile
          </CardTitle>
          <CardDescription>
            Update your company information and branding
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Company Name</label>
              <Input
                value={companyInfo.name}
                onChange={(e) => setCompanyInfo({...companyInfo, name: e.target.value})}
                placeholder="Your company name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Email</label>
              <Input
                value={companyInfo.email}
                disabled
                className="bg-muted"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Website</label>
              <Input
                value={companyInfo.website}
                onChange={(e) => setCompanyInfo({...companyInfo, website: e.target.value})}
                placeholder="https://yourcompany.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Industry</label>
              <Input
                placeholder="e.g., Food & Beverage"
                disabled
                className="bg-muted"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Description</label>
            <textarea
              value={companyInfo.description}
              onChange={(e) => setCompanyInfo({...companyInfo, description: e.target.value})}
              placeholder="Tell us about your company..."
              className="w-full px-3 py-2 bg-input border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary min-h-[100px]"
            />
          </div>
        </CardContent>
      </Card>

      {/* Security Settings */}
      <Card className="glass-effect">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Shield className="w-5 h-5 mr-2" />
            Security
          </CardTitle>
          <CardDescription>
            Manage your account security and API access
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-card/50 rounded-lg">
            <div>
              <h3 className="font-semibold">API Key</h3>
              <p className="text-sm text-muted-foreground">
                Use this key to integrate with our API
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <code className="px-3 py-1 bg-muted rounded text-sm font-mono">
                {apiKey || 'Loading...'}
              </code>
              <Button 
                variant="outline" 
                size="sm"
                onClick={regenerateApiKey}
                disabled={apiKeyLoading}
              >
                {apiKeyLoading ? (
                  <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                ) : (
                  <Key className="w-4 h-4 mr-1" />
                )}
                Regenerate
              </Button>
            </div>
          </div>
          
          <div className="flex items-center justify-between p-4 bg-card/50 rounded-lg">
            <div>
              <h3 className="font-semibold">Two-Factor Authentication</h3>
              <p className="text-sm text-muted-foreground">
                Add an extra layer of security to your account
              </p>
            </div>
            <Button variant="outline" size="sm">
              Enable 2FA
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card className="glass-effect">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Bell className="w-5 h-5 mr-2" />
            Notifications
          </CardTitle>
          <CardDescription>
            Choose what notifications you want to receive
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold">Product Scans</h3>
                <p className="text-sm text-muted-foreground">
                  Get notified when your products are scanned
                </p>
              </div>
              <Badge variant="default">Enabled</Badge>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold">Counterfeit Alerts</h3>
                <p className="text-sm text-muted-foreground">
                  Immediate alerts when counterfeits are detected
                </p>
              </div>
              <Badge variant="default">Enabled</Badge>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold">Weekly Reports</h3>
                <p className="text-sm text-muted-foreground">
                  Summary of your product verification activity
                </p>
              </div>
              <Badge variant="outline">Disabled</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Account Status */}
      <Card className="glass-effect">
        <CardHeader>
          <CardTitle>Account Status</CardTitle>
          <CardDescription>
            Your current plan and usage information
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-card/50 rounded-lg">
              <h3 className="font-semibold mb-2">Plan</h3>
              <Badge variant="default">Free Tier</Badge>
              <p className="text-sm text-muted-foreground mt-2">
                Up to 100 products
              </p>
            </div>
            <div className="p-4 bg-card/50 rounded-lg">
              <h3 className="font-semibold mb-2">Products</h3>
              <p className="text-2xl font-bold">0 / 100</p>
              <p className="text-sm text-muted-foreground">
                Products registered
              </p>
            </div>
            <div className="p-4 bg-card/50 rounded-lg">
              <h3 className="font-semibold mb-2">Scans</h3>
              <p className="text-2xl font-bold">0</p>
              <p className="text-sm text-muted-foreground">
                Total verifications
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              Save Changes
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
