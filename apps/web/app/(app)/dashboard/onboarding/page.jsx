"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, CheckCircle, Upload, ArrowRight } from "lucide-react";

export default function OnboardingPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const router = useRouter();
  const { data: session } = useSession();

  const handleComplete = async () => {
    setIsLoading(true);
    try {
      if (!session?.user) {
        router.push("/login");
        return;
      }

      const res = await fetch("/api/onboarding/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (!res.ok) {
        throw new Error("Failed to complete onboarding");
      }

      setSuccess(true);
      setTimeout(() => {
        router.push("/dashboard");
      }, 1500);
    } catch (error) {
      console.error("Failed to complete onboarding", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <CheckCircle className="w-16 h-16 text-green-500 mb-4" />
        <h2 className="text-2xl font-bold mb-2 text-green-500">All Set!</h2>
        <p className="text-muted-foreground">Taking you to your dashboard...</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Welcome to Kweli</h1>
        <p className="text-muted-foreground">Let's set up your workspace. You can always change these settings later.</p>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Company Logo</CardTitle>
            <CardDescription>Upload your brand logo for your consumer verification pages.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:bg-muted/50 transition-colors cursor-pointer">
              <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-4" />
              <p className="text-sm font-medium mb-1">Click to upload or drag and drop</p>
              <p className="text-xs text-muted-foreground">SVG, PNG, JPG or GIF (max. 2MB)</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Your First Campaign</CardTitle>
            <CardDescription>Your 14-day trial includes 500 units and 1 active campaign.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm mb-4">
              Kweli protects your brand and rewards your consumers. We recommend starting with an "Instant Win" campaign to drive engagement.
            </p>
            <div className="bg-primary/5 border border-primary/20 rounded-md p-4 text-sm flex gap-3">
              <CheckCircle className="w-5 h-5 text-primary shrink-0" />
              <div>
                <p className="font-semibold text-primary mb-1">Trial Activated</p>
                <p className="text-muted-foreground">You have full access for 14 days. No credit card required.</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button onClick={handleComplete} disabled={isLoading} className="w-full sm:w-auto">
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
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
