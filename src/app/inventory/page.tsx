"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/components/ui/use-toast";
import { getCurrentUser } from "@/lib/auth";

// Define types
interface BloodUnit {
  id: string;
  bloodGroup: string;
  quantity: number; // in units (1 unit = 450ml)
  collectionDate: string;
  expiryDate: string;
  status: 'available' | 'reserved' | 'used' | 'expired';
  donorId?: string;
  location: string;
}

// Blood group colors
const bloodGroupColors: Record<string, { bg: string, text: string, border: string }> = {
  'A+': { bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-200' },
  'A-': { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-100' },
  'B+': { bg: 'bg-blue-100', text: 'text-blue-800', border: 'border-blue-200' },
  'B-': { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-100' },
  'AB+': { bg: 'bg-purple-100', text: 'text-purple-800', border: 'border-purple-200' },
  'AB-': { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-100' },
  'O+': { bg: 'bg-amber-100', text: 'text-amber-800', border: 'border-amber-200' },
  'O-': { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-100' },
};

export default function InventoryPage() {
  const [inventory, setInventory] = useState<BloodUnit[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    available: 0,
    reserved: 0,
    expiringSoon: 0,
    expired: 0,
  });
  const [filter, setFilter] = useState("all");
  const router = useRouter();

  // Mock inventory data
  const mockInventory: BloodUnit[] = [
    {
      id: "BU-001",
      bloodGroup: "A+",
      quantity: 3,
      collectionDate: "2023-04-01",
      expiryDate: "2023-05-31",
      status: "available",
      donorId: "D-123",
      location: "Main Storage"
    },
    {
      id: "BU-002",
      bloodGroup: "O-",
      quantity: 2,
      collectionDate: "2023-04-05",
      expiryDate: "2023-06-04",
      status: "reserved",
      donorId: "D-124",
      location: "Main Storage"
    },
    {
      id: "BU-003",
      bloodGroup: "B+",
      quantity: 1,
      collectionDate: "2023-04-10",
      expiryDate: "2023-06-09",
      status: "available",
      donorId: "D-125",
      location: "East Wing"
    },
    {
      id: "BU-004",
      bloodGroup: "AB+",
      quantity: 2,
      collectionDate: "2023-03-15",
      expiryDate: new Date(new Date().setDate(new Date().getDate() + 5)).toISOString().split('T')[0],
      status: "available",
      donorId: "D-126",
      location: "West Wing"
    },
    {
      id: "BU-005",
      bloodGroup: "A-",
      quantity: 1,
      collectionDate: "2023-03-10",
      expiryDate: new Date(new Date().setDate(new Date().getDate() - 10)).toISOString().split('T')[0],
      status: "expired",
      donorId: "D-127",
      location: "Main Storage"
    },
    {
      id: "BU-006",
      bloodGroup: "O+",
      quantity: 4,
      collectionDate: "2023-04-15",
      expiryDate: "2023-06-14",
      status: "available",
      donorId: "D-128",
      location: "South Wing"
    },
    {
      id: "BU-007",
      bloodGroup: "B-",
      quantity: 1,
      collectionDate: "2023-04-12",
      expiryDate: "2023-06-11",
      status: "used",
      donorId: "D-129",
      location: "East Wing"
    },
    {
      id: "BU-008",
      bloodGroup: "AB-",
      quantity: 1,
      collectionDate: "2023-04-20",
      expiryDate: new Date(new Date().setDate(new Date().getDate() + 3)).toISOString().split('T')[0],
      status: "available",
      donorId: "D-130",
      location: "West Wing"
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

        // In real app, fetch inventory from database
        // For now, using mock data
        setInventory(mockInventory);
        calculateStats(mockInventory);
        setIsLoading(false);
      } catch (error) {
        console.error("Error checking authentication:", error);
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  const calculateStats = (units: BloodUnit[]) => {
    const today = new Date();
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(today.getDate() + 7);

    const stats = {
      total: units.length,
      available: units.filter(unit => unit.status === 'available').length,
      reserved: units.filter(unit => unit.status === 'reserved').length,
      expiringSoon: units.filter(unit => {
        const expiryDate = new Date(unit.expiryDate);
        return unit.status === 'available' && 
               expiryDate > today && 
               expiryDate <= sevenDaysFromNow;
      }).length,
      expired: units.filter(unit => unit.status === 'expired').length,
    };
    
    setStats(stats);
  };

  const getFilteredInventory = () => {
    const today = new Date();
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(today.getDate() + 7);

    switch (filter) {
      case "available":
        return inventory.filter(unit => unit.status === 'available');
      case "reserved":
        return inventory.filter(unit => unit.status === 'reserved');
      case "expiringSoon":
        return inventory.filter(unit => {
          const expiryDate = new Date(unit.expiryDate);
          return unit.status === 'available' && 
                expiryDate > today && 
                expiryDate <= sevenDaysFromNow;
        });
      case "expired":
        return inventory.filter(unit => unit.status === 'expired');
      default:
        return inventory;
    }
  };

  // Calculate days until expiry or days since expired
  const getDaysUntilExpiry = (expiryDateStr: string) => {
    const today = new Date();
    const expiryDate = new Date(expiryDateStr);
    const diffTime = expiryDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getStatusIndicator = (status: string, expiryDate: string) => {
    if (status === 'expired') {
      return { 
        bg: 'bg-red-100', 
        text: 'text-red-800',
        label: 'Expired'
      };
    }
    
    if (status === 'used') {
      return { 
        bg: 'bg-gray-100', 
        text: 'text-gray-800',
        label: 'Used'
      };
    }
    
    if (status === 'reserved') {
      return { 
        bg: 'bg-amber-100', 
        text: 'text-amber-800',
        label: 'Reserved'
      };
    }
    
    // For available status
    const daysUntilExpiry = getDaysUntilExpiry(expiryDate);
    
    if (daysUntilExpiry <= 0) {
      return { 
        bg: 'bg-red-100', 
        text: 'text-red-800',
        label: 'Expired'
      };
    } else if (daysUntilExpiry <= 7) {
      return { 
        bg: 'bg-orange-100', 
        text: 'text-orange-800',
        label: `Expires in ${daysUntilExpiry} day${daysUntilExpiry !== 1 ? 's' : ''}`
      };
    } else {
      return { 
        bg: 'bg-green-100', 
        text: 'text-green-800',
        label: 'Available'
      };
    }
  };

  // Calculate blood group quantities for the chart
  const calculateBloodGroupQuantities = () => {
    const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
    const quantities: Record<string, number> = {};
    
    bloodGroups.forEach(group => {
      const unitsOfGroup = inventory.filter(unit => 
        unit.bloodGroup === group && unit.status === 'available'
      );
      const totalQuantity = unitsOfGroup.reduce((sum, unit) => sum + unit.quantity, 0);
      quantities[group] = totalQuantity;
    });
    
    return quantities;
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="text-center">
          <div className="mx-auto h-16 w-16 rounded-full bg-red-100 p-3 mb-4">
            <div className="h-full w-full rounded-full bg-red-600 animate-pulse"></div>
          </div>
          <p className="text-gray-500">Loading blood inventory...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Blood Inventory Management</h1>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Track blood units, monitor expiry dates, and view inventory analytics.
        </p>
      </div>

      {/* Inventory stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
        <Card className="bg-white shadow-sm border border-gray-100">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Total Units</p>
                <h3 className="text-2xl font-bold text-gray-900">{stats.total}</h3>
              </div>
              <div className="h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-white shadow-sm border border-gray-100">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Available</p>
                <h3 className="text-2xl font-bold text-green-600">{stats.available}</h3>
              </div>
              <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-white shadow-sm border border-gray-100">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Reserved</p>
                <h3 className="text-2xl font-bold text-amber-600">{stats.reserved}</h3>
              </div>
              <div className="h-12 w-12 rounded-full bg-amber-100 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-white shadow-sm border border-gray-100">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Expiring Soon</p>
                <h3 className="text-2xl font-bold text-orange-600">{stats.expiringSoon}</h3>
              </div>
              <div className="h-12 w-12 rounded-full bg-orange-100 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-white shadow-sm border border-gray-100">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Expired</p>
                <h3 className="text-2xl font-bold text-red-600">{stats.expired}</h3>
              </div>
              <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        {/* Blood group inventory chart */}
        <Card className="bg-white shadow-sm border border-gray-100 lg:col-span-2">
          <CardHeader>
            <CardTitle>Blood Group Inventory</CardTitle>
            <CardDescription>Available units by blood group</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64 w-full">
              <div className="flex h-full items-end gap-2">
                {Object.entries(calculateBloodGroupQuantities()).map(([group, quantity]) => (
                  <div 
                    key={group} 
                    className="flex flex-1 flex-col items-center"
                  >
                    <div 
                      className={`w-full rounded-t-sm ${bloodGroupColors[group].bg} relative`} 
                      style={{ 
                        height: `${Math.max((quantity / 10) * 100, 5)}%` 
                      }}
                    >
                      <span className={`absolute top-0 left-0 right-0 text-center transform -translate-y-6 text-lg font-semibold ${bloodGroupColors[group].text}`}>
                        {quantity}
                      </span>
                    </div>
                    <span className={`mt-2 text-sm font-medium ${bloodGroupColors[group].text}`}>
                      {group}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            <div className="mt-4 text-center text-sm text-gray-500">
              Each unit = 450ml of whole blood
            </div>
          </CardContent>
        </Card>
        
        {/* Expiring alerts */}
        <Card className="bg-white shadow-sm border border-gray-100">
          <CardHeader>
            <CardTitle>Expiry Alerts</CardTitle>
            <CardDescription>Units expiring within 7 days</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {inventory
                .filter(unit => {
                  const daysUntilExpiry = getDaysUntilExpiry(unit.expiryDate);
                  return unit.status === 'available' && daysUntilExpiry > 0 && daysUntilExpiry <= 7;
                })
                .map(unit => (
                  <div 
                    key={unit.id} 
                    className="flex items-center justify-between p-3 rounded-md border border-orange-100 bg-orange-50"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`h-8 w-8 flex items-center justify-center rounded-full ${bloodGroupColors[unit.bloodGroup].bg}`}>
                        <span className={`text-sm font-semibold ${bloodGroupColors[unit.bloodGroup].text}`}>
                          {unit.bloodGroup}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{unit.quantity} unit{unit.quantity !== 1 ? 's' : ''}</p>
                        <p className="text-xs text-gray-500">{unit.location}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-orange-800">
                        Expires in {getDaysUntilExpiry(unit.expiryDate)} day{getDaysUntilExpiry(unit.expiryDate) !== 1 ? 's' : ''}
                      </p>
                      <p className="text-xs text-gray-500">{unit.expiryDate}</p>
                    </div>
                  </div>
                ))}
              
              {inventory.filter(unit => {
                const daysUntilExpiry = getDaysUntilExpiry(unit.expiryDate);
                return unit.status === 'available' && daysUntilExpiry > 0 && daysUntilExpiry <= 7;
              }).length === 0 && (
                <div className="text-center py-6">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-300 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-sm text-gray-500">No units expiring soon</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Inventory table */}
      <Card className="bg-white shadow-sm border border-gray-100">
        <CardHeader className="pb-2">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle>Blood Inventory</CardTitle>
              <CardDescription>All blood units in storage</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button 
                size="sm" 
                variant={filter === "all" ? "default" : "outline"}
                onClick={() => setFilter("all")}
                className={filter === "all" ? "bg-red-600 hover:bg-red-700" : ""}
              >
                All
              </Button>
              <Button 
                size="sm" 
                variant={filter === "available" ? "default" : "outline"}
                onClick={() => setFilter("available")}
                className={filter === "available" ? "bg-green-600 hover:bg-green-700" : ""}
              >
                Available
              </Button>
              <Button 
                size="sm" 
                variant={filter === "expiringSoon" ? "default" : "outline"}
                onClick={() => setFilter("expiringSoon")}
                className={filter === "expiringSoon" ? "bg-orange-600 hover:bg-orange-700" : ""}
              >
                Expiring Soon
              </Button>
              <Button 
                size="sm" 
                variant={filter === "expired" ? "default" : "outline"}
                onClick={() => setFilter("expired")}
                className={filter === "expired" ? "bg-red-600 hover:bg-red-700" : ""}
              >
                Expired
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="px-3 py-3 text-left font-medium text-gray-500">ID</th>
                  <th className="px-3 py-3 text-left font-medium text-gray-500">Blood Group</th>
                  <th className="px-3 py-3 text-left font-medium text-gray-500">Quantity</th>
                  <th className="px-3 py-3 text-left font-medium text-gray-500">Collection Date</th>
                  <th className="px-3 py-3 text-left font-medium text-gray-500">Expiry Date</th>
                  <th className="px-3 py-3 text-left font-medium text-gray-500">Status</th>
                  <th className="px-3 py-3 text-left font-medium text-gray-500">Location</th>
                </tr>
              </thead>
              <tbody>
                {getFilteredInventory().map(unit => {
                  const statusIndicator = getStatusIndicator(unit.status, unit.expiryDate);
                  return (
                    <tr key={unit.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="px-3 py-3 font-medium">{unit.id}</td>
                      <td className="px-3 py-3">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${bloodGroupColors[unit.bloodGroup].bg} ${bloodGroupColors[unit.bloodGroup].text}`}>
                          {unit.bloodGroup}
                        </span>
                      </td>
                      <td className="px-3 py-3">{unit.quantity} unit{unit.quantity !== 1 ? 's' : ''}</td>
                      <td className="px-3 py-3">{new Date(unit.collectionDate).toLocaleDateString()}</td>
                      <td className="px-3 py-3">{new Date(unit.expiryDate).toLocaleDateString()}</td>
                      <td className="px-3 py-3">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusIndicator.bg} ${statusIndicator.text}`}>
                          {statusIndicator.label}
                        </span>
                      </td>
                      <td className="px-3 py-3">{unit.location}</td>
                    </tr>
                  );
                })}
                
                {getFilteredInventory().length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-3 py-6 text-center text-gray-500">
                      No blood units match the current filter
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 