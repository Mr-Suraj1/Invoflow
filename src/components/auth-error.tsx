"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";

interface AuthErrorProps {
  error?: string;
  onRetry?: () => void;
}

export default function AuthError({ error, onRetry }: AuthErrorProps) {
  const router = useRouter();

  const handleLogin = () => {
    router.push("/login");
  };

  const handleRefresh = () => {
    if (onRetry) {
      onRetry();
    } else {
      window.location.reload();
    }
  };

  return (
    <div className="container mx-auto p-4 sm:p-6 flex items-center justify-center min-h-[400px]">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <AlertTriangle className="h-12 w-12 text-yellow-500" />
          </div>
          <CardTitle>Authentication Error</CardTitle>
          <CardDescription>
            There was a problem with your session. Please try logging in again.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-md">
              <p className="text-sm text-red-700 dark:text-red-300">
                {error}
              </p>
            </div>
          )}
          
          <div className="flex gap-2">
            <Button onClick={handleRefresh} variant="outline" className="flex-1">
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
            <Button onClick={handleLogin} className="flex-1">
              Login
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 