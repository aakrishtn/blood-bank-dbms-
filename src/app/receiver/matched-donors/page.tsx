"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { receiverAPI, donorAPI } from "@/lib/database";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/components/ui/use-toast";
import Link from "next/link";

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

interface MatchedDonor {
  donor_id: string;
  donor_name: string;
  donor_bgrp: string;
  donor_age: number;
  donor_sex: string;
  city: {
    city_name: string;
  };
  hospital?: string;
  doctor?: string;
}

// Hospital names and doctor names for random assignment
const HOSPITAL_NAMES = [
  "City Medical Center",
  "Mercy Hospital",
  "General Hospital",
  "Memorial Medical",
  "Hope Medical Center",
  "Unity Hospital",
  "Aurora Medical Center",
  "Providence Hospital",
  "Lifeline Hospital",
  "Central Hospital"
];

const DOCTOR_NAMES = [
  "Dr. John Smith",
  "Dr. Sarah Johnson",
  "Dr. Michael Chen",
  "Dr. Emily Williams",
  "Dr. James Davis",
  "Dr. David Wilson",
  "Dr. Maria Rodriguez",
  "Dr. Robert Brown",
  "Dr. Lisa Anderson",
  "Dr. Thomas Moore",
  "Dr. Jennifer Garcia",
  "Dr. William Taylor"
];

export default function MatchedDonorsPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [matchedDonors, setMatchedDonors] = useState<MatchedDonor[]>([]);
  const [receiverInfo, setReceiverInfo] = useState<Receiver | null>(null);
  const router = useRouter();

  // Function to check blood type compatibility
  const isCompatibleBloodType = (receiverBloodType: string, donorBloodType: string) => {
    const compatibility: Record<string, string[]> = {
      'A+': ['A+', 'A-', 'O+', 'O-'],
      'A-': ['A-', 'O-'],
      'B+': ['B+', 'B-', 'O+', 'O-'],
      'B-': ['B-', 'O-'],
      'AB+': ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
      'AB-': ['A-', 'B-', 'AB-', 'O-'],
      'O+': ['O+', 'O-'],
      'O-': ['O-']
    };
    
    return compatibility[receiverBloodType]?.includes(donorBloodType) || false;
  };

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Get current user
        const user = await getCurrentUser();
        if (!user) {
          router.push("/login");
          return;
        }

        // Check localStorage for recently registered blood type and receiver ID
        const storedBloodType = typeof window !== 'undefined' ? window.localStorage.getItem('receiverBloodType') : null;
        const storedReceiverId = typeof window !== 'undefined' ? window.localStorage.getItem('receiverId') : null;
        
        // Check if user is a receiver or if receiver role is in localStorage
        const storedRole = typeof window !== 'undefined' ? window.localStorage.getItem('userRole') : null;
        
        if (user.user_metadata?.role !== "receiver" && storedRole !== 'receiver') {
          toast({
            variant: "destructive",
            title: "Access Denied",
            description: "Only receivers can view matched donors."
          });
          router.push("/dashboard");
          return;
        }
        
        // If user role is in localStorage but not in user metadata, consider it temporary access
        if (storedRole === 'receiver' && user.user_metadata?.role !== "receiver") {
          console.log("Using temporary receiver role from localStorage");
        }

        // Get receiver profile
        const receivers = await receiverAPI.getAllReceivers();
        
        // Use email/phone as fallback for matching
        const userEmail = user.email;
        let receiverProfile = null;
        
        // If we have a stored receiver ID from registration, use it directly
        if (storedReceiverId) {
          console.log("Using stored receiver ID:", storedReceiverId);
          receiverProfile = receivers.find(receiver => receiver.receiver_id === storedReceiverId);
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
          
          console.log("Using fallback profile from recent registrations", fallbackProfile?.r_bgrp);
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

        // Get all donors and filter by blood type compatibility
        try {
          // First try using the stored procedure for matching
          const matched = await receiverAPI.matchDonors(profileToUse.receiver_id);
          
          if (matched && matched.length > 0) {
            // Fetch full donor details for each matched donor
            const donorDetails = await Promise.all(
              matched.map(async (match: { donor_id: string; donor_name: string; blood_grp: string }) => {
                try {
                  const donor = await donorAPI.getDonorById(match.donor_id);
                  // Double-check compatibility using our client-side function as well
                  if (isCompatibleBloodType(profileToUse.r_bgrp, donor.donor_bgrp)) {
                    // Assign random hospital and doctor
                    const hospital = HOSPITAL_NAMES[Math.floor(Math.random() * HOSPITAL_NAMES.length)];
                    const doctor = DOCTOR_NAMES[Math.floor(Math.random() * DOCTOR_NAMES.length)];
                    return {
                      ...donor,
                      hospital,
                      doctor
                    };
                  }
                  return null;
                } catch (error) {
                  console.error("Error fetching donor details:", error);
                  return null;
                }
              })
            );
            
            setMatchedDonors(donorDetails.filter(Boolean) as MatchedDonor[]);
          } else {
            // Fallback: Get all donors and filter on client side if stored procedure fails
            console.log("No matches from stored procedure, using client-side fallback");
            const allDonors = await donorAPI.getAllDonors();
            const compatibleDonors = allDonors
              .filter(donor => isCompatibleBloodType(profileToUse.r_bgrp, donor.donor_bgrp))
              .map(donor => {
                // Assign random hospital and doctor
                const hospital = HOSPITAL_NAMES[Math.floor(Math.random() * HOSPITAL_NAMES.length)];
                const doctor = DOCTOR_NAMES[Math.floor(Math.random() * DOCTOR_NAMES.length)];
                return {
                  ...donor,
                  hospital,
                  doctor
                };
              });
            setMatchedDonors(compatibleDonors as MatchedDonor[]);
          }
        } catch (error) {
          console.error("Error with primary matching method, using fallback:", error);
          // Ultimate fallback: Get all donors and filter on client side
          const allDonors = await donorAPI.getAllDonors();
          const compatibleDonors = allDonors
            .filter(donor => isCompatibleBloodType(profileToUse.r_bgrp, donor.donor_bgrp))
            .map(donor => {
              // Assign random hospital and doctor
              const hospital = HOSPITAL_NAMES[Math.floor(Math.random() * HOSPITAL_NAMES.length)];
              const doctor = DOCTOR_NAMES[Math.floor(Math.random() * DOCTOR_NAMES.length)];
              return {
                ...donor,
                hospital,
                doctor
              };
            });
          setMatchedDonors(compatibleDonors as MatchedDonor[]);
        }
        
        // Clear localStorage role after we've used it once, but keep receiver ID and blood type
        if (storedRole === 'receiver') {
          window.localStorage.removeItem('userRole');
        }
      } catch (error) {
        console.error("Error fetching matched donors:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to fetch matching donors. Please try again."
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [router]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-red-600 border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>
          <p className="mt-4 text-lg font-medium text-gray-900">Loading matched donors...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white p-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-black mb-2">Your Compatible <span className="text-red-600">Blood Donors</span></h1>
          {receiverInfo && (
            <p className="text-gray-700 max-w-2xl mx-auto">
              Based on your blood type ({receiverInfo.r_bgrp}), we&apos;ve found the following compatible donors
            </p>
          )}
        </div>
        
        <div className="mb-6">
          <Card className="border-0 shadow-lg overflow-hidden">
            <div className="h-2 bg-red-600"></div>
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-black text-xl">Compatible Donors</CardTitle>
                  <CardDescription className="text-black font-medium">
                    {matchedDonors.length > 0 
                      ? `${matchedDonors.length} donor${matchedDonors.length > 1 ? 's' : ''} found for your blood type`
                      : 'No compatible donors found at this time'}
                  </CardDescription>
                </div>
                <Link href="/dashboard">
                  <Button variant="outline" className="border-gray-200 text-gray-600">
                    Back to Dashboard
                  </Button>
                </Link>
              </div>
            </CardHeader>
            
            <CardContent>
              {matchedDonors.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-red-600 uppercase tracking-wider">Name</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-red-600 uppercase tracking-wider">Blood Group</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-red-600 uppercase tracking-wider">Gender</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-red-600 uppercase tracking-wider">City</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-red-600 uppercase tracking-wider">Hospital</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-red-600 uppercase tracking-wider">Doctor</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-red-600 uppercase tracking-wider">Action</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {matchedDonors.map((donor) => (
                        <tr key={donor.donor_id}>
                          <td className="px-6 py-4 whitespace-nowrap">{donor.donor_name}</td>
                          <td className="px-6 py-4 whitespace-nowrap font-medium text-red-600">{donor.donor_bgrp}</td>
                          <td className="px-6 py-4 whitespace-nowrap">{donor.donor_sex || 'Not specified'}</td>
                          <td className="px-6 py-4 whitespace-nowrap">{donor.city?.city_name || 'Not specified'}</td>
                          <td className="px-6 py-4 whitespace-nowrap">{donor.hospital || 'Not specified'}</td>
                          <td className="px-6 py-4 whitespace-nowrap">{donor.doctor || 'Not specified'}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Button
                              variant="red"
                              size="sm"
                              onClick={() => {
                                try {
                                  // Store the selected donor details in localStorage
                                  localStorage.setItem('selectedDonor', JSON.stringify({
                                    id: donor.donor_id,
                                    name: donor.donor_name,
                                    bloodGroup: donor.donor_bgrp,
                                    hospital: donor.hospital,
                                    doctor: donor.doctor
                                  }));
                                  
                                  // Store the first blood center as default (this would be improved in a real app)
                                  const defaultCenter = {
                                    id: 'BC001',
                                    name: 'Central Blood Bank'
                                  };
                                  localStorage.setItem('selectedBloodCenter', JSON.stringify(defaultCenter));
                                  
                                  console.log('Navigating to schedule appointment page...');
                                  
                                  // Try both navigation methods for redundancy
                                  window.location.href = '/receiver/schedule-appointment';
                                  
                                  // As a fallback, also try the router navigation
                                  setTimeout(() => {
                                    router.push('/receiver/schedule-appointment');
                                  }, 100);
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
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Compatible Donors Found</h3>
                  <p className="text-gray-600 max-w-md mx-auto mb-6">
                    We don&apos;t have any registered donors compatible with your blood type right now. Please check back later or contact a blood bank directly.
                  </p>
                  <Link href="/blood-centers">
                    <Button variant="red">
                      Find Blood Centers
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>

            <CardFooter className="border-t border-gray-100 bg-gray-50 py-4">
              {matchedDonors.length > 0 && (
                <div className="text-sm text-gray-500 w-full text-center">
                  Note: Contact information will only be shared after the donor accepts your request.
                </div>
              )}
            </CardFooter>
          </Card>
        </div>
        
        <div className="bg-red-50 border border-red-100 rounded-lg p-4 text-sm text-gray-700">
          <div className="font-medium text-red-800 mb-1">Important Information</div>
          <ul className="list-disc pl-5 space-y-1">
            <li>Donors must be contacted through our platform for privacy and safety reasons.</li>
            <li>All blood donations must be arranged through approved medical facilities.</li>
            <li>Blood compatibility is essential, but additional testing may be required before transfusion.</li>
            <li>For emergency needs, please contact the nearest hospital or blood bank directly.</li>
          </ul>
        </div>
      </div>
    </div>
  );
} 