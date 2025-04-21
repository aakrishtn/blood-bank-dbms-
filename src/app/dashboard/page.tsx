"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getCurrentUser, signOut } from "@/lib/auth";
import { donorAPI, receiverAPI, hospitalAPI, bloodSampleAPI } from "@/lib/database";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/components/ui/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Define types for our data
interface UserData {
  email?: string;
  user_metadata?: {
    role?: string;
  };
}

interface DonorProfile {
  donor_id: string;
  donor_name: string;
  donor_bgrp: string;
  donor_age: number;
  donor_sex: string;
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
  city?: {
    city_name: string;
  };
}

interface HospitalProfile {
  h_id: string;
  h_name: string;
  h_bgrprequired?: string;
  h_bgrpreceived?: string;
  city?: {
    city_name: string;
  };
}

interface BloodSample {
  sample_id: string;
  blood_group: string;
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

function isHospitalProfile(profile: ProfileData): profile is HospitalProfile {
  return 'h_id' in profile;
}

type ProfileData = DonorProfile | ReceiverProfile | HospitalProfile;

export default function DashboardPage() {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [userRole, setUserRole] = useState<string>("");
  const [bloodDonors, setBloodDonors] = useState<DonorProfile[]>([]);
  const [bloodReceivers, setBloodReceivers] = useState<ReceiverProfile[]>([]);
  const [bloodSamples, setBloodSamples] = useState<BloodSample[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const user = await getCurrentUser();
        if (!user) {
          router.push("/login");
          return;
        }

        // Convert the user object to match our UserData interface
        const userData: UserData = {
          email: user.email || '',
          user_metadata: user.user_metadata || {},
        };
        
        setUserData(userData);
        
        // In real implementation, you would fetch the user's role and linked profile data
        // For demo purposes, we'll assume the role from user's metadata
        const role = user.user_metadata?.role || "donor";
        setUserRole(role);
        
        // Fetch relevant data based on user role
        if (role === "donor") {
          const donors = await donorAPI.getAllDonors();
          setBloodDonors(donors);
          // You would fetch the specific donor profile linked to this user
          // For demo, we'll just use the first donor
          if (donors.length > 0) {
            setProfileData(donors[0]);
          }
        } else if (role === "receiver") {
          const receivers = await receiverAPI.getAllReceivers();
          setBloodReceivers(receivers);
          // You would fetch the specific receiver profile linked to this user
          if (receivers.length > 0) {
            setProfileData(receivers[0]);
          }
        } else if (role === "hospital") {
          const hospitals = await hospitalAPI.getAllHospitals();
          // You would fetch the specific hospital profile linked to this user
          if (hospitals.length > 0) {
            setProfileData(hospitals[0]);
          }
        }
        
        // Fetch blood samples for everyone
        const samples = await bloodSampleAPI.getAllBloodSamples();
        setBloodSamples(samples);
      } catch (error) {
        console.error("Error fetching user data:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load user data. Please try again.",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData();
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
        description: "Failed to sign out. Please try again.",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p>Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b">
        <div className="container mx-auto py-4 px-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-red-600">Blood Bank Dashboard</h1>
          <div className="flex items-center gap-4">
            <p className="text-sm">Welcome, {userData?.email}</p>
            <Button variant="outline" onClick={handleSignOut}>Sign Out</Button>
          </div>
        </div>
      </header>
      
      <main className="container mx-auto py-8 px-4">
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Your Profile</h2>
          <Card>
            <CardHeader>
              <CardTitle>{userRole === "donor" ? "Donor Profile" : userRole === "receiver" ? "Receiver Profile" : "Hospital Profile"}</CardTitle>
              <CardDescription>Your registration details</CardDescription>
            </CardHeader>
            <CardContent>
              {profileData ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                      <div>
                        <p className="text-sm text-gray-500">Gender</p>
                        <p>{profileData.donor_sex === "M" ? "Male" : profileData.donor_sex === "F" ? "Female" : "Other"}</p>
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
                        <p className="text-sm text-gray-500">Blood Group Needed</p>
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
                  
                  {userRole === "hospital" && isHospitalProfile(profileData) && (
                    <>
                      <div>
                        <p className="text-sm text-gray-500">Hospital Name</p>
                        <p>{profileData.h_name}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">City</p>
                        <p>{profileData.city?.city_name || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Blood Group Required</p>
                        <p className="font-medium text-red-600">{profileData.h_bgrprequired || "None"}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Blood Group Received</p>
                        <p>{profileData.h_bgrpreceived || "None"}</p>
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <p>No profile data available.</p>
              )}
            </CardContent>
            <CardFooter>
              <Button variant="outline" className="w-full">Edit Profile</Button>
            </CardFooter>
          </Card>
        </div>
        
        <div className="mb-8">
          <Tabs defaultValue="donors">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="donors">Blood Donors</TabsTrigger>
              <TabsTrigger value="receivers">Blood Receivers</TabsTrigger>
              <TabsTrigger value="inventory">Blood Inventory</TabsTrigger>
            </TabsList>
            
            <TabsContent value="donors">
              <Card>
                <CardHeader>
                  <CardTitle>Available Blood Donors</CardTitle>
                  <CardDescription>List of registered blood donors</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Blood Group</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Age</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">City</th>
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
                            <td colSpan={4} className="px-6 py-4 text-center">No donors found</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="receivers">
              <Card>
                <CardHeader>
                  <CardTitle>Blood Receivers</CardTitle>
                  <CardDescription>List of registered blood receivers</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Blood Group Needed</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Age</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">City</th>
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
              <Card>
                <CardHeader>
                  <CardTitle>Blood Inventory</CardTitle>
                  <CardDescription>Current blood samples available</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sample ID</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Blood Group</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Doctor</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {bloodSamples.length > 0 ? (
                          bloodSamples.map((sample) => (
                            <tr key={sample.sample_id}>
                              <td className="px-6 py-4 whitespace-nowrap">{sample.sample_id}</td>
                              <td className="px-6 py-4 whitespace-nowrap font-medium text-red-600">{sample.blood_group}</td>
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
                {userRole === "hospital" && (
                  <CardFooter>
                    <Button className="w-full bg-red-600 hover:bg-red-700">Request Blood Sample</Button>
                  </CardFooter>
                )}
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
} 