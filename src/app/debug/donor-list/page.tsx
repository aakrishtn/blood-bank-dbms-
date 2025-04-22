"use client";

import { useState, useEffect } from "react";
import { donorAPI } from "@/lib/database";
import { getCurrentUser } from "@/lib/auth";
import { setManualDonorId } from "@/lib/donation-profile-manager";
import { toast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface DonorProfile {
  donor_id: string;
  donor_name: string;
  donor_bgrp: string;
  donor_age?: number;
  donor_sex?: string;
  donor_phno?: string;
  city?: {
    city_name: string;
  };
}

export default function DonorListDebugPage() {
  const [donors, setDonors] = useState<DonorProfile[]>([]);
  const [userEmail, setUserEmail] = useState<string | undefined>("");
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDonorId, setSelectedDonorId] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Get current user info
        const user = await getCurrentUser();
        setUserEmail(user?.email);
        
        // Get all donors
        const allDonors = await donorAPI.getAllDonors();
        setDonors(allDonors || []);
      } catch (error) {
        console.error("Error fetching data:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load donor data"
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, []);
  
  const handleSelectDonor = (donorId: string) => {
    setSelectedDonorId(donorId);
    setManualDonorId(donorId);
    
    const donor = donors.find(d => d.donor_id === donorId);
    if (donor) {
      toast({
        title: "Donor Selected",
        description: `Selected ${donor.donor_name} (${donor.donor_bgrp}) as your profile. Return to the dashboard to see your profile.`
      });
    }
  };
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-lg">Loading donor data...</p>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen p-8 bg-slate-50">
      <Card className="mx-auto max-w-4xl">
        <CardHeader>
          <CardTitle className="text-2xl">Donor List Debug</CardTitle>
          <p className="text-gray-600">Current user: {userEmail || "Unknown"}</p>
          <p className="text-sm text-red-600 mt-2">
            This page allows you to manually associate your account with a donor profile.
            Select a donor from the list below to set it as your profile.
          </p>
          {selectedDonorId && (
            <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-md">
              <p className="text-green-700">
                You've selected donor ID: <span className="font-mono">{selectedDonorId}</span>.
                Go back to the dashboard to see your profile.
              </p>
            </div>
          )}
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-100">
                  <th className="p-3 text-left">Name</th>
                  <th className="p-3 text-left">Blood Group</th>
                  <th className="p-3 text-left">Age</th>
                  <th className="p-3 text-left">Phone/Email</th>
                  <th className="p-3 text-left">Action</th>
                </tr>
              </thead>
              <tbody>
                {donors.length > 0 ? (
                  donors.map((donor) => (
                    <tr key={donor.donor_id} className="border-b border-gray-200">
                      <td className="p-3">{donor.donor_name}</td>
                      <td className="p-3 text-red-600 font-medium">{donor.donor_bgrp}</td>
                      <td className="p-3">{donor.donor_age}</td>
                      <td className="p-3 font-mono text-sm">{donor.donor_phno}</td>
                      <td className="p-3">
                        <Button 
                          variant={selectedDonorId === donor.donor_id ? "default" : "outline"}
                          size="sm"
                          onClick={() => handleSelectDonor(donor.donor_id)}
                        >
                          {selectedDonorId === donor.donor_id ? "Selected" : "Select"}
                        </Button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="p-4 text-center">No donors found</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          
          <div className="mt-6 bg-yellow-50 p-4 rounded-md border border-yellow-200">
            <h3 className="font-medium text-yellow-800">Instructions</h3>
            <ol className="mt-2 list-decimal list-inside text-sm text-yellow-700 space-y-1">
              <li>Find the donor profile that should be associated with your account</li>
              <li>Click the "Select" button next to that donor</li>
              <li>Return to the <a href="/dashboard" className="underline">dashboard</a> to see your profile</li>
              <li>If your profile still doesn't appear, click the "Refresh Profile" button on the dashboard</li>
            </ol>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 