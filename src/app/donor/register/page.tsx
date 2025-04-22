"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { cityAPI } from "@/lib/database";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/components/ui/use-toast";
import { supabase } from "@/lib/supabase";

interface City {
  city_id: string;
  city_name: string;
}

export default function DonorRegistrationPage() {
  const [donorName, setDonorName] = useState("");
  const [donorAge, setDonorAge] = useState("");
  const [donorSex, setDonorSex] = useState("");
  const [donorBloodGroup, setDonorBloodGroup] = useState("");
  const [donorPhone, setDonorPhone] = useState("");
  const [cities, setCities] = useState<City[]>([]);
  const [selectedCity, setSelectedCity] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Fetch the list of cities
    const fetchCities = async () => {
      try {
        const citiesData = await cityAPI.getAllCities();
        setCities(citiesData);
        
        // If no cities found, try to seed the database
        if (!citiesData || citiesData.length === 0) {
          try {
            console.log("No cities found. Attempting to seed the database...");
            const response = await fetch('/api/seed/cities');
            if (response.ok) {
              // Fetch cities again after seeding
              const newCitiesData = await cityAPI.getAllCities();
              setCities(newCitiesData);
              console.log("Cities seeded successfully!");
            } else {
              console.error("Failed to seed cities:", await response.text());
            }
          } catch (seedError) {
            console.error("Error seeding cities:", seedError);
          }
        }
      } catch (error) {
        console.error("Error fetching cities:", error);
      }
    };

    // Check if user is authenticated
    const checkAuth = async () => {
      setIsLoading(true);
      try {
        const user = await getCurrentUser();
        if (!user) {
          router.push("/login");
          return;
        }
        
        // Pre-fill phone number with user's email to ensure matching
        if (user.email) {
          setDonorPhone(user.email);
        }
      } catch (error) {
        console.error("Auth error:", error);
        router.push("/login");
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
    fetchCities();
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    if (parseInt(donorAge) < 18) {
      toast({
        variant: "destructive",
        title: "Age Restriction",
        description: "You must be at least 18 years old to register as a donor.",
      });
      setIsSubmitting(false);
      return;
    }

    try {
      // Generate a donor ID (could be improved in a production environment)
      const donorId = `D${Date.now().toString().slice(-8)}`;
      
      // Get current user to associate with the donor record
      const user = await getCurrentUser();
      if (!user) {
        toast({
          variant: "destructive",
          title: "Authentication Error",
          description: "You must be logged in to register as a donor.",
        });
        router.push("/login");
        setIsSubmitting(false);
        return;
      }
      
      // Handle email length limitation for donor_phno field (varchar(15) in the database)
      // Generate a unique identifier that fits within 15 characters
      // We'll use first 5 chars + last 5 chars of email + 5 random chars
      const emailForPhone = user.email || "";
      let phoneToUse = "";
      
      if (emailForPhone.length > 15) {
        // Create a shorter unique identifier that still relates to the email
        const firstPart = emailForPhone.substring(0, 5);
        const lastPart = emailForPhone.substring(emailForPhone.length - 5);
        const randomPart = Math.random().toString(36).substring(2, 7);
        phoneToUse = `${firstPart}${lastPart.substring(0, 3)}${randomPart.substring(0, 3)}`.substring(0, 15);
        
        console.log(`Email too long (${emailForPhone.length} chars), using shortened version: ${phoneToUse}`);
      } else {
        phoneToUse = emailForPhone;
      }
      
      // Create donor record
      console.log("Adding donor with data:", {
        donor_id: donorId,
        donor_name: donorName,
        donor_age: parseInt(donorAge),
        donor_bgrp: donorBloodGroup,
        donor_sex: donorSex,
        donor_phno: phoneToUse,
        city_id: selectedCity,
      });
      
      const { error: insertError } = await supabase.from('donor').insert({
        donor_id: donorId,
        donor_name: donorName,
        donor_age: parseInt(donorAge),
        donor_bgrp: donorBloodGroup,
        donor_sex: donorSex,
        donor_phno: phoneToUse,
        city_id: selectedCity,
      });
      
      if (insertError) {
        console.error("Supabase insert error:", insertError);
        throw new Error(`Database error: ${insertError.message} (Code: ${insertError.code})`);
      }
      
      // Link user to donor profile
      try {
        const { error: linkError } = await supabase
          .from('user_profiles')
          .insert({
            user_id: user.id,
            profile_id: donorId,
            profile_type: 'donor'
          });
          
        if (linkError) {
          console.error("Error linking user to donor profile:", linkError);
        }
      } catch (linkErr) {
        console.error("Error in profile linking:", linkErr);
        // Continue even if linking fails
      }

      // Update the user metadata to set role as donor
      try {
        // Call the API to update user role in Supabase
        const response = await fetch('/api/users/update-role', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId: user.id,
            role: 'donor',
            donorDetails: {
              donor_id: donorId,
              donor_name: donorName,
              donor_bgrp: donorBloodGroup,
              donor_age: parseInt(donorAge)
            }
          }),
        });
        
        if (!response.ok) {
          console.error("Failed to update user role");
        }
      } catch (metadataError) {
        console.error("Error updating user metadata:", metadataError);
      }

      toast({
        title: "Registration Successful",
        description: "You have been registered as a donor successfully.",
      });
      
      router.push("/dashboard");
    } catch (error) {
      console.error("Registration error:", error);
      toast({
        variant: "destructive",
        title: "Registration Failed",
        description: error instanceof Error 
          ? `Error: ${error.message}` 
          : "There was a problem registering you as a donor. Please try again."
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-pulse">
          <div className="h-12 w-12 rounded-full bg-red-200 mx-auto"></div>
          <p className="mt-4 text-red-600 font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gradient-to-b from-white to-rose-50 py-12 px-4">
      <div className="w-full max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Donor Registration</h1>
          <p className="text-lg text-gray-700">Please provide your details to register as a blood donor</p>
        </div>
        
        <Card className="border-none shadow-xl overflow-hidden">
          <div className="h-2 bg-red-600"></div>
          <CardContent className="pt-6 px-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="donorName" className="text-sm font-medium text-gray-900">Full Name</Label>
                  <Input
                    id="donorName"
                    placeholder="Enter your full name"
                    value={donorName}
                    onChange={(e) => setDonorName(e.target.value)}
                    required
                    className="h-11 border-gray-300 focus:border-red-500 focus:ring-red-500 rounded-md"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="donorAge" className="text-sm font-medium text-gray-900">Age</Label>
                  <Input
                    id="donorAge"
                    type="number"
                    placeholder="Your age"
                    value={donorAge}
                    onChange={(e) => setDonorAge(e.target.value)}
                    min="18"
                    max="65"
                    required
                    className="h-11 border-gray-300 focus:border-red-500 focus:ring-red-500 rounded-md"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="donorSex" className="text-sm font-medium text-gray-900">Gender</Label>
                  <Select value={donorSex} onValueChange={setDonorSex} required>
                    <SelectTrigger className="h-11 border-gray-300 focus:border-red-500 focus:ring-red-500 rounded-md">
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-100 text-gray-900 border border-gray-300">
                      <SelectItem value="M" className="text-gray-900 hover:bg-gray-200">Male</SelectItem>
                      <SelectItem value="F" className="text-gray-900 hover:bg-gray-200">Female</SelectItem>
                      <SelectItem value="O" className="text-gray-900 hover:bg-gray-200">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="donorBloodGroup" className="text-sm font-medium text-gray-900">Blood Group</Label>
                  <Select value={donorBloodGroup} onValueChange={setDonorBloodGroup} required>
                    <SelectTrigger className="h-11 border-gray-300 focus:border-red-500 focus:ring-red-500 rounded-md">
                      <SelectValue placeholder="Select blood group" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-100 text-gray-900 border border-gray-300">
                      <SelectItem value="A+" className="text-gray-900 hover:bg-gray-200">A+</SelectItem>
                      <SelectItem value="A-" className="text-gray-900 hover:bg-gray-200">A-</SelectItem>
                      <SelectItem value="B+" className="text-gray-900 hover:bg-gray-200">B+</SelectItem>
                      <SelectItem value="B-" className="text-gray-900 hover:bg-gray-200">B-</SelectItem>
                      <SelectItem value="AB+" className="text-gray-900 hover:bg-gray-200">AB+</SelectItem>
                      <SelectItem value="AB-" className="text-gray-900 hover:bg-gray-200">AB-</SelectItem>
                      <SelectItem value="O+" className="text-gray-900 hover:bg-gray-200">O+</SelectItem>
                      <SelectItem value="O-" className="text-gray-900 hover:bg-gray-200">O-</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="donorPhone" className="text-sm font-medium text-gray-900">Email Address</Label>
                  <Input
                    id="donorPhone"
                    placeholder="Your email address"
                    value={donorPhone}
                    onChange={(e) => setDonorPhone(e.target.value)}
                    disabled={true}
                    className="h-11 border-gray-300 focus:border-red-500 focus:ring-red-500 rounded-md bg-gray-50"
                  />
                  <p className="text-xs text-gray-500">This field uses your login email to link your profile</p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="donorCity" className="text-sm font-medium text-gray-900">City</Label>
                  <Select value={selectedCity} onValueChange={setSelectedCity} required>
                    <SelectTrigger className="h-11 border-gray-300 focus:border-red-500 focus:ring-red-500 rounded-md">
                      <SelectValue placeholder="Select your city" />
                    </SelectTrigger>
                    <SelectContent className="max-h-60 overflow-y-auto z-50 bg-gray-100 text-gray-900 border border-gray-300">
                      {cities.map((city) => (
                        <SelectItem key={city.city_id} value={city.city_id} className="text-gray-900 hover:bg-gray-200">
                          {city.city_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="pt-4">
                <Button 
                  type="submit" 
                  className="w-full h-12 bg-red-600 hover:bg-red-700 text-white font-medium rounded-md shadow-sm transition-colors" 
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <span className="flex items-center justify-center">
                      <span className="mr-2 h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin"></span>
                      Registering...
                    </span>
                  ) : (
                    "Register as Donor"
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
        
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-600">
            Thank you for your interest in donating blood. Your contribution can save lives.
          </p>
        </div>
      </div>
    </div>
  );
} 