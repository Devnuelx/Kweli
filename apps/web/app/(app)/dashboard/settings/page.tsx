"use client";

import { useState, useEffect } from "react";
import {
  Key,
  Plus,
  Trash2,
  Copy,
  Check,
  Building,
  ShieldCheck,
  Loader2,
  AlertCircle,
  X,
  Calendar,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api-client";

interface ApiKeyItem {
  id: string;
  name: string;
  keyPrefix: string;
  lastUsedAt?: string | null;
  createdAt: string;
}

export default function SettingsPage() {
  const { user } = useAuth();

  const [keys, setKeys] = useState<ApiKeyItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [keyName, setKeyName] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createdKeyData, setCreatedKeyData] = useState<{
    name: string;
    apiKey: string;
  } | null>(null);
  const [copiedKey, setCopiedKey] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchKeys();
  }, []);

  const fetchKeys = async () => {
    try {
      const data = await api.apiKeys.list();
      setKeys(data || []);
    } catch (err: any) {
      console.error("Failed to load API keys:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!keyName.trim()) return;

    setCreating(true);
    setError(null);

    try {
      const res = await api.apiKeys.create(keyName.trim());
      setCreatedKeyData({
        name: res.name,
        apiKey: res.apiKey,
      });
      setKeyName("");
      setShowCreateModal(false);
      fetchKeys();
    } catch (err: any) {
      setError(err.message || "Failed to generate API key");
    } finally {
      setCreating(false);
    }
  };

  const handleRevokeKey = async (keyId: string, name: string) => {
    if (!confirm(`Are you sure you want to revoke API key "${name}"? External systems using it will lose access immediately.`)) {
      return;
    }

    try {
      await api.apiKeys.revoke(keyId);
      setKeys((prev) => prev.filter((k) => k.id !== keyId));
    } catch (err: any) {
      alert(`Failed to revoke key: ${err.message}`);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 3000);
  };

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return "Never";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const org = user?.memberships?.[0]?.organization;

  return (
    <div className="max-w-5xl mx-auto space-y-8 text-white">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Workspace & Developer Settings</h1>
        <p className="text-gray-400 mt-1">
          Manage brand legal entity details, authentication credentials, and developer API keys.
        </p>
      </div>

      {/* Organization Details Card */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-6 sm:p-8 space-y-6">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-blue-600/20 rounded-xl flex items-center justify-center shrink-0">
            <Building className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold">Organization Profile</h2>
            <p className="text-xs text-gray-400">Verified manufacturer entity details</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2 border-t border-white/10 text-sm">
          <div>
            <span className="text-xs text-gray-400 block uppercase tracking-wider mb-1">
              Legal Business Name
            </span>
            <span className="font-semibold text-white">
              {org?.legalName || "Not configured"}
            </span>
          </div>

          <div>
            <span className="text-xs text-gray-400 block uppercase tracking-wider mb-1">
              Trading / Brand Name
            </span>
            <span className="font-semibold text-white">
              {org?.tradingName || org?.legalName || "Not configured"}
            </span>
          </div>

          <div>
            <span className="text-xs text-gray-400 block uppercase tracking-wider mb-1">
              KYB Verification Status
            </span>
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-green-500/20 text-green-400 border border-green-500/30">
              <ShieldCheck className="w-3.5 h-3.5 mr-1" />
              {org?.kybStatus || "VERIFIED"}
            </span>
          </div>
        </div>
      </div>

      {/* Developer API Keys Section */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-6 sm:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-purple-600/20 rounded-xl flex items-center justify-center shrink-0">
              <Key className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Developer API Keys</h2>
              <p className="text-xs text-gray-400">
                Authenticate packaging printing hardware, ERP systems, and warehouse scannners via REST API.
              </p>
            </div>
          </div>

          <Button
            onClick={() => setShowCreateModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white shrink-0"
          >
            <Plus className="w-4 h-4 mr-2" />
            Generate New Key
          </Button>
        </div>

        {loading ? (
          <div className="py-8 text-center">
            <Loader2 className="w-6 h-6 animate-spin mx-auto text-gray-400" />
          </div>
        ) : keys.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-white/10 text-gray-400 text-xs uppercase tracking-wider">
                  <th className="py-3">Name</th>
                  <th className="py-3">Key Prefix</th>
                  <th className="py-3">Created</th>
                  <th className="py-3">Last Used</th>
                  <th className="py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {keys.map((k) => (
                  <tr key={k.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                    <td className="py-3 font-medium text-white">{k.name}</td>
                    <td className="py-3 font-mono text-xs text-blue-400">
                      {k.keyPrefix}...
                    </td>
                    <td className="py-3 text-gray-400 text-xs">{formatDate(k.createdAt)}</td>
                    <td className="py-3 text-gray-400 text-xs">{formatDate(k.lastUsedAt)}</td>
                    <td className="py-3 text-right">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleRevokeKey(k.id, k.name)}
                        className="text-red-400 hover:text-red-300 hover:bg-red-500/10 text-xs"
                      >
                        <Trash2 className="w-4 h-4 mr-1" />
                        Revoke
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-8 text-center text-gray-400 border border-dashed border-white/10 rounded-xl">
            <Key className="w-8 h-8 text-gray-600 mx-auto mb-2" />
            <p className="text-sm">No API keys created yet.</p>
            <p className="text-xs text-gray-500 mt-1">
              Create a key to connect packaging machines or factory ERP systems.
            </p>
          </div>
        )}
      </div>

      {/* Modal: Generate API Key */}
      {showCreateModal && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setShowCreateModal(false)}
        >
          <div
            className="bg-[#0A0E27] border border-white/20 rounded-3xl p-6 sm:p-8 max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-lg text-white">Generate Developer API Key</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1 rounded-lg hover:bg-white/10 text-gray-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {error && (
              <div className="p-3 bg-red-500/20 border border-red-500/30 rounded-xl text-red-300 text-xs mb-4">
                {error}
              </div>
            )}

            <form onSubmit={handleCreateKey} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-300">
                  Key Description / Application Name
                </label>
                <Input
                  type="text"
                  required
                  placeholder="e.g. Zebra Label Printer #3"
                  value={keyName}
                  onChange={(e) => setKeyName(e.target.value)}
                  className="bg-white/5 border-white/10 text-white"
                />
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setShowCreateModal(false)}
                  className="text-gray-400"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={creating}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {creating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-1" />
                      Generating...
                    </>
                  ) : (
                    "Generate Key"
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Display Secret API Key (Only Once) */}
      {createdKeyData && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#0A0E27] border border-green-500/40 rounded-3xl p-6 sm:p-8 max-w-lg w-full space-y-4 text-center">
            <div className="w-14 h-14 bg-green-500/20 text-green-400 rounded-full flex items-center justify-center mx-auto">
              <Key className="w-7 h-7" />
            </div>

            <h3 className="text-xl font-bold text-white">Save Your API Key</h3>
            <p className="text-xs text-amber-300 bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 text-left">
              <strong>Warning:</strong> This key will never be shown again. Copy and store it in a secure password manager or server environment.
            </p>

            <div className="flex items-center gap-2 bg-black/50 border border-white/20 rounded-xl p-2 text-left">
              <input
                type="text"
                readOnly
                value={createdKeyData.apiKey}
                className="bg-transparent text-xs font-mono text-green-400 flex-1 px-2 select-all outline-none"
              />
              <Button
                size="sm"
                onClick={() => copyToClipboard(createdKeyData.apiKey)}
                className="bg-white/10 hover:bg-white/20 text-white shrink-0"
              >
                {copiedKey ? (
                  <Check className="w-4 h-4 text-green-400" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </Button>
            </div>

            <Button
              onClick={() => setCreatedKeyData(null)}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white mt-4"
            >
              I Have Stored the Key Safely
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
