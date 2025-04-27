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
import { getHospitalsByCity, getRandomDoctor, seedHospitalsAndDoctors } from "@/lib/hospital";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format, addDays, isAfter, isBefore, startOfDay } from "date-fns";

interface City {
  city_id: string;
  city_name: string;
}

interface Hospital {
  h_id: string;
  h_name: string;
}

export default function DonorRegistrationPage() {
  const [donorName, setDonorName] = useState("");
  const [donorAge, setDonorAge] = useState("");
  const [donorSex, setDonorSex] = useState("");
  const [donorBloodGroup, setDonorBloodGroup] = useState("");
  const [donorPhone, setDonorPhone] = useState("");
  const [cities, setCities] = useState<City[]>([]);
  const [selectedCity, setSelectedCity] = useState("");
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [selectedHospital, setSelectedHospital] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [appointmentDate, setAppointmentDate] = useState<Date | undefined>(undefined);
  const [appointmentTime, setAppointmentTime] = useState<string>("10:00");
  const router = useRouter();

  // Generate time slots from 8 AM to 6 PM
  const timeSlots = Array.from({ length: 21 }, (_, i) => {
    const hour = Math.floor(i / 2) + 8;
    const minute = i % 2 === 0 ? "00" : "30";
    const hourFormatted = hour < 10 ? `0${hour}` : hour;
    return `${hourFormatted}:${minute}`;
  });
  
  // Calculate available date range (today + 30 days)
  const today = startOfDay(new Date());
  const maxDate = addDays(today, 30);
  
  // Function to determine if a date is unavailable
  const isDateUnavailable = (date: Date) => {
    return isBefore(date, today) || isAfter(date, maxDate);
  };

  useEffect(() => {
    // Fetch the list of cities
    const fetchCities = async () => {
      try {
        console.log("Fetching cities...");
        const citiesData = await cityAPI.getAllCities();
        console.log("Cities data received:", citiesData);
        
        if (citiesData && citiesData.length > 0) {
          setCities(citiesData);
        } else {
          // If no cities found, try to seed the database
          console.log("No cities found. Attempting to seed the database...");
          const response = await fetch('/api/seed/cities');
          const data = await response.json();
          
          if (data.error) {
            console.error("Error seeding cities:", data.error);
            toast({
              variant: "destructive",
              title: "Error",
              description: "Failed to load cities. Please try again later."
            });
            return;
          }
          
          if (data.cities && data.cities.length > 0) {
            console.log("Cities seeded successfully:", data.cities);
            setCities(data.cities);
          } else {
            console.error("No cities were seeded");
            toast({
              variant: "destructive",
              title: "Error",
              description: "Failed to load cities. Please try again later."
            });
          }
        }
      } catch (error) {
        console.error("Error fetching cities:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load cities. Please try again later."
        });
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

    // Seed hospitals and doctors if needed
    const seedData = async () => {
      try {
        await seedHospitalsAndDoctors();
      } catch (error) {
        console.error("Error seeding hospitals and doctors:", error);
      }
    };

    const init = async () => {
      await fetchCities();
      await checkAuth();
      await seedData();
    };

    init();
  }, [router]);

  // Fetch hospitals when city changes
  useEffect(() => {
    const fetchHospitals = async () => {
      if (selectedCity) {
        try {
          console.log("Fetching hospitals for city:", selectedCity);
          const hospitalsData = await getHospitalsByCity(selectedCity);
          console.log("Hospitals data received:", hospitalsData);
          
          if (hospitalsData && hospitalsData.length > 0) {
            setHospitals(hospitalsData);
            // Auto-select the first hospital by default
            setSelectedHospital(hospitalsData[0].h_id);
          } else {
            setHospitals([]);
            setSelectedHospital("");
          }
        } catch (error) {
          console.error("Error fetching hospitals:", error);
          toast({
            variant: "destructive",
            title: "Error",
            description: "Failed to load hospitals. Please try again later."
          });
        }
      } else {
        // Clear hospitals if no city is selected
        setHospitals([]);
        setSelectedHospital("");
      }
    };

    fetchHospitals();
  }, [selectedCity]);

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

    if (!appointmentDate) {
      toast({
        variant: "destructive",
        title: "Appointment Required",
        description: "Please select an appointment date and time for your donation.",
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

      // Get a random doctor
      const doctor = await getRandomDoctor();
      console.log("Selected random doctor:", doctor);
      
      // Create donor record
      console.log("Adding donor with data:", {
        donor_id: donorId,
        donor_name: donorName,
        donor_age: parseInt(donorAge),
        donor_bgrp: donorBloodGroup,
        donor_sex: donorSex,
        donor_phno: phoneToUse,
        city_id: selectedCity,
        hospital_id: selectedHospital,
        doctor_id: doctor.doc_id
      });
      
      const { error: insertError } = await supabase.from('donor').insert({
        donor_id: donorId,
        donor_name: donorName,
        donor_age: parseInt(donorAge),
        donor_bgrp: donorBloodGroup,
        donor_sex: donorSex,
        donor_phno: phoneToUse,
        city_id: selectedCity,
        hospital_id: selectedHospital,
        doctor_id: doctor.doc_id
      });
      
      if (insertError) {
        console.error("Supabase insert error:", insertError);
        throw new Error(`Database error: ${insertError.message || "Unknown error"} (Code: ${insertError.code || "unknown"})`);
      }
      
      // Create appointment for the donor
      try {
        const appointmentId = `APT${Date.now().toString().slice(-8)}`;
        const appointmentDateTime = new Date(appointmentDate);
        const [hours, minutes] = appointmentTime.split(':').map(Number);
        appointmentDateTime.setHours(hours, minutes, 0, 0);
        
        console.log("Creating appointment:", {
          appointment_id: appointmentId,
          donor_id: donorId,
          appointment_date: appointmentDateTime.toISOString(),
          status: 'scheduled',
          hospital_id: selectedHospital,
          notes: 'Created during donor registration'
        });
        
        const { error: appointmentError } = await supabase.from('appointments').insert({
          appointment_id: appointmentId,
          donor_id: donorId,
          appointment_date: appointmentDateTime.toISOString(),
          status: 'scheduled',
          hospital_id: selectedHospital,
          notes: 'Created during donor registration'
        });
        
        if (appointmentError) {
          console.error("Error creating appointment:", appointmentError);
          // Don't throw error here, continue with registration
        } else {
          console.log("Appointment created successfully");
        }
      } catch (appointmentErr) {
        console.error("Exception creating appointment:", appointmentErr);
        // Continue with registration process even if appointment creation fails
      }
      
      // Link user to donor profile
      try {
        console.log("Attempting to link user profile...");
        
        // First check if user profile already exists
        const { data: existingProfile, error: checkError } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('user_id', user.id)
          .single();
          
        if (checkError) {
          // Check for empty error object
          if (Object.keys(checkError).length === 0) {
            console.error("Error checking existing profile: Empty error object. This might be a 404 Not Found.");
          } else if (checkError.code === 'PGRST116') { 
            // PGRST116 means no rows returned - this is expected
            console.log("No existing profile found, will create new one");
          } else {
            console.error("Error checking existing profile:", checkError.message || checkError.code || JSON.stringify(checkError));
          }
        }
        
        if (existingProfile) {
          console.log("User already has a profile, updating it:", existingProfile);
          // Update existing profile
          const { error: updateError } = await supabase
            .from('user_profiles')
            .update({
              profile_id: donorId,
              profile_type: 'donor'
            })
            .eq('user_id', user.id);
            
          if (updateError) {
            console.error("Error updating user profile:", updateError.message || updateError.code || JSON.stringify(updateError));
            throw new Error(`Failed to update profile: ${updateError.message || "Unknown error"}`);
          }
        } else {
          // Create the user in the users table first to avoid foreign key constraint issues
          console.log("Creating user entry in users table to ensure it exists");
          
          // First check if the user already exists in the users table
          const { data: existingUser, error: userCheckError } = await supabase
            .from('users')
            .select('id')
            .eq('id', user.id)
            .single();
            
          if (userCheckError && userCheckError.code !== 'PGRST116') {
            console.log("Error checking user existence:", userCheckError.message || userCheckError.code);
          }
          
          if (!existingUser) {
            console.log("User doesn't exist in users table, creating it now");
            // Create the user in the users table first (might be needed if using only Supabase Auth)
            const { error: userInsertError } = await supabase
              .from('users')
              .insert({
                id: user.id,
                email: user.email || '',
                password_hash: '', // We don't have access to password hash
                user_role: 'donor'
              });
              
            if (userInsertError) {
              console.error("Error creating user in users table:", 
                userInsertError.message || userInsertError.code || JSON.stringify(userInsertError));
                
              if (userInsertError.code === '23505') { // Unique violation - user already exists
                console.log("User already exists, continuing with profile creation");
              } else {
                throw new Error(`Failed to create user: ${userInsertError.message || "Unknown error"}`);
              }
            } else {
              console.log("Successfully created user in users table");
            }
          } else {
            console.log("User already exists in the users table");
          }
          
          // Now create the profile with confidence that the user exists
          console.log("Creating user profile");
          const { error: profileError } = await supabase
            .from('user_profiles')
            .insert({
              user_id: user.id,
              profile_id: donorId,
              profile_type: 'donor'
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
        toast({
          variant: "destructive",
          title: "Profile Linking Error",
          description: linkErr instanceof Error 
            ? `Error: ${linkErr.message}` 
            : "Failed to link your profile. Please contact support."
        });
        // Don't return here, continue with role update
      }

      // Update the user metadata to set role as donor with additional hospital and doctor info
      try {
        console.log("Updating user role...");
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
              donor_age: parseInt(donorAge),
              hospital_id: selectedHospital,
              doctor_id: doctor.doc_id,
              doctor_name: doctor.doc_name
            }
          }),
        });
        
        if (!response.ok) {
          const errorData = await response.text();
          console.error("Failed to update user role:", errorData);
          throw new Error("Failed to update user role");
        }
        
        console.log("Successfully updated user role");
      } catch (metadataError) {
        console.error("Error updating user metadata:", metadataError);
        toast({
          variant: "destructive",
          title: "Role Update Error",
          description: "Failed to update your user role. Please contact support."
        });
        // Continue to show success message as donor record was created
      }

      toast({
        title: "Registration Successful",
        description: "You have been registered as a donor successfully. Your appointment has been scheduled.",
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
                      {cities && cities.length > 0 ? (
                        cities.map((city) => (
                          <SelectItem 
                            key={city.city_id} 
                            value={city.city_id} 
                            className="text-gray-900 hover:bg-gray-200"
                          >
                            {city.city_name}
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="no-cities" disabled>No cities available</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="hospital" className="text-sm font-medium text-gray-900">Hospital</Label>
                  <Select value={selectedHospital} onValueChange={setSelectedHospital} required={!!selectedCity}>
                    <SelectTrigger className="h-11 border-gray-300 focus:border-red-500 focus:ring-red-500 rounded-md">
                      <SelectValue placeholder="Select hospital" />
                    </SelectTrigger>
                    <SelectContent className="max-h-60 overflow-y-auto z-50 bg-gray-100 text-gray-900 border border-gray-300">
                      {hospitals && hospitals.length > 0 ? (
                        hospitals.map((hospital) => (
                          <SelectItem 
                            key={hospital.h_id} 
                            value={hospital.h_id} 
                            className="text-gray-900 hover:bg-gray-200"
                          >
                            {hospital.h_name}
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="no-hospitals" disabled>
                          {selectedCity ? "No hospitals available in selected city" : "Please select a city first"}
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-gray-500">A doctor will be automatically assigned to you</p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="appointmentDate" className="text-sm font-medium text-gray-900">Appointment Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={`w-full h-11 justify-start text-left font-normal border-gray-300 ${!appointmentDate ? 'text-gray-500' : ''}`}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {appointmentDate ? format(appointmentDate, 'PPP') : <span>Select appointment date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={appointmentDate}
                        onSelect={setAppointmentDate}
                        disabled={isDateUnavailable}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="appointmentTime" className="text-sm font-medium text-gray-900">Appointment Time</Label>
                  <Select value={appointmentTime} onValueChange={setAppointmentTime} required>
                    <SelectTrigger className="h-11 border-gray-300 focus:border-red-500 focus:ring-red-500 rounded-md">
                      <SelectValue placeholder="Select time" />
                    </SelectTrigger>
                    <SelectContent className="max-h-60 overflow-y-auto bg-gray-100 text-gray-900 border border-gray-300">
                      {timeSlots.map((time) => (
                        <SelectItem key={time} value={time} className="text-gray-900 hover:bg-gray-200">
                          {time}
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
                  disabled={isSubmitting || !selectedCity || !selectedHospital || !appointmentDate}
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