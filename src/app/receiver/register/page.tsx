"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { receiverAPI } from "@/lib/database";
import { cityAPI } from "@/lib/database";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/components/ui/use-toast";

interface City {
  city_id: string;
  city_name: string;
}

export default function ReceiverRegistrationPage() {
  const [receiverName, setReceiverName] = useState("");
  const [receiverAge, setReceiverAge] = useState("");
  const [receiverSex, setReceiverSex] = useState("");
  const [receiverBloodGroup, setReceiverBloodGroup] = useState("");
  const [receiverPhone, setReceiverPhone] = useState("");
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

    try {
      // Generate a receiver ID (could be improved in a production environment)
      const receiverId = `R${Date.now().toString().slice(-8)}`;
      
      // Current date for registration
      const regDate = new Date().toISOString().split('T')[0];
      
      await receiverAPI.addReceiver({
        receiver_id: receiverId,
        receiver_name: receiverName,
        r_age: parseInt(receiverAge),
        r_bgrp: receiverBloodGroup,
        r_sex: receiverSex,
        r_reg_date: regDate,
        r_phno: receiverPhone,
        city_id: selectedCity,
      });

      // Get current user and link to receiver profile
      const user = await getCurrentUser();
      if (user) {
        // Use supabase to link user to receiver profile
        // This would be implemented in your linkUserToProfile function
      }

      toast({
        title: "Registration Successful",
        description: "You have been registered as a blood receiver successfully.",
      });
      
      // Find compatible donors - this would be used in a real implementation
      // await receiverAPI.matchDonors(receiverId);
      
      router.push("/dashboard");
    } catch (error) {
      console.error("Registration error:", error);
      toast({
        variant: "destructive",
        title: "Registration Failed",
        description: "There was a problem registering you as a receiver. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">Blood Receiver Registration</CardTitle>
          <CardDescription className="text-center">
            Please provide your details to register as a blood receiver
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="receiverName">Full Name</Label>
              <Input
                id="receiverName"
                placeholder="Enter your full name"
                value={receiverName}
                onChange={(e) => setReceiverName(e.target.value)}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="receiverAge">Age</Label>
              <Input
                id="receiverAge"
                type="number"
                placeholder="Your age"
                value={receiverAge}
                onChange={(e) => setReceiverAge(e.target.value)}
                min="1"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="receiverSex">Gender</Label>
              <Select value={receiverSex} onValueChange={setReceiverSex} required>
                <SelectTrigger>
                  <SelectValue placeholder="Select gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="M">Male</SelectItem>
                  <SelectItem value="F">Female</SelectItem>
                  <SelectItem value="O">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="receiverBloodGroup">Blood Group Required</Label>
              <Select value={receiverBloodGroup} onValueChange={setReceiverBloodGroup} required>
                <SelectTrigger>
                  <SelectValue placeholder="Select blood group" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="A+">A+</SelectItem>
                  <SelectItem value="A-">A-</SelectItem>
                  <SelectItem value="B+">B+</SelectItem>
                  <SelectItem value="B-">B-</SelectItem>
                  <SelectItem value="AB+">AB+</SelectItem>
                  <SelectItem value="AB-">AB-</SelectItem>
                  <SelectItem value="O+">O+</SelectItem>
                  <SelectItem value="O-">O-</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="receiverPhone">Phone Number</Label>
              <Input
                id="receiverPhone"
                placeholder="Your phone number"
                value={receiverPhone}
                onChange={(e) => setReceiverPhone(e.target.value)}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="receiverCity" className="text-sm font-medium text-gray-900">City</Label>
              <Select value={selectedCity} onValueChange={setSelectedCity} required>
                <SelectTrigger className="h-11 border-gray-300 focus:border-red-500 focus:ring-red-500 rounded-md">
                  <SelectValue placeholder="Select your city" />
                </SelectTrigger>
                <SelectContent className="max-h-60 overflow-y-auto z-50 bg-white">
                  {cities.map((city) => (
                    <SelectItem key={city.city_id} value={city.city_id}>
                      {city.city_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <Button type="submit" className="w-full bg-red-600 hover:bg-red-700" disabled={isSubmitting}>
              {isSubmitting ? "Registering..." : "Register as Receiver"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
} 