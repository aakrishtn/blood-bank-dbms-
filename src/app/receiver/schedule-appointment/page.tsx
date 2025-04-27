"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/use-toast";
import { getCurrentUser } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

interface SelectedDonor {
  id: string;
  name: string;
  bloodGroup: string;
  hospital: string;
  doctor: string;
}

interface SelectedBloodCenter {
  id: string;
  name: string;
}

export default function ScheduleAppointmentPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDonor, setSelectedDonor] = useState<SelectedDonor | null>(null);
  const [selectedCenter, setSelectedCenter] = useState<SelectedBloodCenter | null>(null);
  const [appointmentDate, setAppointmentDate] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notes, setNotes] = useState<string>("");
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string>("");
  const router = useRouter();

  // Available time slots - these are just placeholders, donor will select the actual time
  const timeSlots = [
    "9:00 AM", "10:00 AM", "11:00 AM", 
    "1:00 PM", "2:00 PM", "3:00 PM", "4:00 PM"
  ];

  useEffect(() => {
    // Get stored donor information
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Ensure user is logged in and is a receiver
        const user = await getCurrentUser();
        if (!user) {
          router.push("/login");
          return;
        }

        // Check if user is a receiver
        if (user.user_metadata?.role !== "receiver") {
          toast({
            variant: "destructive",
            title: "Access Denied",
            description: "Only receivers can schedule appointments with donors."
          });
          router.push("/dashboard");
          return;
        }

        // Get donor information from localStorage
        const storedDonor = localStorage.getItem('selectedDonor');
        if (!storedDonor) {
          toast({
            variant: "destructive",
            title: "Error",
            description: "No donor selected. Please select a donor first."
          });
          router.push("/receiver/matched-donors");
          return;
        }

        // Parse donor information
        const donorData = JSON.parse(storedDonor) as SelectedDonor;
        setSelectedDonor(donorData);
        
        // Get blood center information
        const storedCenter = localStorage.getItem('selectedBloodCenter');
        if (storedCenter) {
          const centerData = JSON.parse(storedCenter) as SelectedBloodCenter;
          setSelectedCenter(centerData);
        } else {
          // Use default center if not found
          setSelectedCenter({
            id: 'BC001',
            name: 'Central Blood Bank'
          });
        }

        // Set default appointment date to tomorrow
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        setAppointmentDate(tomorrow.toISOString().split('T')[0]);
      } catch (error) {
        console.error("Error fetching data:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load donor information. Please try again."
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Get current user
      const user = await getCurrentUser();
      if (!user) {
        console.log("No user found, redirecting to login");
        router.push('/login');
        return;
      }

      console.log("Current user:", user.id);

      // Get receiver profile
      console.log("Fetching receiver profile for user:", user.id);
      const { data: userProfile, error: profileError } = await supabase
        .from('user_profiles')
        .select('profile_id, profile_type')
        .eq('user_id', user.id)
        .eq('profile_type', 'receiver')
        .single();

      if (profileError) {
        console.error("Error fetching user profile:", profileError);
        throw new Error(`Receiver profile not found: ${profileError.message}`);
      }

      if (!userProfile) {
        console.error("No user profile found for receiver");
        throw new Error('No receiver profile found for current user');
      }

      console.log("Found receiver profile:", userProfile);
      console.log("Preparing appointment data:", {
        donor_id: selectedDonor?.id,
        receiver_id: userProfile.profile_id,
        donation_date: new Date(appointmentDate).toISOString(),
        center_id: selectedCenter?.id,
        preferred_time: selectedTimeSlot,
      });

      // Create appointment request
      const { data, error } = await supabase
        .from('appointments')
        .insert({
          donor_id: selectedDonor?.id,
          receiver_id: userProfile.profile_id,
          donation_date: new Date(appointmentDate).toISOString(),
          status: 'pending',
          notes: notes + (selectedTimeSlot ? `\nPreferred time: ${selectedTimeSlot}` : ""),
          hospital: selectedDonor?.hospital,
          doctor: selectedDonor?.doctor,
          center_id: selectedCenter?.id
        })
        .select();

      if (error) {
        console.error("Error creating appointment:", error);
        throw error;
      }

      console.log("Appointment created successfully:", data);

      toast({
        title: "Appointment Requested",
        description: "Your appointment request has been submitted. The donor will need to confirm the appointment time."
      });

      // Clear selected donor from localStorage
      localStorage.removeItem('selectedDonor');
      localStorage.removeItem('selectedBloodCenter');
      
      console.log("Redirecting to dashboard...");
      
      // Use both navigation methods for redundancy
      window.location.href = '/dashboard';
      setTimeout(() => {
        router.push('/dashboard');
      }, 100);
    } catch (error) {
      console.error('Error scheduling appointment:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to schedule appointment. Please try again."
      });
      
      // Even if there's an error, redirect to dashboard after a delay
      setTimeout(() => {
        router.push('/dashboard');
      }, 2000);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-16 w-16 rounded-full bg-red-100 p-3 mb-4">
            <div className="h-full w-full rounded-full bg-red-600 animate-pulse"></div>
          </div>
          <p className="text-gray-900 font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-3xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Schedule Appointment</h1>
        <p className="text-gray-600">Request a blood donation appointment with {selectedDonor?.name}</p>
      </div>

      <Card className="border border-gray-100 shadow-md overflow-hidden">
        <div className="h-2 bg-red-600"></div>
        <CardHeader>
          <CardTitle>Donor Information</CardTitle>
          <CardDescription>Details about the donor you have selected</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-1">Donor Name</h3>
              <p className="font-medium">{selectedDonor?.name}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-1">Blood Group</h3>
              <p className="font-medium text-red-600">{selectedDonor?.bloodGroup}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-1">Hospital</h3>
              <p className="font-medium">{selectedDonor?.hospital}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-1">Doctor</h3>
              <p className="font-medium">{selectedDonor?.doctor}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-1">Blood Center</h3>
              <p className="font-medium">{selectedCenter?.name}</p>
            </div>
          </div>

          <hr className="my-6 border-t border-gray-200" />
          
          <form onSubmit={handleSubmit}>
            <div className="space-y-6">
              <div>
                <Label htmlFor="appointmentDate" className="text-sm font-medium text-gray-900">
                  Preferred Date
                </Label>
                <div className="relative mt-1">
                  <Input
                    id="appointmentDate"
                    type="date"
                    value={appointmentDate}
                    onChange={(e) => setAppointmentDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="timeSlot" className="text-sm font-medium text-gray-900">
                  Preferred Time Slot
                </Label>
                <div className="grid grid-cols-3 gap-2 mt-1">
                  {timeSlots.map((time) => (
                    <div 
                      key={time}
                      className={`relative border rounded-md p-2 text-center cursor-pointer transition-colors ${
                        selectedTimeSlot === time 
                          ? 'bg-red-100 border-red-500 text-red-700' 
                          : 'border-gray-200 hover:bg-gray-100 text-gray-700'
                      }`}
                      onClick={() => setSelectedTimeSlot(time)}
                    >
                      <span>{time}</span>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Note: This is your preferred time. The donor will confirm the final appointment time.
                </p>
              </div>

              <div>
                <Label htmlFor="notes" className="text-sm font-medium text-gray-900">
                  Additional Notes (Optional)
                </Label>
                <textarea
                  id="notes"
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Any additional information you'd like the donor to know"
                  className="mt-1 w-full rounded-md border border-gray-300 p-2 text-sm"
                />
              </div>

              <div className="pt-4 flex gap-4">
                <Button
                  type="submit"
                  variant="red"
                  className="flex-1"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Submitting Request..." : "Request Appointment"}
                </Button>
                <Link href="/receiver/matched-donors">
                  <Button variant="outline" className="flex-1">
                    Cancel
                  </Button>
                </Link>
              </div>
            </div>
          </form>
        </CardContent>
        <CardFooter className="bg-gray-50 border-t border-gray-100">
          <div className="text-sm text-gray-500 w-full">
            <p className="font-medium text-gray-700 mb-1">Important Information:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>The donor will be notified of your appointment request.</li>
              <li>They will confirm the appointment and select an available time slot.</li>
              <li>You will be notified once the appointment is confirmed.</li>
              <li>Please arrive at the hospital 15 minutes before the scheduled time.</li>
            </ul>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
} 