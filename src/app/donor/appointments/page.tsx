"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import { getCurrentUser } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

interface Appointment {
  appointment_id: string;
  appointment_date: string;
  status: string;
  notes: string;
  blood_center: {
    center_name: string;
    address: string;
  };
  receiver: {
    receiver_name: string;
    r_bgrp: string;
  };
}

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        const user = await getCurrentUser();
        
        if (!user) {
          router.push('/login');
          return;
        }

        const { data: userProfile } = await supabase
          .from('user_profiles')
          .select('profile_id')
          .eq('user_id', user.id)
          .single();

        if (!userProfile) {
          toast({
            variant: "destructive",
            title: "Error",
            description: "User profile not found"
          });
          return;
        }

        const { data: appointmentsData, error } = await supabase
          .from('appointments')
          .select(`
            *,
            blood_center:blood_center_id (
              center_name,
              address
            ),
            receiver:receiver_id (
              receiver_name,
              r_bgrp
            )
          `)
          .eq('donor_id', userProfile.profile_id)
          .order('appointment_date', { ascending: true });

        if (error) throw error;

        setAppointments(appointmentsData || []);
      } catch (error) {
        console.error('Error fetching appointments:', error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load appointments"
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchAppointments();
  }, [router]);

  const handleStatusUpdate = async (appointmentId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('appointments')
        .update({ status: newStatus })
        .eq('appointment_id', appointmentId);

      if (error) throw error;

      setAppointments(appointments.map(apt => 
        apt.appointment_id === appointmentId 
          ? { ...apt, status: newStatus }
          : apt
      ));

      toast({
        title: "Success",
        description: "Appointment status updated successfully"
      });
    } catch (error) {
      console.error('Error updating appointment:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update appointment status"
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-16 w-16 rounded-full bg-red-100 p-3 mb-4">
            <div className="h-full w-full rounded-full bg-red-600 animate-pulse"></div>
          </div>
          <p className="text-gray-900 font-medium">Loading appointments...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">My Appointments</h1>
        <p className="text-gray-600">Manage your blood donation appointments</p>
      </div>

      {appointments.length === 0 ? (
        <Card className="border border-gray-100 shadow-md">
          <CardHeader>
            <CardTitle>No Appointments</CardTitle>
            <CardDescription>You don&apos;t have any appointments scheduled.</CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <div className="grid gap-6">
          {appointments.map((appointment) => (
            <Card key={appointment.appointment_id} className="border border-gray-100 shadow-md overflow-hidden">
              <div className={`h-2 ${
                appointment.status === 'pending' ? 'bg-yellow-500' :
                appointment.status === 'confirmed' ? 'bg-blue-500' :
                appointment.status === 'completed' ? 'bg-green-500' :
                'bg-red-500'
              }`}></div>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-xl font-semibold">
                      Appointment at {appointment.blood_center.center_name}
                    </CardTitle>
                    <CardDescription>
                      {new Date(appointment.appointment_date).toLocaleString()}
                    </CardDescription>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    appointment.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    appointment.status === 'confirmed' ? 'bg-blue-100 text-blue-800' :
                    appointment.status === 'completed' ? 'bg-green-100 text-green-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">Location</h4>
                    <p className="text-gray-900">{appointment.blood_center.address}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">Receiver Details</h4>
                    <p className="text-gray-900">
                      {appointment.receiver.receiver_name} (Blood Group: {appointment.receiver.r_bgrp})
                    </p>
                  </div>
                  {appointment.notes && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-500">Notes</h4>
                      <p className="text-gray-900">{appointment.notes}</p>
                    </div>
                  )}
                </div>
              </CardContent>
              <CardFooter className="flex gap-3">
                {appointment.status === 'pending' && (
                  <>
                    <Button 
                      variant="red"
                      onClick={() => handleStatusUpdate(appointment.appointment_id, 'confirmed')}
                    >
                      Confirm Appointment
                    </Button>
                    <Button 
                      variant="outline"
                      onClick={() => handleStatusUpdate(appointment.appointment_id, 'cancelled')}
                    >
                      Cancel
                    </Button>
                  </>
                )}
                {appointment.status === 'confirmed' && (
                  <Button 
                    variant="outline"
                    onClick={() => handleStatusUpdate(appointment.appointment_id, 'cancelled')}
                  >
                    Cancel Appointment
                  </Button>
                )}
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
} 