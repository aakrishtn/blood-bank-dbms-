"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/use-toast";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const data = await signIn(email, password);
      
      if (data.session) {
        toast({
          title: "Success",
          description: "You have been logged in successfully",
        });
        router.push("/dashboard");
      }
    } catch (error: unknown) {
      console.error("Login error:", error);
      
      // Check if the error is due to unconfirmed email
      if (error instanceof Error && error.message.includes("Email not confirmed")) {
        toast({
          title: "Verifying your account",
          description: "Please wait while we verify your account...",
        });
        
        // Call the API endpoint to confirm the email on the server side
        try {
          const response = await fetch('/api/auth/confirm', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email }),
          });
          
          if (response.ok) {
            // If email was confirmed, try logging in again after a short delay
            setTimeout(async () => {
              try {
                const data = await signIn(email, password);
                
                if (data.session) {
                  toast({
                    title: "Success",
                    description: "Your account has been verified and you are now logged in",
                  });
                  router.push("/dashboard");
                } else {
                  toast({
                    variant: "destructive",
                    title: "Login Failed",
                    description: "We couldn't log you in automatically. Please try again.",
                  });
                }
              } catch {
                toast({
                  variant: "destructive",
                  title: "Login Failed",
                  description: "We couldn't log you in after verification. Please try again.",
                });
              } finally {
                setIsLoading(false);
              }
            }, 1500);
            return;
          } else {
            // If API call failed, show an error
            const errorData = await response.json();
            console.error("Error confirming email:", errorData);
            toast({
              variant: "destructive",
              title: "Verification Failed",
              description: "We couldn't verify your account. Please try again later.",
            });
          }
        } catch (apiError) {
          console.error("API error:", apiError);
          toast({
            variant: "destructive",
            title: "Verification Failed",
            description: "There was a problem verifying your account. Please try again later.",
          });
        }
      } else {
        toast({
          variant: "destructive",
          title: "Login Failed",
          description: "Invalid email or password. Please try again.",
        });
      }
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
          <h2 className="text-3xl font-bold tracking-tight">Welcome back</h2>
          <p className="mt-2 text-gray-500">Sign in to your account to continue</p>
        </div>
        
        <Card className="border-none shadow-lg">
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">Email</Label>
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
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-sm font-medium">Password</Label>
                  <Link 
                    href="/forgot-password" 
                    className="text-xs font-medium text-red-600 hover:text-red-800 transition-colors"
                  >
                    Forgot password?
                  </Link>
                </div>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="h-11 rounded-md border border-gray-200 px-3 py-2 text-sm"
                />
              </div>
              <Button 
                type="submit" 
                variant="red"
                className="h-11 w-full" 
                disabled={isLoading}
              >
                {isLoading ? "Signing in..." : "Sign In"}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="border-t border-gray-100 p-6 flex justify-center">
            <div className="text-sm text-gray-500">
              Don&apos;t have an account?{" "}
              <Link href="/register" className="font-medium text-red-600 hover:text-red-800 transition-colors">
                Register
              </Link>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
} 