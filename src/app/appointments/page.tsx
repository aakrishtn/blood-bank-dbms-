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
  date: string;
  time: string;
  location: string;
  status: 'scheduled' | 'completed' | 'cancelled';
  notes?: string;
}

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [location, setLocation] = useState("");
  const [notes, setNotes] = useState("");
  const [isBooking, setIsBooking] = useState(false);
  const router = useRouter();

  // Mock appointment data
  const mockAppointments: Appointment[] = [
    {
      id: "appt-001",
      date: "2023-06-15",
      time: "10:00 AM",
      location: "Central Blood Bank",
      status: "scheduled",
      notes: "Please bring ID and don&apos;t eat fatty foods 24 hours before donation."
    },
    {
      id: "appt-002",
      date: "2023-07-20",
      time: "2:30 PM",
      location: "Memorial Hospital",
      status: "completed"
    },
    {
      id: "appt-003",
      date: "2023-08-05",
      time: "11:15 AM",
      location: "Community Blood Drive - City Park",
      status: "cancelled",
      notes: "Cancelled due to illness."
    }
  ];

  useEffect(() => {
    const checkAuth = async () => {
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

        // In real app, fetch appointments from database
        // For now, using mock data
        setAppointments(mockAppointments);
        setIsLoading(false);
      } catch (error) {
        console.error("Error checking authentication:", error);
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [router, mockAppointments]);

  const handleBookAppointment = (e: React.FormEvent) => {
    e.preventDefault();
    setIsBooking(true);

    // Simulate API call
    setTimeout(() => {
      // Generate a new appointment
      const newAppointment: Appointment = {
        id: `appt-${Math.floor(Math.random() * 1000)}`,
        date,
        time,
        location,
        status: "scheduled",
        notes
      };

      setAppointments([newAppointment, ...appointments]);
      setDate("");
      setTime("");
      setLocation("");
      setNotes("");
      setIsBooking(false);

      toast({
        title: "Appointment Scheduled",
        description: `Your appointment has been scheduled for ${date} at ${time}.`,
      });
    }, 1500);
  };

  const cancelAppointment = (id: string) => {
    // Find the appointment
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
      <div className="flex justify-center items-center min-h-[60vh]">
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
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Donation Appointments</h1>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Schedule your next blood donation appointment and help save lives. Each donation can save up to three lives.
        </p>
      </div>

      <Tabs defaultValue="upcoming" className="max-w-5xl mx-auto">
        <TabsList className="grid w-full grid-cols-3 mb-8">
          <TabsTrigger value="upcoming">Upcoming Appointments</TabsTrigger>
          <TabsTrigger value="history">Appointment History</TabsTrigger>
          <TabsTrigger value="book">Book New Appointment</TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming">
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Your Upcoming Appointments</h2>
            
            {appointments.filter(app => app.status === 'scheduled').length === 0 ? (
              <Card className="border border-gray-100 shadow-md">
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
                      const bookTab = document.querySelector('[data-value="book"]') as HTMLElement;
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
                  <Card key={appointment.id} className="border border-gray-100 shadow-md card-hover">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-lg font-semibold">Donation Appointment</CardTitle>
                          <CardDescription>Appointment ID: {appointment.id}</CardDescription>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadgeClass(appointment.status)}`}>
                          {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                        </span>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm font-medium text-gray-500 mb-1">Date & Time</p>
                          <p className="text-gray-900">
                            {new Date(appointment.date).toLocaleDateString('en-US', { 
                              weekday: 'long', 
                              year: 'numeric', 
                              month: 'long', 
                              day: 'numeric' 
                            })}
                          </p>
                          <p className="text-gray-900">{appointment.time}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-500 mb-1">Location</p>
                          <p className="text-gray-900">{appointment.location}</p>
                        </div>
                      </div>
                      {appointment.notes && (
                        <div className="mt-4 p-3 bg-amber-50 rounded-md border border-amber-100">
                          <p className="text-sm font-medium text-amber-800 mb-1">Important Notes:</p>
                          <p className="text-sm text-amber-700">{appointment.notes}</p>
                        </div>
                      )}
                    </CardContent>
                    <CardFooter className="bg-gray-50 border-t flex justify-between">
                      <div className="text-sm text-gray-500">
                        Reminder: Eat a healthy meal and stay hydrated before your appointment.
                      </div>
                      <Button
                        variant="redOutline"
                        size="sm"
                        onClick={() => cancelAppointment(appointment.id)}
                      >
                        Cancel
                      </Button>
                    </CardFooter>
                  </Card>
                ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="history">
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Your Appointment History</h2>
            
            {appointments.filter(app => app.status !== 'scheduled').length === 0 ? (
              <Card className="border border-gray-100 shadow-md">
                <CardContent className="py-8 text-center">
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Past Appointments</h3>
                  <p className="text-gray-500 max-w-md mx-auto">
                    You don&apos;t have any past appointments in your history yet.
                  </p>
                </CardContent>
              </Card>
            ) : (
              appointments
                .filter(app => app.status !== 'scheduled')
                .map(appointment => (
                  <Card key={appointment.id} className="border border-gray-100 shadow-md">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-lg font-semibold">Donation Appointment</CardTitle>
                          <CardDescription>Appointment ID: {appointment.id}</CardDescription>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadgeClass(appointment.status)}`}>
                          {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                        </span>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm font-medium text-gray-500 mb-1">Date & Time</p>
                          <p className="text-gray-900">
                            {new Date(appointment.date).toLocaleDateString('en-US', { 
                              weekday: 'long', 
                              year: 'numeric', 
                              month: 'long', 
                              day: 'numeric' 
                            })}
                          </p>
                          <p className="text-gray-900">{appointment.time}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-500 mb-1">Location</p>
                          <p className="text-gray-900">{appointment.location}</p>
                        </div>
                      </div>
                      {appointment.notes && (
                        <div className="mt-4 p-3 bg-gray-50 rounded-md">
                          <p className="text-sm font-medium text-gray-700 mb-1">Notes:</p>
                          <p className="text-sm text-gray-600">{appointment.notes}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="book">
          <Card className="border border-gray-100 shadow-lg">
            <CardHeader>
              <CardTitle>Schedule a New Donation Appointment</CardTitle>
              <CardDescription>
                Choose your preferred date, time, and location for your next blood donation.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleBookAppointment} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="date" className="text-sm font-medium">
                      Appointment Date
                    </Label>
                    <Input
                      id="date"
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                      required
                      className="h-11 rounded-md border border-gray-200"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="time" className="text-sm font-medium">
                      Appointment Time
                    </Label>
                    <Input
                      id="time"
                      type="time"
                      value={time}
                      onChange={(e) => setTime(e.target.value)}
                      required
                      className="h-11 rounded-md border border-gray-200"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="location" className="text-sm font-medium">
                    Donation Center
                  </Label>
                  <Input
                    id="location"
                    type="text"
                    placeholder="Select a donation center"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    required
                    className="h-11 rounded-md border border-gray-200"
                  />
                  <p className="text-xs text-gray-500">
                    Choose from available donation centers in your area.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes" className="text-sm font-medium">
                    Special Notes or Requirements (Optional)
                  </Label>
                  <textarea
                    id="notes"
                    placeholder="Any special requirements or medical conditions we should know about?"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm min-h-[100px]"
                  />
                </div>

                <div className="p-4 bg-blue-50 rounded-md border border-blue-100">
                  <h4 className="text-sm font-semibold text-blue-800 mb-2">Pre-Donation Guidelines:</h4>
                  <ul className="text-sm text-blue-700 space-y-1 list-disc pl-5">
                    <li>Get a good night&apos;s sleep before your donation</li>
                    <li>Eat a healthy meal at least 2-3 hours before donating</li>
                    <li>Drink plenty of water before your appointment</li>
                    <li>Bring a valid ID to your appointment</li>
                    <li>Avoid fatty foods for 24 hours before donation</li>
                  </ul>
                </div>

                <Button
                  type="submit"
                  disabled={isBooking}
                  variant="red"
                  className="w-full py-2 h-12"
                >
                  {isBooking ? "Scheduling..." : "Schedule Appointment"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 