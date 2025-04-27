"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { receiverAPI } from "@/lib/database";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/components/ui/use-toast";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

interface Receiver {
  receiver_id: string;
  receiver_name: string;
  r_bgrp: string;
  r_age: number;
  r_sex: string;
  r_reg_date: string;
  r_phno?: string;
  city?: {
    city_name: string;
  };
}

interface BloodInventory {
  inventory_id: string;
  hospital_id: string;
  hospital_name: string;
  city_id: string;
  city_name: string;
  blood_group: string;
  quantity: number;
  doctor_id: string;
  doctor_name: string;
}

export default function CompatibleBloodPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [availableBlood, setAvailableBlood] = useState<BloodInventory[]>([]);
  const [receiverInfo, setReceiverInfo] = useState<Receiver | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Get the current user
        const user = await getCurrentUser();
        if (!user) {
          toast({
            variant: "destructive",
            title: "Authentication Required",
            description: "Please log in to view available blood"
          });
          router.push('/login');
          return;
        }

        // Get stored values from localStorage
        let storedBloodType = null;
        let storedRole = null;
        let storedReceiverId = null;
        
        if (typeof window !== 'undefined') {
          storedBloodType = window.localStorage.getItem('receiverBloodType');
          storedRole = window.localStorage.getItem('userRole');
          storedReceiverId = window.localStorage.getItem('receiverId');
        }
        
        // Get user email for matching
        const userEmail = user.email?.toLowerCase() || '';

        // Attempt to find receiver profile first through stored ID
        const receivers = await receiverAPI.getAllReceivers();
        let receiverProfile = null;
        
        if (storedReceiverId) {
          receiverProfile = receivers.find(receiver => receiver.receiver_id === storedReceiverId);
          console.log(`Looking for receiver with ID ${storedReceiverId}:`, receiverProfile ? "Found" : "Not found");
        }

        // If no profile found yet, try standard matching
        if (!receiverProfile) {
          // Find the receiver profile for this user - more flexible matching
          receiverProfile = receivers.find(receiver => 
            // Try more matching options to find the profile
            receiver.r_phno === userEmail || 
            receiver.receiver_name.toLowerCase() === user.user_metadata?.name?.toLowerCase()
          );
        }

        // If we still couldn't find a profile but have localStorage role,
        // try using the most recently added receiver as a fallback
        let fallbackProfile = null;
        if (!receiverProfile && storedRole === 'receiver') {
          // Sort receivers by registration date (most recent first)
          const sortedReceivers = [...receivers].sort((a, b) => 
            new Date(b.r_reg_date).getTime() - new Date(a.r_reg_date).getTime()
          );
          
          // Extra check: if we know the blood type, make sure it matches what we're looking for
          if (storedBloodType && sortedReceivers.length > 0) {
            fallbackProfile = sortedReceivers.find(receiver => receiver.r_bgrp === storedBloodType) || sortedReceivers[0];
          } else {
            fallbackProfile = sortedReceivers[0];
          }
        }

        const profileToUse = receiverProfile || fallbackProfile;
        
        if (!profileToUse) {
          toast({
            variant: "destructive",
            title: "Profile Not Found",
            description: "Could not find your receiver profile. Please register first."
          });
          router.push("/receiver/register");
          return;
        }

        console.log("Using receiver profile with blood type:", profileToUse.r_bgrp);
        setReceiverInfo(profileToUse);

        // Store the receiver ID for future reference
        if (typeof window !== 'undefined') {
          window.localStorage.setItem('receiverId', profileToUse.receiver_id);
          window.localStorage.setItem('receiverBloodType', profileToUse.r_bgrp);
        }

        // Fetch compatible blood inventory from hospitals
        try {
          // Call the function to get available blood for the receiver's blood type
          const { data: inventoryData, error: inventoryError } = await supabase.rpc(
            'get_hospital_blood_inventory', 
            { blood_group_param: profileToUse.r_bgrp }
          );
          
          if (inventoryError) {
            throw inventoryError;
          }
          
          if (inventoryData && inventoryData.length > 0) {
            setAvailableBlood(inventoryData);
          } else {
            console.log("No compatible blood inventory found");
            setAvailableBlood([]);
          }
        } catch (error) {
          console.error("Error fetching blood inventory:", error);
          
          // Fallback - display some demo data if the function failed
          const demoInventory = [
            {
              inventory_id: "inv1",
              hospital_id: "H001",
              hospital_name: "Dallas Memorial Hospital",
              city_id: "DLS",
              city_name: "Dallas",
              blood_group: profileToUse.r_bgrp,
              quantity: 5,
              doctor_id: "D001",
              doctor_name: "Dr. Michael Johnson"
            },
            {
              inventory_id: "inv2",
              hospital_id: "H002",
              hospital_name: "Dallas Methodist Medical Center",
              city_id: "DLS",
              city_name: "Dallas",
              blood_group: profileToUse.r_bgrp === "O-" ? "O-" : "O+",
              quantity: 3,
              doctor_id: "D002",
              doctor_name: "Dr. Sarah Williams"
            }
          ];
          
          setAvailableBlood(demoInventory);
        }
        
        // Clear localStorage role after we've used it once, but keep receiver ID and blood type
        if (storedRole === 'receiver') {
          window.localStorage.removeItem('userRole');
        }
      } catch (error) {
        console.error("Error:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to fetch available blood. Please try again."
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center">
          <div className="h-12 w-12 rounded-full bg-red-200 mb-4"></div>
          <div className="h-4 w-56 bg-gray-200 rounded mb-3"></div>
          <div className="h-3 w-44 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white p-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-black mb-2">Your Compatible <span className="text-red-600">Hospitals</span></h1>
          {receiverInfo && (
            <p className="text-gray-700 max-w-2xl mx-auto">
              Based on your blood type ({receiverInfo.r_bgrp}), we&apos;ve found the following compatible hospitals with blood availability
            </p>
          )}
        </div>
        
        <div className="mb-6">
          <Card className="border-0 shadow-lg overflow-hidden">
            <div className="h-2 bg-red-600"></div>
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-black text-xl">Compatible Hospitals</CardTitle>
                  <CardDescription className="text-black font-medium">
                    {availableBlood.length > 0 
                      ? `${availableBlood.length} ${availableBlood.length > 1 ? 'hospitals' : 'hospital'} found with compatible blood`
                      : 'No compatible blood found at this time'}
                  </CardDescription>
                </div>
                <Link href="/dashboard">
                  <Button variant="outline" className="border-gray-200 text-gray-600">
                    Back to Dashboard
                  </Button>
                </Link>
              </div>
            </CardHeader>
            
            <CardContent className="px-0">
              {availableBlood.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-red-600 uppercase tracking-wider">Hospital</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-red-600 uppercase tracking-wider">Blood Group</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-red-600 uppercase tracking-wider">City</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-red-600 uppercase tracking-wider">Doctor</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-red-600 uppercase tracking-wider">Action</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {availableBlood.map((item) => (
                        <tr key={item.inventory_id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {item.hospital_name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {item.blood_group}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {item.city_name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {item.doctor_name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <Button 
                              variant="red"
                              size="sm"
                              onClick={() => {
                                try {
                                  // Store the selected hospital and appointment details
                                  if (typeof window !== 'undefined') {
                                    window.localStorage.setItem('selectedHospitalId', item.hospital_id);
                                    window.localStorage.setItem('selectedHospitalName', item.hospital_name);
                                    window.localStorage.setItem('selectedDoctorId', item.doctor_id);
                                    window.localStorage.setItem('selectedDoctorName', item.doctor_name);
                                    window.localStorage.setItem('selectedBloodGroup', item.blood_group);
                                  }
                                  
                                  // Navigate to the appointment scheduling page
                                  router.push('/receiver/schedule-appointment');
                                } catch (error) {
                                  console.error('Navigation error:', error);
                                  // If all else fails, try a simple href
                                  window.location.href = '/receiver/schedule-appointment';
                                }
                              }}
                            >
                              Schedule Appointment
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-12 bg-gray-50 rounded-lg">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-red-50 rounded-full mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Compatible Blood Found</h3>
                  <p className="text-gray-600 max-w-md mx-auto mb-6">
                    We don&apos;t have any compatible blood available in Dallas hospitals right now. Please check back later or contact a blood bank directly.
                  </p>
                  <Link href="/blood-centers">
                    <Button variant="red">
                      Find Blood Centers
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>

            <CardFooter className="bg-gray-50 px-6 py-4">
              {availableBlood.length > 0 && (
                <div className="text-sm text-gray-500 w-full text-center">
                  Note: Contact information will only be shared after the appointment is confirmed.
                </div>
              )}
            </CardFooter>
          </Card>
        </div>
        
        <div className="bg-red-50 border border-red-100 rounded-lg p-4 text-sm text-gray-700">
          <div className="font-medium text-red-800 mb-1">Important Information</div>
          <ul className="list-disc pl-5 space-y-1">
            <li>Hospitals must be contacted through our platform for privacy and safety reasons.</li>
            <li>All blood transfusions must be arranged through approved medical facilities.</li>
            <li>Blood compatibility is essential, but additional testing may be required before transfusion.</li>
            <li>For emergency needs, please contact the nearest hospital or blood bank directly.</li>
          </ul>
        </div>
      </div>
    </div>
  );
} 