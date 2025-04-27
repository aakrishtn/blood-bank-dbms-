"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { cityAPI } from "@/lib/database";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/components/ui/use-toast";
import { supabase } from "@/lib/supabase";

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
      
      // Get current user before adding receiver (to update metadata)
      const user = await getCurrentUser();
      if (!user) {
        toast({
          variant: "destructive",
          title: "Authentication Error",
          description: "Please log in again to continue.",
        });
        router.push("/login");
        return;
      }
      
      console.log(`Registering receiver with ID ${receiverId} and blood type ${receiverBloodGroup}`);
      
      // Add the receiver record first
      try {
        const { error: receiverError } = await supabase.from('receiver').insert({
          receiver_id: receiverId,
          receiver_name: receiverName,
          r_age: parseInt(receiverAge),
          r_bgrp: receiverBloodGroup,
          r_sex: receiverSex,
          r_reg_date: regDate,
          r_phno: receiverPhone,
          city_id: selectedCity,
        });
        
        if (receiverError) {
          console.error("Error creating receiver:", receiverError.message || receiverError.code || JSON.stringify(receiverError));
          throw new Error(`Failed to create receiver: ${receiverError.message || "Unknown error"}`);
        }
        
        console.log("Successfully created receiver record");
      } catch (receiverErr) {
        console.error("Error in receiver creation:", receiverErr instanceof Error ? receiverErr.message : JSON.stringify(receiverErr));
        throw new Error(`Receiver creation failed: ${receiverErr instanceof Error ? receiverErr.message : "Unknown error"}`);
      }
      
      // Link user to receiver profile
      try {
        console.log("Linking user to receiver profile...");
        
        // First check if user exists in users table
        const { data: existingUser, error: userCheckError } = await supabase
          .from('users')
          .select('id')
          .eq('id', user.id)
          .single();
          
        if (userCheckError && userCheckError.code !== 'PGRST116') {
          console.log("Error checking user existence:", userCheckError.message || userCheckError.code);
        }
        
        // If user doesn't exist in users table, create it
        if (!existingUser) {
          console.log("Creating user in users table...");
          const { error: userInsertError } = await supabase
            .from('users')
            .insert({
              id: user.id,
              email: user.email || '',
              password_hash: '', // We don't have access to password hash
              user_role: 'receiver'
            });
            
          if (userInsertError) {
            console.error("Error creating user in users table:", 
              userInsertError.message || userInsertError.code || JSON.stringify(userInsertError));
              
            if (userInsertError.code === '23505') { // Unique violation - user already exists
              console.log("User already exists, continuing with profile linking");
            } else {
              throw new Error(`Failed to create user: ${userInsertError.message || "Unknown error"}`);
            }
          } else {
            console.log("Successfully created user in users table");
          }
        }
        
        // Check if user profile already exists
        const { data: existingProfile, error: checkError } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('user_id', user.id)
          .single();
          
        if (checkError) {
          // Check for empty error object
          if (Object.keys(checkError).length === 0) {
            console.error("Error checking existing profile: Empty error object. This might be a 404 Not Found.");
          } else if (checkError.code !== 'PGRST116') { // PGRST116 means no rows returned - this is expected for new users
            console.error("Error checking existing profile:", checkError.message || checkError.code || JSON.stringify(checkError));
          } else {
            console.log("No existing profile found, will create new one");
          }
        }
        
        if (existingProfile) {
          console.log("User already has a profile, updating it:", existingProfile);
          // Update existing profile
          const { error: updateError } = await supabase
            .from('user_profiles')
            .update({
              profile_id: receiverId,
              profile_type: 'receiver'
            })
            .eq('user_id', user.id);
            
          if (updateError) {
            console.error("Error updating user profile:", updateError.message || updateError.code || JSON.stringify(updateError));
            throw new Error(`Failed to update profile: ${updateError.message || "Unknown error"}`);
          }
          console.log("Successfully updated user profile");
        } else {
          console.log("Creating new user profile...");
          // Create new profile
          const { error: profileError } = await supabase
            .from('user_profiles')
            .insert({
              user_id: user.id,
              profile_id: receiverId,
              profile_type: 'receiver'
            });
            
          if (profileError) {
            console.error("Error creating user profile:", 
              profileError.message || profileError.code || JSON.stringify(profileError));
              
            throw new Error(`Failed to create profile: ${profileError.message || "Unknown error"}`);
          }
          console.log("Successfully created user profile");
        }
      } catch (linkErr) {
        console.error("Error in profile linking:", linkErr instanceof Error ? linkErr.message : JSON.stringify(linkErr));
        // Don't throw here, continue with role update as we want to at least have the receiver record
      }
      
      // Update the user metadata to set role as receiver
      try {
        console.log("Updating user role metadata...");
        // Call the API to update user role in Supabase
        const response = await fetch('/api/users/update-role', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId: user.id,
            role: 'receiver',
            receiverDetails: {
              receiver_id: receiverId,
              receiver_name: receiverName,
              r_bgrp: receiverBloodGroup,
              r_age: parseInt(receiverAge)
            }
          }),
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error("Failed to update user role:", errorText);
          // Don't throw here, we'll still consider registration successful
        } else {
          console.log("Successfully updated user role metadata");
        }
      } catch (metadataError) {
        console.error("Error updating user metadata:", metadataError instanceof Error ? metadataError.message : JSON.stringify(metadataError));
        // Don't throw here, we'll still consider registration successful
      }

      toast({
        title: "Registration Successful",
        description: "You have been registered as a blood receiver successfully.",
      });
      
      // Store key information in localStorage for easy retrieval
      window.localStorage.setItem('userRole', 'receiver');
      window.localStorage.setItem('receiverId', receiverId);
      window.localStorage.setItem('receiverBloodType', receiverBloodGroup);
      console.log(`Registered as receiver with blood type ${receiverBloodGroup} and ID ${receiverId}`);
      
      // Redirect to matched donors page
      router.push("/receiver/matched-donors");
    } catch (error) {
      console.error("Registration error:", error instanceof Error ? error.message : JSON.stringify(error));
      toast({
        variant: "destructive",
        title: "Registration Failed",
        description: error instanceof Error 
          ? `Error: ${error.message}` 
          : "There was a problem registering you as a receiver. Please try again.",
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
                <SelectContent className="bg-gray-100 text-gray-900 border border-gray-300">
                  <SelectItem value="M" className="text-gray-900 hover:bg-gray-200">Male</SelectItem>
                  <SelectItem value="F" className="text-gray-900 hover:bg-gray-200">Female</SelectItem>
                  <SelectItem value="O" className="text-gray-900 hover:bg-gray-200">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="receiverBloodGroup">Blood Group Required</Label>
              <Select value={receiverBloodGroup} onValueChange={setReceiverBloodGroup} required>
                <SelectTrigger>
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
                <SelectContent className="max-h-60 overflow-y-auto z-50 bg-gray-100 text-gray-900 border border-gray-300">
                  {cities.map((city) => (
                    <SelectItem key={city.city_id} value={city.city_id} className="text-gray-900 hover:bg-gray-200">
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