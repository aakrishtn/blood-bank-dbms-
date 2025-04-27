"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getCurrentUser, signOut } from "@/lib/auth";
import { donorAPI, receiverAPI, bloodSampleAPI } from "@/lib/database";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/components/ui/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Link from "next/link";
import { getManualDonorId } from "@/lib/donation-profile-manager";
import { supabase } from "@/lib/supabase";

// Define types for our data
interface UserData {
  email?: string;
  user_metadata?: {
    role?: string;
    donorId?: string;
    name?: string;
  };
}

interface DonorProfile {
  donor_id: string;
  donor_name: string;
  donor_bgrp: string;
  donor_age: number;
  donor_sex: string;
  donor_phno?: string;
  city?: {
    city_name: string;
  };
}

interface ReceiverProfile {
  receiver_id: string;
  receiver_name: string;
  r_bgrp: string;
  r_age: number;
  r_reg_date: string;
  r_phno?: string;
  city?: {
    city_name: string;
  };
}

interface BloodSample {
  sample_id: string;
  blood_grp: string;
  quantity: number;
  collection_date: string;
  expiry_date: string;
  status?: string;
  doctor?: {
    doc_name: string;
  };
}

// Type guards to check profile types
function isDonorProfile(profile: ProfileData): profile is DonorProfile {
  return 'donor_id' in profile;
}

function isReceiverProfile(profile: ProfileData): profile is ReceiverProfile {
  return 'receiver_id' in profile;
}

type ProfileData = DonorProfile | ReceiverProfile;

export default function DashboardPage() {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [userRole, setUserRole] = useState<string>("");
  const [bloodDonors, setBloodDonors] = useState<DonorProfile[]>([]);
  const [bloodReceivers, setBloodReceivers] = useState<ReceiverProfile[]>([]);
  const [bloodSamples, setBloodSamples] = useState<BloodSample[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const user = await getCurrentUser();
        
        if (!user) {
          router.push('/login');
          return;
        }
        
        setUserData(user);
        const userRole = user.user_metadata?.role || 'guest';
        setUserRole(userRole);
        
        // Fetch relevant profile based on user role
        try {
          if (userRole === 'donor') {
            const donors = await donorAPI.getAllDonors();
            console.log("All donors:", donors);
            console.log("User email:", user.email);
            
            // First check if we have a manually selected donor ID
            let donorProfile = null;
            const manualDonorId = getManualDonorId();
            
            if (manualDonorId) {
              console.log("Trying to match using manual donorId:", manualDonorId);
              donorProfile = donors.find(donor => donor.donor_id === manualDonorId);
              if (donorProfile) {
                console.log("Found donor profile using manual donorId");
              }
            }
            
            // Then check if we have a donor ID in user metadata
            if (!donorProfile && user.user_metadata?.donorId) {
              console.log("Trying to match using donorId from metadata:", user.user_metadata.donorId);
              donorProfile = donors.find(donor => donor.donor_id === user.user_metadata.donorId);
              if (donorProfile) {
                console.log("Found donor profile using donorId from metadata");
              }
            }
            
            // If not found by donor ID, try email matching with multiple strategies
            if (!donorProfile && user.email) {
              console.log("Trying to match by email using multiple strategies...");
              const email = user.email.toLowerCase();
              
              // Strategy 1: Exact match
              donorProfile = donors.find(donor => 
                donor.donor_phno && donor.donor_phno.toLowerCase() === email
              );
              
              // Strategy 2: First 5 chars + last 3 chars match (matching registration logic)
              if (!donorProfile) {
                const firstPart = email.substring(0, 5);
                const lastPart = email.substring(email.length - 3);
                donorProfile = donors.find(donor => 
                  donor.donor_phno && 
                  donor.donor_phno.startsWith(firstPart) && 
                  donor.donor_phno.endsWith(lastPart)
                );
              }
              
              // Strategy 3: First 5 chars match (fallback)
              if (!donorProfile) {
                const firstPart = email.substring(0, 5);
                donorProfile = donors.find(donor => 
                  donor.donor_phno && donor.donor_phno.startsWith(firstPart)
                );
              }
              
              if (donorProfile) {
                console.log("Found donor profile by email matching strategy");
              }
            }
            
            // Log the matched profile
            if (donorProfile) {
              console.log("Found matching donor profile:", donorProfile.donor_id, donorProfile.donor_name);
              setProfileData(donorProfile);
            } else {
              console.log("No matching donor profile found for user:", user.email);
              setProfileData(null);
              
              // Show toast with link to manual selection
              toast({
                variant: "destructive",
                title: "Profile not found",
                description: (
                  <div>
                    <p>Your donor profile could not be found automatically.</p>
                    <p className="mt-2">
                      <a href="/debug/donor-list" className="underline font-medium">
                        Click here to select your profile manually
                      </a>
                    </p>
                  </div>
                )
              });
            }
          } else if (userRole === 'receiver') {
            // Get all receivers
            const receivers = await receiverAPI.getAllReceivers();
            console.log("All receivers:", receivers);
            console.log("User email:", user.email);
            
            // Variable to store found profile
            let foundProfile = null;
            
            // First try to find receiver by user metadata
            if (user.user_metadata?.receiverId) {
              console.log("Trying to match using receiverId from metadata:", user.user_metadata.receiverId);
              foundProfile = receivers.find(receiver => receiver.receiver_id === user.user_metadata.receiverId);
              if (foundProfile) {
                console.log("Found receiver profile using receiverId from metadata");
              }
            }
            
            // If not found, try to find by user_profiles table
            if (!foundProfile) {
              console.log("Checking user_profiles table for receiver link");
              const { data: userProfile, error: profileError } = await supabase
                .from('user_profiles')
                .select('profile_id, profile_type')
                .eq('user_id', user.id)
                .eq('profile_type', 'receiver')
                .single();
              
              if (!profileError && userProfile) {
                console.log("Found user profile link:", userProfile);
                foundProfile = receivers.find(receiver => receiver.receiver_id === userProfile.profile_id);
                if (foundProfile) {
                  console.log("Found receiver profile using user_profiles table");
                }
              }
            }
            
            // If still not found, try to match by email or name
            if (!foundProfile && user.email) {
              console.log("Trying to match by email and name");
              foundProfile = receivers.find(receiver => 
                (receiver.r_phno && receiver.r_phno.toLowerCase() === user.email?.toLowerCase()) || 
                (receiver.receiver_name && user.user_metadata?.name && 
                 receiver.receiver_name.toLowerCase() === user.user_metadata.name.toLowerCase())
              );
              
              if (foundProfile) {
                console.log("Found receiver profile by email/name match");
              }
            }
            
            if (foundProfile) {
              console.log("Found matching receiver profile:", foundProfile.receiver_id, foundProfile.receiver_name);
              setProfileData(foundProfile);
            } else {
              console.log("No matching receiver profile found for user:", user.email);
              setProfileData(null);
              
              // Show toast with link to registration
              toast({
                variant: "destructive",
                title: "Profile not found",
                description: (
                  <div>
                    <p>Your receiver profile could not be found automatically.</p>
                    <p className="mt-2">
                      <a href="/receiver/register" className="underline font-medium">
                        Click here to register as a receiver
                      </a>
                    </p>
                  </div>
                )
              });
            }
          }
        } catch (profileError) {
          console.error("Error fetching profile:", profileError);
        }
        
        // Fetch all data for dashboard
        try {
          const [allDonors, allReceivers, allSamples] = await Promise.all([
            donorAPI.getAllDonors(),
            receiverAPI.getAllReceivers(),
            bloodSampleAPI.getAllBloodSamples()
          ]);
          
          setBloodDonors(allDonors || []);
          setBloodReceivers(allReceivers || []);
          setBloodSamples(allSamples?.map(sample => ({
            ...sample,
            blood_grp: sample.blood_grp || '',
            quantity: 1,
            collection_date: new Date().toISOString().split('T')[0],
            expiry_date: new Date(new Date().setDate(new Date().getDate() + 42)).toISOString().split('T')[0]
          })) || []);
        } catch (dataError) {
          console.error("Error fetching dashboard data:", dataError);
          toast({
            variant: "destructive",
            title: "Error loading data",
            description: "Could not load dashboard data. Please try again later."
          });
        }

        // Fetch donor profile if user role includes donor
        if (userRole === 'donor') {
          try {
            // Check if we have a manually set donor ID first
            const manualDonorId = getManualDonorId();
            
            if (manualDonorId) {
              try {
                // Use the manually set donor ID
                const donorData = await donorAPI.getDonorById(manualDonorId);
                if (donorData) {
                  setProfileData(donorData);
                } else {
                  console.log("No donor data found for manual ID:", manualDonorId);
                }
              } catch (donorError) {
                console.error("Error fetching donor profile with ID:", manualDonorId, donorError);
                // Don't throw, just log error and continue
              }
            }
          } catch (error) {
            console.error("Error in donor profile handling:", error);
            // Don't throw, allow dashboard to load with other data
          }
        }
      } catch (error) {
        console.error("Dashboard error:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, [router]);

  const handleSignOut = async () => {
    try {
      await signOut();
      router.push("/");
    } catch (error) {
      console.error("Error signing out:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to sign out. Please try again."
      });
    }
  };

  const handleRefreshProfile = async () => {
    try {
      setIsRefreshing(true);
      // Get current user data
      const user = await getCurrentUser();
      
      if (!user) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "User not found. Please log in again."
        });
        return;
      }
      
      const userRole = user.user_metadata?.role || "guest";
      
      if (userRole === "donor") {
        // Check if we have a manually set donor ID first
        const manualDonorId = getManualDonorId();
        
        if (manualDonorId) {
          // Use the manually set donor ID
          const donorData = await donorAPI.getDonorById(manualDonorId);
          setProfileData(donorData);
          toast({
            title: "Profile refreshed",
            description: "Your donor profile has been updated"
          });
        } else {
          // If no manual ID, try to find donor by email matching
          const donors = await donorAPI.getAllDonors();
          const foundDonorProfile = donors.find(donor => 
            donor.donor_phno && user.email && 
            (donor.donor_phno.toLowerCase() === user.email.toLowerCase() ||
             donor.donor_phno.includes(user.email.substring(0, 5)))
          );
          
          if (foundDonorProfile) {
            setProfileData(foundDonorProfile);
            toast({
              title: "Profile refreshed",
              description: "Your donor profile has been updated"
            });
          } else {
            toast({
              variant: "destructive",
              title: "Profile not found",
              description: (
                <div>
                  <p>Your donor profile could not be found automatically.</p>
                  <p className="mt-2">
                    <a href="/debug/donor-list" className="underline font-medium">
                      Click here to select your profile manually
                    </a>
                  </p>
                </div>
              )
            });
          }
        }
      } else if (userRole === "receiver") {
        // Get the receivers and try to find the profile
        const receivers = await receiverAPI.getAllReceivers();
        
        // First try to find by user profile link
        const { data: userProfile, error: profileError } = await supabase
          .from('user_profiles')
          .select('profile_id')
          .eq('user_id', user.id)
          .eq('profile_type', 'receiver')
          .single();
        
        let foundReceiverProfile = null;
        
        if (!profileError && userProfile) {
          foundReceiverProfile = receivers.find(
            receiver => receiver.receiver_id === userProfile.profile_id
          );
        }
        
        // If not found by profile link, try metadata or email
        if (!foundReceiverProfile) {
          foundReceiverProfile = receivers.find(
            receiver => (user.user_metadata?.receiverId && 
                         receiver.receiver_id === user.user_metadata.receiverId) ||
                        (receiver.r_phno && user.email && 
                         receiver.r_phno.toLowerCase() === user.email.toLowerCase())
          );
        }
        
        if (foundReceiverProfile) {
          setProfileData(foundReceiverProfile);
          toast({
            title: "Profile refreshed",
            description: "Your receiver profile has been updated"
          });
        } else {
          toast({
            variant: "destructive",
            title: "Profile not found",
            description: (
              <div>
                <p>Your receiver profile could not be found automatically.</p>
                <p className="mt-2">
                  <a href="/receiver/register" className="underline font-medium">
                    Click here to register as a receiver
                  </a>
                </p>
              </div>
            )
          });
        }
      }
    } catch (error) {
      console.error("Error refreshing profile:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to refresh your profile. Please try again."
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <div className="text-center">
          <div className="mx-auto h-16 w-16 rounded-full bg-red-100 p-3 mb-4">
            <div className="h-full w-full rounded-full bg-red-600 animate-pulse"></div>
          </div>
          <p className="text-black font-medium">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b">
        <div className="container mx-auto py-4 px-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-red-600">Blood Bank Dashboard</h1>
          <div className="flex items-center gap-4">
            <p className="text-black font-medium">Welcome, {userData?.email}</p>
            <Button variant="redOutline" onClick={handleSignOut}>Sign Out</Button>
          </div>
        </div>
      </header>
      
      <main className="container mx-auto py-8 px-4">
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-black mb-4">Your Profile</h2>
          <Card className="border border-gray-100 shadow-md overflow-hidden">
            <div className="h-2 bg-red-600"></div>
            <CardHeader>
              <CardTitle className="text-black">{userRole === "donor" ? "Donor Profile" : "Receiver Profile"}</CardTitle>
              <CardDescription className="text-black font-medium">Your registration details</CardDescription>
            </CardHeader>
            <CardContent>
              {profileData ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {userRole === "donor" && isDonorProfile(profileData) && (
                    <>
                      <div>
                        <p className="text-sm text-gray-500">Name</p>
                        <p>{profileData.donor_name}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Blood Group</p>
                        <p className="font-medium text-red-600">{profileData.donor_bgrp}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Age</p>
                        <p>{profileData.donor_age}</p>
                      </div>
                    </>
                  )}
                  
                  {userRole === "receiver" && isReceiverProfile(profileData) && (
                    <>
                      <div>
                        <p className="text-sm text-gray-500">Name</p>
                        <p>{profileData.receiver_name}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Blood Group</p>
                        <p className="font-medium text-red-600">{profileData.r_bgrp}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Age</p>
                        <p>{profileData.r_age}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Registration Date</p>
                        <p>{new Date(profileData.r_reg_date).toLocaleDateString()}</p>
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <p className="text-black font-medium">No profile data available.</p>
              )}
            </CardContent>
            <CardFooter className="flex flex-col sm:flex-row gap-3">
              {profileData ? (
                <Button variant="red" onClick={() => router.push('/donor/appointments')} className="w-full">
                  Manage Appointments
                </Button>
              ) : (
                <>
                  <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Link href="/donor/register">
                      <Button variant="red" className="w-full">Register as a Donor</Button>
                    </Link>
                    <Link href="/receiver/register">
                      <Button variant="red" className="w-full">Register as a Receiver</Button>
                    </Link>
                  </div>
                  <Button 
                    variant="outline" 
                    className="w-full" 
                    onClick={handleRefreshProfile}
                    disabled={isRefreshing}
                  >
                    {isRefreshing ? "Refreshing..." : "Refresh Profile"}
                  </Button>
                </>
              )}
              {userRole === "receiver" && profileData && (
                <Link href="/receiver/matched-donors">
                  <Button variant="red" className="w-full">
                    Find Matching Donors
                  </Button>
                </Link>
              )}
            </CardFooter>
          </Card>
        </div>
        
        <div className="mb-8">
          <Tabs defaultValue="donors">
            <TabsList className="flex justify-center w-full mb-10 rounded-lg border border-gray-200 p-1 gap-1 bg-gray-50">
              <TabsTrigger 
                value="donors" 
                className="flex-1 rounded-md py-3 flex justify-center items-center px-2 text-gray-700 font-medium data-[state=active]:bg-white data-[state=active]:text-red-600 data-[state=active]:font-semibold data-[state=active]:shadow-sm transition-all duration-200 relative"
              >
                <span className="text-center">Blood Donors</span>
                <span className="absolute -bottom-1 left-0 w-full h-0.5 bg-red-600 opacity-0 data-[state=active]:opacity-100 transition-opacity"></span>
              </TabsTrigger>
              <TabsTrigger 
                value="receivers" 
                className="flex-1 rounded-md py-3 flex justify-center items-center px-2 text-gray-700 font-medium data-[state=active]:bg-white data-[state=active]:text-red-600 data-[state=active]:font-semibold data-[state=active]:shadow-sm transition-all duration-200 relative"
              >
                <span className="text-center">Blood Receivers</span>
                <span className="absolute -bottom-1 left-0 w-full h-0.5 bg-red-600 opacity-0 data-[state=active]:opacity-100 transition-opacity"></span>
              </TabsTrigger>
              <TabsTrigger 
                value="inventory" 
                className="flex-1 rounded-md py-3 flex justify-center items-center px-2 text-gray-700 font-medium data-[state=active]:bg-white data-[state=active]:text-red-600 data-[state=active]:font-semibold data-[state=active]:shadow-sm transition-all duration-200 relative"
              >
                <span className="text-center">Blood Inventory</span>
                <span className="absolute -bottom-1 left-0 w-full h-0.5 bg-red-600 opacity-0 data-[state=active]:opacity-100 transition-opacity"></span>
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="donors">
              <Card className="border border-gray-100 shadow-md overflow-hidden">
                <div className="h-2 bg-red-600"></div>
                <CardHeader>
                  <CardTitle className="text-black">Available Blood Donors</CardTitle>
                  <CardDescription className="text-black font-medium">List of registered blood donors</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-red-600 uppercase tracking-wider">Name</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-red-600 uppercase tracking-wider">Blood Group</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-red-600 uppercase tracking-wider">Age</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-red-600 uppercase tracking-wider">City</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {bloodDonors.length > 0 ? (
                          bloodDonors.map((donor) => (
                            <tr key={donor.donor_id}>
                              <td className="px-6 py-4 whitespace-nowrap">{donor.donor_name}</td>
                              <td className="px-6 py-4 whitespace-nowrap font-medium text-red-600">{donor.donor_bgrp}</td>
                              <td className="px-6 py-4 whitespace-nowrap">{donor.donor_age}</td>
                              <td className="px-6 py-4 whitespace-nowrap">{donor.city?.city_name}</td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={4} className="px-6 py-4 text-center text-black font-medium">No donors found</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="receivers">
              <Card className="border border-gray-100 shadow-md overflow-hidden">
                <div className="h-2 bg-red-600"></div>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle>Blood Receivers</CardTitle>
                      <CardDescription>List of registered blood receivers</CardDescription>
                    </div>
                    {userRole === "receiver" && (
                      <Link href="/receiver/matched-donors">
                        <Button variant="red" className="ml-4">
                          View My Matched Donors
                        </Button>
                      </Link>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-red-600 uppercase tracking-wider">Name</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-red-600 uppercase tracking-wider">Blood Group Needed</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-red-600 uppercase tracking-wider">Age</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-red-600 uppercase tracking-wider">City</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {bloodReceivers.length > 0 ? (
                          bloodReceivers.map((receiver) => (
                            <tr key={receiver.receiver_id}>
                              <td className="px-6 py-4 whitespace-nowrap">{receiver.receiver_name}</td>
                              <td className="px-6 py-4 whitespace-nowrap font-medium text-red-600">{receiver.r_bgrp}</td>
                              <td className="px-6 py-4 whitespace-nowrap">{receiver.r_age}</td>
                              <td className="px-6 py-4 whitespace-nowrap">{receiver.city?.city_name}</td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={4} className="px-6 py-4 text-center">No receivers found</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="inventory">
              <Card className="border border-gray-100 shadow-md overflow-hidden">
                <div className="h-2 bg-red-600"></div>
                <CardHeader>
                  <CardTitle>Blood Inventory</CardTitle>
                  <CardDescription>Current blood samples available</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-red-600 uppercase tracking-wider">Sample ID</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-red-600 uppercase tracking-wider">Blood Group</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-red-600 uppercase tracking-wider">Status</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-red-600 uppercase tracking-wider">Doctor</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {bloodSamples.length > 0 ? (
                          bloodSamples.map((sample) => (
                            <tr key={sample.sample_id}>
                              <td className="px-6 py-4 whitespace-nowrap">{sample.sample_id}</td>
                              <td className="px-6 py-4 whitespace-nowrap font-medium text-red-600">{sample.blood_grp}</td>
                              <td className="px-6 py-4 whitespace-nowrap">{sample.status}</td>
                              <td className="px-6 py-4 whitespace-nowrap">{sample.doctor?.doc_name}</td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={4} className="px-6 py-4 text-center">No blood samples found</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}
