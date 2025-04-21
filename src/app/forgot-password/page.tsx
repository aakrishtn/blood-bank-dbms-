"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { resetPassword } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/use-toast";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await resetPassword(email);
      setIsSubmitted(true);
      toast({
        title: "Email Sent",
        description: "If this email exists in our system, you will receive password reset instructions.",
      });
    } catch (error) {
      console.error("Password reset error:", error);
      toast({
        variant: "destructive",
        title: "Request Failed",
        description: "There was a problem processing your request. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-white to-rose-50 p-4">
      <div className="absolute top-8 left-8">
        <h1 className="text-2xl font-bold text-red-600">Blood Bank</h1>
      </div>
      
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto h-16 w-16 rounded-full bg-red-100 p-3 mb-4">
            <div className="h-full w-full rounded-full bg-red-600"></div>
          </div>
          <h2 className="text-3xl font-bold tracking-tight">Reset Password</h2>
          <p className="mt-2 text-gray-500">We&apos;ll send you a link to reset your password</p>
        </div>
        
        <Card className="border-none shadow-lg">
          <CardContent className="pt-6">
            {!isSubmitted ? (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="h-11 rounded-md border border-gray-200 px-3 py-2 text-sm"
                  />
                </div>
                <Button 
                  type="submit" 
                  className="h-11 w-full bg-red-600 hover:bg-red-700 transition-colors rounded-md font-medium text-white" 
                  disabled={isLoading}
                >
                  {isLoading ? "Sending..." : "Send Reset Link"}
                </Button>
              </form>
            ) : (
              <div className="space-y-5 py-4">
                <div className="rounded-lg bg-green-50 p-4 text-center">
                  <p className="text-green-800">
                    We&apos;ve sent a password reset link to <strong>{email}</strong>.
                  </p>
                  <p className="mt-1 text-sm text-green-700">
                    Please check your email inbox and follow the instructions.
                  </p>
                </div>
                <Button 
                  className="h-11 w-full bg-red-600 hover:bg-red-700 transition-colors rounded-md font-medium text-white"
                  onClick={() => router.push("/login")}
                >
                  Return to Login
                </Button>
              </div>
            )}
          </CardContent>
          <CardFooter className="border-t border-gray-100 p-6 flex justify-center">
            <div className="text-sm text-gray-500">
              Remember your password?{" "}
              <Link href="/login" className="font-medium text-red-600 hover:text-red-800 transition-colors">
                Sign in
              </Link>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
} 