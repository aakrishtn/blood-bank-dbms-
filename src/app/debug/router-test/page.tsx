"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function RouterTestPage() {
  const router = useRouter();
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (message: string) => {
    setLogs(prev => [...prev, `${new Date().toISOString().split('T')[1].split('.')[0]} - ${message}`]);
  };

  const testRouterNavigation = (path: string) => {
    try {
      addLog(`Attempting to navigate to ${path}`);
      router.push(path);
      addLog(`Navigation command executed for ${path}`);
    } catch (error) {
      addLog(`Error navigating to ${path}: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  const testWindowNavigation = (path: string) => {
    try {
      addLog(`Attempting to navigate to ${path} using window.location`);
      window.location.href = path;
      // This log may not execute if navigation is immediate
      addLog(`Window location change executed for ${path}`);
    } catch (error) {
      addLog(`Error with window.location for ${path}: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-6">Router Navigation Test</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>Test Router Navigation</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <Button onClick={() => testRouterNavigation('/dashboard')}>
              Navigate to Dashboard
            </Button>
            <Button onClick={() => testRouterNavigation('/appointments')}>
              Navigate to Appointments
            </Button>
            <Button onClick={() => testRouterNavigation('/receiver/schedule-appointment')}>
              Navigate to Schedule Appointment
            </Button>
            <Button onClick={() => testRouterNavigation('/receiver/matched-donors')}>
              Navigate to Matched Donors
            </Button>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Test Window Navigation</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <Button variant="outline" onClick={() => testWindowNavigation('/dashboard')}>
              Window Navigate to Dashboard
            </Button>
            <Button variant="outline" onClick={() => testWindowNavigation('/appointments')}>
              Window Navigate to Appointments
            </Button>
            <Button variant="outline" onClick={() => testWindowNavigation('/receiver/schedule-appointment')}>
              Window Navigate to Schedule Appointment
            </Button>
            <Button variant="outline" onClick={() => testWindowNavigation('/receiver/matched-donors')}>
              Window Navigate to Matched Donors
            </Button>
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Navigation Logs</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-gray-100 p-4 rounded-md max-h-60 overflow-y-auto font-mono text-sm">
            {logs.length === 0 ? (
              <p className="text-gray-500">No navigation attempts logged yet</p>
            ) : (
              <ul className="space-y-1">
                {logs.map((log, i) => (
                  <li key={i}>{log}</li>
                ))}
              </ul>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 