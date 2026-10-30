"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, CheckCircle, ArrowRight, ShieldCheck } from "lucide-react";
import { useAuth } from "@/lib/auth-context";

export default function OnboardingPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();

  const handleComplete = async () => {
    setIsLoading(true);
    try {
      if (!isAuthenticated) {
        router.push("/login");
        return;
      }

      setSuccess(true);
      setTimeout(() => {
        router.push("/dashboard");
      }, 1000);
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center text-white">
        <CheckCircle className="w-16 h-16 text-green-400 mb-4" />
        <h2 className="text-2xl font-bold mb-2 text-green-400">Workspace Ready!</h2>
        <p className="text-gray-400">Taking you to your brand dashboard...</p>
      </div>
    );
  }

  const orgName = user?.memberships?.[0]?.organization?.legalName || "Your Organization";

  return (
    <div className="max-w-3xl mx-auto py-8 text-white space-y-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Welcome to Kweli</h1>
        <p className="text-gray-400">
          Setting up the workspace for <strong className="text-white">{orgName}</strong>.
        </p>
      </div>

      <div className="space-y-6">
        <Card className="bg-white/5 border-white/10 text-white">
          <CardHeader>
            <CardTitle>Dual-Layer Packaging Protection</CardTitle>
            <CardDescription className="text-gray-400">
              Your brand is enrolled in Kweli cryptographic verification.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-blue-600/10 border border-blue-500/20 rounded-xl p-4 text-sm flex gap-3 text-blue-200">
              <ShieldCheck className="w-5 h-5 text-blue-400 shrink-0" />
              <div>
                <p className="font-semibold text-white mb-1">Zero-Knowledge Verification Active</p>
                <p className="text-xs text-gray-300">
                  Every batch you register issues public GS1 Digital Links paired with hidden single-use scratch PINs to detect counterfeits instantly.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button
            onClick={handleComplete}
            disabled={isLoading}
            className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Initializing...
              </>
            ) : (
              <>
                Go to Dashboard
                <ArrowRight className="w-4 h-4 ml-2" />
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
