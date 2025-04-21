"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/components/ui/use-toast";
import { getCurrentUser } from "@/lib/auth";

// Define types
interface Appointment {
  id: string;
  donor_id?: string;
  appointment_date: string;
  appointment_time: string;
  location?: string;
  blood_group?: string;
  status: 'scheduled' | 'completed' | 'cancelled';
  notes?: string;
}

interface AppointmentResponse {
  id: string;
  donor_id: string;
  appointment_date: string;
  appointment_time: string;
  location?: string;
  blood_group?: string;
  status: string;
  notes?: string;
}

interface User {
  id: string;
  email?: string;
  user_metadata?: {
    role?: string;
    bloodGroup?: string;
    [key: string]: string | number | boolean | null | undefined;
  };
}

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [location, setLocation] = useState("");
  const [bloodGroup, setBloodGroup] = useState("");
  const [notes, setNotes] = useState("");
  const [isBooking, setIsBooking] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchUserAndAppointments = async () => {
      try {
        const user = await getCurrentUser();
        if (!user) {
          toast({
            variant: "destructive",
            title: "Authentication Required",
            description: "Please login to access this page."
          });
          router.push("/login");
          return;
        }

        setCurrentUser(user as User);
        
        // Fetch appointments from the API
        const response = await fetch(`/api/appointments?userId=${user.id}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch appointments');
        }
        
        const data = await response.json();
        
        // Transform the data to match our component's expected format
        const formattedAppointments = data.appointments.map((apt: AppointmentResponse) => ({
          id: apt.id,
          donor_id: apt.donor_id,
          appointment_date: apt.appointment_date,
          appointment_time: apt.appointment_time,
          location: apt.location,
          blood_group: apt.blood_group,
          status: apt.status as 'scheduled' | 'completed' | 'cancelled',
          notes: apt.notes
        }));
        
        setAppointments(formattedAppointments);
        setIsLoading(false);
      } catch (error) {
        console.error("Error fetching data:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load appointments. Please try again."
        });
        setIsLoading(false);
      }
    };

    fetchUserAndAppointments();
  }, [router]);

  const handleBookAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsBooking(true);

    try {
      if (!currentUser || !currentUser.id) {
        throw new Error('User not authenticated');
      }
      
      // Call the API to create a new appointment
      const response = await fetch('/api/appointments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          donorId: currentUser.id,
          appointmentDate: date,
          appointmentTime: time,
          location,
          bloodGroup: bloodGroup || currentUser.user_metadata?.bloodGroup,
          notes,
          status: 'scheduled'
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to book appointment');
      }
      
      const data = await response.json();
      
      // Format the new appointment to match our component's expected format
      const newAppointment: Appointment = {
        id: data.appointment.id,
        donor_id: data.appointment.donor_id,
        appointment_date: data.appointment.appointment_date,
        appointment_time: data.appointment.appointment_time,
        location: data.appointment.location,
        blood_group: data.appointment.blood_group,
        status: data.appointment.status,
        notes: data.appointment.notes
      };

      setAppointments([newAppointment, ...appointments]);
      setDate("");
      setTime("");
      setLocation("");
      setBloodGroup("");
      setNotes("");

      toast({
        title: "Appointment Scheduled",
        description: `Your appointment has been scheduled for ${date} at ${time}.`,
      });
    } catch (error) {
      console.error("Error booking appointment:", error);
      toast({
        variant: "destructive",
        title: "Booking Failed",
        description: error instanceof Error ? error.message : "Failed to book appointment. Please try again.",
      });
    } finally {
      setIsBooking(false);
    }
  };

  const cancelAppointment = async (id: string) => {
    try {
      // Call the API to update appointment status
      const response = await fetch('/api/appointments', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          appointmentId: id,
          status: 'cancelled'
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to cancel appointment');
      }
      
      // Update the appointment in local state
      const updatedAppointments = appointments.map(appointment => 
        appointment.id === id 
          ? { ...appointment, status: "cancelled" as const } 
          : appointment
      );
      
      setAppointments(updatedAppointments);
      
      toast({
        title: "Appointment Cancelled",
        description: "Your appointment has been cancelled successfully.",
      });
    } catch (error) {
      console.error("Error cancelling appointment:", error);
      toast({
        variant: "destructive",
        title: "Cancellation Failed",
        description: error instanceof Error ? error.message : "Failed to cancel appointment. Please try again.",
      });
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh] bg-white">
        <div className="text-center">
          <div className="mx-auto h-16 w-16 rounded-full bg-red-100 p-3 mb-4">
            <div className="h-full w-full rounded-full bg-red-600 animate-pulse"></div>
          </div>
          <p className="text-gray-500">Loading appointments...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white">
      <div className="container mx-auto px-4 py-12">
        <div className="mb-12 text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Donation Appointments</h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Schedule your next blood donation appointment and help save lives. Each donation can save up to three lives.
          </p>
        </div>

        <Tabs defaultValue="upcoming" className="max-w-5xl mx-auto">
          <TabsList className="flex justify-center w-full mb-10 rounded-lg border border-gray-200 p-1 gap-1 bg-gray-50">
            <TabsTrigger 
              value="upcoming" 
              className="flex-1 rounded-md py-3 flex justify-center items-center px-2 text-gray-700 font-medium data-[state=active]:bg-white data-[state=active]:text-red-600 data-[state=active]:font-semibold data-[state=active]:shadow-sm transition-all duration-200 relative"
            >
              <span>Upcoming Appointments</span>
              <span className="absolute -bottom-1 left-0 w-full h-0.5 bg-red-600 opacity-0 data-[state=active]:opacity-100 transition-opacity"></span>
            </TabsTrigger>
            <TabsTrigger 
              value="history" 
              className="flex-1 rounded-md py-3 flex justify-center items-center px-2 text-gray-700 font-medium data-[state=active]:bg-white data-[state=active]:text-red-600 data-[state=active]:font-semibold data-[state=active]:shadow-sm transition-all duration-200 relative"
            >
              <span>Appointment History</span>
              <span className="absolute -bottom-1 left-0 w-full h-0.5 bg-red-600 opacity-0 data-[state=active]:opacity-100 transition-opacity"></span>
            </TabsTrigger>
            <TabsTrigger 
              value="book" 
              className="flex-1 rounded-md py-3 flex justify-center items-center px-2 text-gray-700 font-medium data-[state=active]:bg-white data-[state=active]:text-red-600 data-[state=active]:font-semibold data-[state=active]:shadow-sm transition-all duration-200 relative"
            >
              <span>Book New Appointment</span>
              <span className="absolute -bottom-1 left-0 w-full h-0.5 bg-red-600 opacity-0 data-[state=active]:opacity-100 transition-opacity"></span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upcoming" className="focus-visible:outline-none focus-visible:ring-0">
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-black mb-4 text-center">Your Upcoming Appointments</h2>
              
              {appointments.filter(app => app.status === 'scheduled').length === 0 ? (
                <Card className="border border-gray-100 shadow-md overflow-hidden">
                  <div className="h-2 bg-red-600"></div>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <div className="h-20 w-20 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Appointments Scheduled</h3>
                    <p className="text-gray-500 text-center max-w-md mb-6">
                      You don&apos;t have any upcoming appointments. Schedule a donation to help save lives.
                    </p>
                    <Button
                      onClick={() => {
                        const bookTab = document.querySelector('.TabsList .TabsTrigger[value="book"]') as HTMLElement;
                        if (bookTab) bookTab.click();
                      }}
                      variant="red"
                    >
                      Schedule Appointment
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                appointments
                  .filter(app => app.status === 'scheduled')
                  .map(appointment => (
                    <Card key={appointment.id} className="border border-gray-100 shadow-md hover:shadow-xl transition-shadow duration-300 overflow-hidden relative">
                      <div className="h-2 bg-red-600"></div>
                      <Button
                        variant="redOutline"
                        size="sm"
                        onClick={() => cancelAppointment(appointment.id)}
                        className="absolute top-5 right-5"
                      >
                        Cancel
                      </Button>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div>
                            <CardTitle className="text-lg font-semibold text-black">Donation Appointment</CardTitle>
                            <CardDescription className="text-black">Appointment ID: {appointment.id}</CardDescription>
                          </div>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadgeClass(appointment.status)}`}>
                            {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                          </span>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm font-medium text-black mb-1">Date & Time</p>
                            <p className="text-sm text-gray-700">
                              {new Date(appointment.appointment_date).toLocaleDateString()}, {appointment.appointment_time}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-black mb-1">Location</p>
                            <p className="text-sm text-gray-700">{appointment.location || "Central Blood Bank"}</p>
                          </div>
                          {appointment.blood_group && (
                            <div>
                              <p className="text-sm font-medium text-black mb-1">Blood Group</p>
                              <p className="text-sm text-gray-700">{appointment.blood_group}</p>
                            </div>
                          )}
                          {appointment.notes && (
                            <div className="md:col-span-2">
                              <p className="text-sm font-medium text-black mb-1">Notes</p>
                              <p className="text-sm text-gray-700">{appointment.notes}</p>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="history" className="focus-visible:outline-none focus-visible:ring-0">
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-black mb-4 text-center">Appointment History</h2>
              
              {appointments.filter(app => app.status === 'completed' || app.status === 'cancelled').length === 0 ? (
                <Card className="border border-gray-100 shadow-md overflow-hidden">
                  <div className="h-2 bg-red-600"></div>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <div className="h-20 w-20 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Appointment History</h3>
                    <p className="text-gray-500 text-center max-w-md">
                      You don&apos;t have any past appointments. Book an appointment and start your donation journey.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                appointments
                  .filter(app => app.status === 'completed' || app.status === 'cancelled')
                  .map(appointment => (
                    <Card key={appointment.id} className="border border-gray-100 shadow-md overflow-hidden">
                      <div className="h-2 bg-red-600"></div>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div>
                            <CardTitle className="text-lg font-semibold text-black">Donation Appointment</CardTitle>
                            <CardDescription className="text-black">Appointment ID: {appointment.id}</CardDescription>
                          </div>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadgeClass(appointment.status)}`}>
                            {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                          </span>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm font-medium text-black mb-1">Date & Time</p>
                            <p className="text-sm text-gray-700">
                              {new Date(appointment.appointment_date).toLocaleDateString()}, {appointment.appointment_time}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-black mb-1">Location</p>
                            <p className="text-sm text-gray-700">{appointment.location || "Central Blood Bank"}</p>
                          </div>
                          {appointment.blood_group && (
                            <div>
                              <p className="text-sm font-medium text-black mb-1">Blood Group</p>
                              <p className="text-sm text-gray-700">{appointment.blood_group}</p>
                            </div>
                          )}
                          {appointment.notes && (
                            <div className="md:col-span-2">
                              <p className="text-sm font-medium text-black mb-1">Notes</p>
                              <p className="text-sm text-gray-700">{appointment.notes}</p>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="book" className="focus-visible:outline-none focus-visible:ring-0">
            <Card className="border border-gray-100 shadow-md overflow-hidden">
              <div className="h-2 bg-red-600"></div>
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-black">Book a Donation Appointment</CardTitle>
                <CardDescription className="text-black">
                  Please fill out the form below to schedule your blood donation appointment.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleBookAppointment} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="date" className="text-sm">Appointment Date</Label>
                      <Input
                        id="date"
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        required
                        min={new Date().toISOString().split('T')[0]}
                        className="h-11"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="time" className="text-sm">Appointment Time</Label>
                      <Input
                        id="time"
                        type="time"
                        value={time}
                        onChange={(e) => setTime(e.target.value)}
                        required
                        className="h-11"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="location" className="text-sm">Donation Center</Label>
                      <Input
                        id="location"
                        type="text"
                        placeholder="Central Blood Bank"
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        required
                        className="h-11"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="blood-group" className="text-sm">Blood Group</Label>
                      <Input
                        id="blood-group"
                        type="text"
                        placeholder="A+, B-, O+, etc."
                        value={bloodGroup}
                        onChange={(e) => setBloodGroup(e.target.value)}
                        className="h-11"
                      />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="notes" className="text-sm">Additional Notes</Label>
                      <Input
                        id="notes"
                        type="text"
                        placeholder="Any special instructions or requirements"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        className="h-11"
                      />
                    </div>
                  </div>
                  <Button 
                    type="submit" 
                    variant="red" 
                    className="w-full h-11"
                    disabled={isBooking}
                  >
                    {isBooking ? "Scheduling Appointment..." : "Schedule Appointment"}
                  </Button>
                </form>
              </CardContent>
              <CardFooter className="bg-gray-50 border-t border-gray-100 px-6 py-4">
                <div className="text-sm text-gray-600">
                  <strong>Note:</strong> Please arrive 15 minutes before your appointment time. Eat a healthy meal and drink plenty of water before your donation.
                </div>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
} 