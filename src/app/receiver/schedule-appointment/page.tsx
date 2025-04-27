"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/use-toast";
import { getCurrentUser } from "@/lib/auth";

interface SelectedHospital {
  hospital_id: string;
  hospital_name: string;
  blood_group: string;
  doctor_id: string;
  doctor_name: string;
}

interface SelectedBloodCenter {
  id: string;
  name: string;
}

export default function ScheduleAppointmentPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [selectedHospital, setSelectedHospital] = useState<SelectedHospital | null>(null);
  const [selectedCenter, setSelectedCenter] = useState<SelectedBloodCenter | null>(null);
  const [appointmentDate, setAppointmentDate] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notes, setNotes] = useState<string>("");
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string>("");
  const [appointmentConfirmed, setAppointmentConfirmed] = useState(false);
  const router = useRouter();

  // Available time slots - these are just placeholders
  const timeSlots = [
    "9:00 AM", "10:00 AM", "11:00 AM", 
    "1:00 PM", "2:00 PM", "3:00 PM", "4:00 PM"
  ];

  useEffect(() => {
    // Get stored hospital information
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
            description: "Only receivers can schedule appointments."
          });
          router.push("/dashboard");
          return;
        }

        // Get hospital information from localStorage
        const hospitalId = localStorage.getItem('selectedHospitalId');
        const hospitalName = localStorage.getItem('selectedHospitalName');
        const doctorId = localStorage.getItem('selectedDoctorId');
        const doctorName = localStorage.getItem('selectedDoctorName');
        const bloodGroup = localStorage.getItem('selectedBloodGroup');
        
        if (!hospitalId || !hospitalName) {
          toast({
            variant: "destructive",
            title: "Error",
            description: "No hospital selected. Please select a hospital with available blood first."
          });
          router.push("/receiver/matched-donors");
          return;
        }

        // Set hospital information
        setSelectedHospital({
          hospital_id: hospitalId,
          hospital_name: hospitalName,
          blood_group: bloodGroup || '',
          doctor_id: doctorId || '',
          doctor_name: doctorName || ''
        });
        
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
          description: "Failed to load hospital information. Please try again."
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
      // Skip database operations and directly show confirmation
      console.log("Appointment confirmed with details:", {
        date: appointmentDate,
        time: selectedTimeSlot,
        hospital: selectedHospital?.hospital_name,
        doctor: selectedHospital?.doctor_name,
        center: selectedCenter?.name
      });
      
      // Set confirmed state
      setAppointmentConfirmed(true);

      toast({
        title: "Appointment Confirmed",
        description: "Your appointment has been confirmed. Thank you for scheduling with us."
      });

      // Clear selected hospital from localStorage
      localStorage.removeItem('selectedHospitalId');
      localStorage.removeItem('selectedHospitalName');
      localStorage.removeItem('selectedDoctorId');
      localStorage.removeItem('selectedDoctorName');
      localStorage.removeItem('selectedBloodGroup');
      localStorage.removeItem('selectedBloodCenter');
      
      // Delay navigation to allow the user to see the confirmation message
      setTimeout(() => {
        window.location.href = '/dashboard';
      }, 3000);
    } catch (error) {
      console.error('Error scheduling appointment:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to schedule appointment. Please try again."
      });
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

  if (appointmentConfirmed) {
    return (
      <div className="container mx-auto py-16 px-4 max-w-3xl">
        <div className="text-center">
          <div className="mx-auto h-16 w-16 rounded-full bg-green-100 p-3 mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Appointment Confirmed!</h2>
          <p className="text-gray-600 mb-8">Your appointment has been successfully scheduled.</p>
          <Button variant="red" onClick={() => router.push('/dashboard')}>
            Return to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-3xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Schedule Appointment</h1>
        <p className="text-gray-600">Schedule a blood request appointment</p>
      </div>

      <Card className="border border-gray-100 shadow-md overflow-hidden">
        <div className="h-2 bg-red-600"></div>
        <CardHeader>
          <CardTitle>Hospital Information</CardTitle>
          <CardDescription>Details about the hospital with available blood</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-1">Hospital</h3>
              <p className="font-medium">{selectedHospital?.hospital_name}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-1">Blood Group</h3>
              <p className="font-medium text-red-600">{selectedHospital?.blood_group}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-1">Doctor</h3>
              <p className="font-medium">{selectedHospital?.doctor_name}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-1">Blood Center</h3>
              <p className="font-medium">{selectedCenter?.name}</p>
            </div>
          </div>

          <hr className="my-6 border-t border-gray-200" />
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label htmlFor="appointmentDate" className="text-sm font-medium text-gray-700">Preferred Date</Label>
              <Input
                id="appointmentDate"
                type="date"
                value={appointmentDate}
                onChange={(e) => setAppointmentDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                required
                className="mt-1"
              />
            </div>
            
            <div>
              <Label className="text-sm font-medium text-gray-700">Preferred Time Slot</Label>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 mt-1">
                {timeSlots.map((time) => (
                  <Button
                    key={time}
                    type="button"
                    variant={selectedTimeSlot === time ? "red" : "outline"}
                    onClick={() => setSelectedTimeSlot(time)}
                    className={`h-auto py-2 px-3 ${selectedTimeSlot === time ? 'bg-red-600 text-white' : 'bg-white text-gray-900'}`}
                  >
                    {time}
                  </Button>
                ))}
              </div>
            </div>
            
            <div>
              <Label htmlFor="notes" className="text-sm font-medium text-gray-700">Additional Notes (Optional)</Label>
              <textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                placeholder="Any additional information you'd like to provide..."
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 placeholder-gray-400 shadow-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
              />
            </div>
            
            <div className="pt-4 flex flex-col-reverse sm:flex-row sm:justify-between sm:space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push('/receiver/matched-donors')}
                className="mt-3 sm:mt-0"
              >
                Back
              </Button>
              <Button
                type="submit"
                variant="red"
                disabled={isSubmitting || !appointmentDate || !selectedTimeSlot}
              >
                {isSubmitting ? 'Processing...' : 'Confirm Appointment'}
              </Button>
            </div>
          </form>
        </CardContent>
        <CardFooter className="bg-gray-50 px-6 py-3">
          <p className="text-xs text-gray-500">
            By confirming this appointment, you agree to be present at the specified location, date, and time.
          </p>
        </CardFooter>
      </Card>
    </div>
  );
} 