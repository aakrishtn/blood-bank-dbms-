"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { toast } from "@/components/ui/use-toast";

// Interface for blood centers from Geoapify API
interface BloodCenter {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  phone: string;
  hours: string;
  availableServices: string[];
  distance?: number; // in km
  coordinates: { lat: number; lng: number };
  source?: string; // To indicate which API provided this data
}

// Define interfaces for API responses
interface GeoapifyFeature {
  properties: {
    place_id: string;
    name?: string;
    street?: string;
    housenumber?: string;
    city?: string;
    suburb?: string;
    state?: string;
    county?: string;
    postcode?: string;
    country?: string;
    phone?: string;
    opening_hours?: string;
    formatted?: string;
    categories?: string[];
  };
  geometry: {
    coordinates: [number, number]; // [longitude, latitude]
  };
}

interface GeoapifyResponse {
  features: GeoapifyFeature[];
}

interface TomTomResult {
  id: string;
  name?: string;
  position: {
    lat: number;
    lon: number;
  };
  address?: {
    streetNumber?: string;
    streetName?: string;
    municipality?: string;
    countrySubdivision?: string;
    postalCode?: string;
    freeformAddress?: string;
  };
  poi?: {
    name?: string;
    phone?: string;
    openingHours?: string;
    categories?: string[];
  };
}

interface TomTomResponse {
  results: TomTomResult[];
}

// Calculate distance between two coordinates using Haversine formula
const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
    Math.sin(dLon/2) * Math.sin(dLon/2); 
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
  const d = R * c; // Distance in km
  return Math.round(d * 10) / 10;
};

const deg2rad = (deg: number): number => {
  return deg * (Math.PI/180);
};

export default function BloodCentersPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [userCoordinates, setUserCoordinates] = useState<{ lat: number; lng: number } | null>(null);
  const [bloodCenters, setBloodCenters] = useState<BloodCenter[]>([]);
  const [centerWithDistance, setCenterWithDistance] = useState<BloodCenter[]>([]);
  const [selectedCenter, setSelectedCenter] = useState<BloodCenter | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [locationPermission, setLocationPermission] = useState<'granted' | 'denied' | 'prompt'>('prompt');
  const [apiSource, setApiSource] = useState<string | null>(null);
  
  // Function to load mock data as fallback, memoized with useCallback
  const loadMockData = useCallback(() => {
    // Mock data for blood centers as fallback
    const mockCenters: BloodCenter[] = [
      {
        id: "center-1",
        name: "Central Blood Bank",
        address: "123 Main Street",
        city: "New York",
        state: "NY",
        zipCode: "10001",
        phone: "(212) 555-1234",
        hours: "Mon-Fri: 8AM-8PM, Sat-Sun: 10AM-6PM",
        availableServices: ["Whole Blood Donation", "Platelet Donation", "Plasma Donation", "Double Red Cell Donation"],
        coordinates: { lat: 40.7128, lng: -74.0060 },
      },
      {
        id: "center-2",
        name: "Memorial Hospital Blood Center",
        address: "456 Park Avenue",
        city: "New York",
        state: "NY",
        zipCode: "10022",
        phone: "(212) 555-5678",
        hours: "Mon-Fri: 7AM-7PM, Sat: 8AM-4PM, Sun: Closed",
        availableServices: ["Whole Blood Donation", "Platelet Donation", "Blood Testing"],
        coordinates: { lat: 40.7589, lng: -73.9851 },
      },
      {
        id: "center-3",
        name: "Community Blood Services",
        address: "789 Broadway",
        city: "Brooklyn",
        state: "NY",
        zipCode: "11221",
        phone: "(718) 555-9012",
        hours: "Mon-Thu: 9AM-7PM, Fri-Sat: 9AM-5PM, Sun: Closed",
        availableServices: ["Whole Blood Donation", "Mobile Blood Drives", "Group Donations"],
        coordinates: { lat: 40.6782, lng: -73.9442 },
      },
      {
        id: "center-4",
        name: "Eastside Blood Donation Center",
        address: "321 First Avenue",
        city: "New York",
        state: "NY",
        zipCode: "10003",
        phone: "(212) 555-3456",
        hours: "Mon-Fri: 8AM-6PM, Sat: 9AM-3PM, Sun: Closed",
        availableServices: ["Whole Blood Donation", "Platelet Donation", "Plasma Donation", "Special Donations"],
        coordinates: { lat: 40.7357, lng: -73.9817 },
      },
      {
        id: "center-5",
        name: "Westside Blood Bank",
        address: "654 Tenth Avenue",
        city: "New York",
        state: "NY",
        zipCode: "10036",
        phone: "(212) 555-7890",
        hours: "Mon-Sat: 7:30AM-7:30PM, Sun: 10AM-4PM",
        availableServices: ["Whole Blood Donation", "Double Red Cell Donation", "Directed Donations"],
        coordinates: { lat: 40.7602, lng: -73.9932 },
      },
      {
        id: "center-6",
        name: "Queens Blood Donation",
        address: "987 Queens Boulevard",
        city: "Queens",
        state: "NY",
        zipCode: "11375",
        phone: "(718) 555-2345",
        hours: "Mon-Fri: 8AM-7PM, Sat-Sun: 9AM-5PM",
        availableServices: ["Whole Blood Donation", "Platelet Donation", "Blood Testing"],
        coordinates: { lat: 40.7282, lng: -73.8066 },
      },
    ];
    
    // Calculate distances and sort by proximity
    if (userCoordinates) {
      const mockWithDistance = mockCenters.map(center => ({
        ...center,
        distance: calculateDistance(
          userCoordinates.lat,
          userCoordinates.lng,
          center.coordinates.lat,
          center.coordinates.lng
        )
      })).sort((a, b) => (a.distance || 0) - (b.distance || 0));
      
      setBloodCenters(mockCenters);
      setCenterWithDistance(mockWithDistance);
      
      if (mockWithDistance.length > 0) {
        setSelectedCenter(mockWithDistance[0]);
      }
    }
  }, [userCoordinates]);

  // Get user location
  useEffect(() => {
    // Check if permission was previously granted/denied
    if (typeof navigator !== 'undefined' && navigator.permissions) {
      navigator.permissions.query({ name: 'geolocation' })
        .then(result => {
          setLocationPermission(result.state as 'granted' | 'denied' | 'prompt');
          
          // Add event listener for permission changes
          result.onchange = () => {
            setLocationPermission(result.state as 'granted' | 'denied' | 'prompt');
          };
          
          // If already granted, get location immediately
          if (result.state === 'granted') {
            getUserLocation();
          } else if (result.state === 'prompt') {
            // Let the user trigger the permission prompt
            setError("Click 'Share Location' to find blood centers near you");
            setIsLoading(false);
          } else {
            // Permission was denied previously
            setError("Location access denied. Using default location.");
            setUserCoordinates({ lat: 40.7128, lng: -74.0060 });
            setIsLoading(false);
          }
        })
        .catch(error => {
          console.error("Error checking permission:", error);
          // Fallback to normal geolocation request
          getUserLocation();
        });
    } else {
      // Older browsers without permissions API
      getUserLocation();
    }
  }, []);

  const getUserLocation = () => {
    setIsLoading(true);
    
    if (navigator.geolocation) {
      // Add a timeout to handle cases where the permission dialog is ignored
      const timeoutId = setTimeout(() => {
        console.warn("Geolocation request timed out, using default location");
        setUserCoordinates({ lat: 40.7128, lng: -74.0060 }); // NYC default
        setError("Location access timed out. Using default location.");
        setIsLoading(false);
      }, 10000); // 10 second timeout
      
      navigator.geolocation.getCurrentPosition(
        (position) => {
          clearTimeout(timeoutId);
          setUserCoordinates({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
          // Show a success message briefly
          toast({
            title: "Location detected",
            description: "Using your current location to find nearby blood centers.",
            duration: 3000,
          });
        },
        (error) => {
          clearTimeout(timeoutId);
          console.error("Geolocation error:", error);
          
          // Set user-friendly error messages
          let errorMessage = "Could not access your location. ";
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage += "Location permission was denied.";
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage += "Location information is unavailable.";
              break;
            case error.TIMEOUT:
              errorMessage += "The request to get location timed out.";
              break;
            default:
              errorMessage += "An unknown error occurred.";
          }
          
          // Default to New York City coordinates if geolocation fails
          setUserCoordinates({ lat: 40.7128, lng: -74.0060 });
          setError(errorMessage + " Using default location instead.");
          setIsLoading(false);
        },
        {
          enableHighAccuracy: true,
          timeout: 8000,
          maximumAge: 0
        }
      );
    } else {
      // Default to New York City coordinates if geolocation is not supported
      setUserCoordinates({ lat: 40.7128, lng: -74.0060 });
      setError("Your browser doesn't support geolocation. Using default location.");
      setIsLoading(false);
    }
  };

  // Fetch blood centers when user coordinates are available
  useEffect(() => {
    const fetchBloodCenters = async () => {
      if (!userCoordinates) return;
      
      setIsLoading(true);
      
      try {
        // We'll try both APIs in parallel, use results from whichever responds first successfully
        const results = await Promise.race([
          fetchFromGeoapify(userCoordinates),
          fetchFromTomTom(userCoordinates)
        ]);
        
        if (results.centers.length > 0) {
          setBloodCenters(results.centers);
          setCenterWithDistance(results.centersWithDistance);
          setApiSource(results.source);
          
          // Select the first center by default if available
          if (results.centersWithDistance.length > 0) {
            setSelectedCenter(results.centersWithDistance[0]);
          }
          
          // Clear any previous errors
          setError(null);
        } else {
          // If no centers found, use mock data
          console.warn("No centers found from APIs, using mock data");
          setError("No blood donation centers found in your area. Showing sample data instead.");
          loadMockData();
        }
      } catch (error) {
        console.error("Error fetching blood centers:", error);
        setError("Failed to fetch blood donation centers. Using demo data instead.");
        loadMockData();
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchBloodCenters();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userCoordinates, loadMockData]);
  
  // Function to fetch blood centers from Geoapify API
  const fetchFromGeoapify = async (coordinates: { lat: number; lng: number }) => {
    const apiKey = process.env.NEXT_PUBLIC_GEOAPIFY_API_KEY || "6daa5846b15e4e949ab14bfa97c45023";
    
    // The correct format for circle filter is: lon,lat,radius(in meters)
    // Notice coordinates are in longitude,latitude order (not lat,lng)
    const radius = 30000; // 30km radius
    const limit = 20; // Limit results
    
    // Properly format the circle parameter as a string with comma-separated values
    const circleFilter = `${coordinates.lng.toFixed(6)},${coordinates.lat.toFixed(6)},${radius}`;
    
    const url = `https://api.geoapify.com/v2/places?categories=healthcare.blood_donation,healthcare.hospital,healthcare.clinic&filter=circle:${circleFilter}&limit=${limit}&apiKey=${apiKey}`;
    
    console.log("Fetching blood centers from Geoapify:", url);
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Geoapify API returned status ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.features && data.features.length > 0) {
      console.log("Found centers from Geoapify:", data.features.length);
      
      const centers = mapGeoapifyResponse(data);
      const centersWithDistance = calculateCenterDistances(centers, coordinates);
      
      return {
        source: "Geoapify",
        centers,
        centersWithDistance
      };
    }
    
    return { source: "Geoapify", centers: [], centersWithDistance: [] };
  };
  
  // Function to fetch blood centers from TomTom API
  const fetchFromTomTom = async (coordinates: { lat: number; lng: number }) => {
    // TomTom API key - in production, use environment variable
    const apiKey = process.env.NEXT_PUBLIC_TOMTOM_API_KEY || "YOUR_TOMTOM_API_KEY";
    
    const radius = 30000; // 30km radius
    const limit = 20; // Limit results
    
    // TomTom uses lat,lon for coordinates
    const url = `https://api.tomtom.com/search/2/categorySearch/hospital,clinic.json?lat=${coordinates.lat}&lon=${coordinates.lng}&radius=${radius/1000}&limit=${limit}&key=${apiKey}`;
    
    console.log("Fetching blood centers from TomTom:", url);
    
    try {
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`TomTom API returned status ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.results && data.results.length > 0) {
        console.log("Found centers from TomTom:", data.results.length);
        
        const centers = mapTomTomResponse(data);
        const centersWithDistance = calculateCenterDistances(centers, coordinates);
        
        return {
          source: "TomTom",
          centers,
          centersWithDistance
        };
      }
    } catch (error) {
      console.error("Error with TomTom API:", error);
    }
    
    return { source: "TomTom", centers: [], centersWithDistance: [] };
  };
  
  // Map Geoapify API response to BloodCenter interface
  const mapGeoapifyResponse = (data: GeoapifyResponse): BloodCenter[] => {
    return data.features.map((feature: GeoapifyFeature) => {
      const properties = feature.properties;
      
      // Get the name or use a default based on category
      let name = properties.name;
      if (!name) {
        if (properties.categories?.includes('healthcare.hospital')) {
          name = 'Hospital Blood Center';
        } else if (properties.categories?.includes('healthcare.clinic')) {
          name = 'Medical Clinic';
        } else {
          name = 'Blood Donation Center';
        }
      }
      
      // Format the address components
      let address = '';
      const street = properties.street || '';
      const houseNumber = properties.housenumber || '';
      
      if (houseNumber || street) {
        address = `${houseNumber} ${street}`.trim();
      } else if (properties.formatted) {
        // Extract first line of formatted address if available
        const formattedParts = properties.formatted.split(',');
        address = formattedParts[0].trim();
      }
      
      const city = properties.city || properties.suburb || properties.county || '';
      const state = properties.state || '';
      const zipCode = properties.postcode || '';
      
      return {
        id: properties.place_id || `place-${Math.random().toString(36).substr(2, 9)}`,
        name: name,
        address: address,
        city: city,
        state: state,
        zipCode: zipCode,
        phone: properties.phone || 'N/A',
        hours: properties.opening_hours || 'Call for hours of operation',
        availableServices: ['Whole Blood Donation'],
        coordinates: {
          lat: feature.geometry.coordinates[1],
          lng: feature.geometry.coordinates[0]
        },
        source: 'Geoapify'
      };
    });
  };
  
  // Map TomTom API response to BloodCenter interface
  const mapTomTomResponse = (data: TomTomResponse): BloodCenter[] => {
    return data.results.map((result: TomTomResult) => {
      const address = result.address || {};
      const poi = result.poi || {};
      
      return {
        id: `tomtom-${result.id || Math.random().toString(36).substr(2, 9)}`,
        name: poi.name || result.name || 'Medical Facility',
        address: address.streetName ? `${address.streetNumber || ''} ${address.streetName}`.trim() : address.freeformAddress || '',
        city: address.municipality || '',
        state: address.countrySubdivision || '',
        zipCode: address.postalCode || '',
        phone: poi.phone || 'N/A',
        hours: poi.openingHours || 'Call for hours of operation',
        availableServices: ['Whole Blood Donation'],
        coordinates: {
          lat: result.position.lat,
          lng: result.position.lon
        },
        source: 'TomTom'
      };
    });
  };
  
  // Calculate distances for all centers
  const calculateCenterDistances = (centers: BloodCenter[], coordinates: { lat: number; lng: number }) => {
    return centers.map(center => ({
      ...center,
      distance: calculateDistance(
        coordinates.lat,
        coordinates.lng,
        center.coordinates.lat,
        center.coordinates.lng
      )
    })).sort((a, b) => (a.distance || 0) - (b.distance || 0));
  };
  
  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!searchTerm.trim()) {
      // Reset to all centers sorted by distance
      setCenterWithDistance(
        bloodCenters.map(center => ({
          ...center,
          distance: userCoordinates ? calculateDistance(
            userCoordinates.lat, 
            userCoordinates.lng, 
            center.coordinates.lat, 
            center.coordinates.lng
          ) : 0
        })).sort((a, b) => (a.distance || 0) - (b.distance || 0))
      );
      return;
    }
    
    // Filter centers by name, address, or city
    const lowerSearchTerm = searchTerm.toLowerCase();
    const filtered = bloodCenters.filter(center => 
      center.name.toLowerCase().includes(lowerSearchTerm) || 
      center.address.toLowerCase().includes(lowerSearchTerm) || 
      center.city.toLowerCase().includes(lowerSearchTerm) ||
      center.state.toLowerCase().includes(lowerSearchTerm) ||
      center.zipCode.includes(lowerSearchTerm)
    ).map(center => ({
      ...center,
      distance: userCoordinates ? calculateDistance(
        userCoordinates.lat, 
        userCoordinates.lng, 
        center.coordinates.lat, 
        center.coordinates.lng
      ) : 0
    })).sort((a, b) => (a.distance || 0) - (b.distance || 0));
    
    setCenterWithDistance(filtered);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Find Blood Donation Centers</h1>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Locate your nearest blood donation center and learn about available services and operating hours.
        </p>
        {apiSource && (
          <div className="text-xs text-gray-500 mt-2">
            Data provided by {apiSource} API
          </div>
        )}
      </div>
      
      <div className="max-w-6xl mx-auto">
        {locationPermission === 'prompt' && !userCoordinates && (
          <div className="flex justify-center mb-8">
            <Button 
              variant="red" 
              onClick={getUserLocation}
              className="flex items-center gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <circle cx="12" cy="12" r="3"></circle>
              </svg>
              Share Your Location
            </Button>
          </div>
        )}
        
        <form onSubmit={handleSearch} className="mb-8">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <Label htmlFor="location" className="sr-only">Search for a location</Label>
              <Input 
                id="location" 
                type="text" 
                placeholder="Search by center name, address, city, or zip code" 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="h-11 rounded-md border border-gray-200"
              />
            </div>
            <Button 
              type="submit"
              variant="red"
            >
              Search
            </Button>
          </div>
        </form>
        
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-red-600" />
            <span className="ml-2 text-lg text-gray-700">Loading blood donation centers...</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Left side - List of centers */}
            <div className="md:col-span-1 space-y-4 overflow-auto max-h-[700px] pr-2" style={{ scrollbarWidth: 'thin' }}>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                {centerWithDistance.length} {centerWithDistance.length === 1 ? "Center" : "Centers"} Found
              </h2>
              
              {error && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 mb-4">
                  <p className="text-yellow-800 text-sm">{error}</p>
                </div>
              )}
              
              {centerWithDistance.length === 0 ? (
                <div className="text-center py-8 bg-gray-50 rounded-lg">
                  <p className="text-gray-500">No centers found matching your search.</p>
                  <Button
                    variant="link"
                    onClick={() => {
                      setSearchTerm("");
                      setCenterWithDistance(
                        bloodCenters.map(center => ({
                          ...center,
                          distance: userCoordinates ? calculateDistance(
                            userCoordinates.lat, 
                            userCoordinates.lng, 
                            center.coordinates.lat, 
                            center.coordinates.lng
                          ) : 0
                        })).sort((a, b) => (a.distance || 0) - (b.distance || 0))
                      );
                    }}
                    className="mt-2 text-red-600"
                  >
                    Reset search
                  </Button>
                </div>
              ) : (
                centerWithDistance.map(center => (
                  <div
                    key={center.id}
                    className={`border rounded-lg p-4 transition-all hover:shadow-md cursor-pointer ${selectedCenter?.id === center.id ? 'border-red-300 bg-red-50' : 'border-gray-200 hover:border-red-200'}`}
                    onClick={() => setSelectedCenter(center)}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-semibold text-gray-900">{center.name}</h3>
                      <span className="text-sm text-gray-500">{center.distance} km</span>
                    </div>
                    <p className="text-sm text-gray-600 mb-1">{center.address}</p>
                    <p className="text-sm text-gray-600 mb-2">{center.city}, {center.state} {center.zipCode}</p>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>{center.hours?.split(',')[0] || 'Hours unavailable'}...</span>
                    </div>
                  </div>
                ))
              )}
            </div>
            
            {/* Right side - Map and details */}
            <div className="md:col-span-2">
              {/* Map placeholder */}
              <div className="bg-gray-100 rounded-lg mb-6 overflow-hidden relative" style={{ height: '350px' }}>
                <div className="absolute inset-0 bg-gradient-to-br from-gray-100 to-gray-200">
                  {/* Simplified Map UI */}
                  <div className="h-full w-full relative">
                    {/* Map controls */}
                    <div className="absolute top-3 right-3 z-20 flex flex-col gap-2">
                      <button className="h-8 w-8 bg-white rounded-md shadow-md flex items-center justify-center text-gray-700 hover:bg-gray-50">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M5 12h14"></path>
                          <path d="M12 5v14"></path>
                        </svg>
                      </button>
                      <button className="h-8 w-8 bg-white rounded-md shadow-md flex items-center justify-center text-gray-700 hover:bg-gray-50">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M5 12h14"></path>
                        </svg>
                      </button>
                      <button 
                        className="h-8 w-8 bg-white rounded-md shadow-md flex items-center justify-center text-gray-700 hover:bg-gray-50"
                        onClick={getUserLocation}
                        title="Use current location"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="12" cy="12" r="3"></circle>
                          <path d="M12 2v3"></path>
                          <path d="M12 19v3"></path>
                          <path d="M2 12h3"></path>
                          <path d="M19 12h3"></path>
                        </svg>
                      </button>
                    </div>
                    
                    {/* Road patterns */}
                    <div className="absolute inset-0 opacity-10">
                      <div className="absolute left-[10%] top-0 bottom-0 w-[1px] bg-gray-400"></div>
                      <div className="absolute left-[30%] top-0 bottom-0 w-[2px] bg-gray-400"></div>
                      <div className="absolute left-[70%] top-0 bottom-0 w-[1px] bg-gray-400"></div>
                      <div className="absolute top-[25%] left-0 right-0 h-[1px] bg-gray-400"></div>
                      <div className="absolute top-[50%] left-0 right-0 h-[2px] bg-gray-400"></div>
                      <div className="absolute top-[75%] left-0 right-0 h-[1px] bg-gray-400"></div>
                    </div>
                    
                    {/* Center indicators */}
                    {centerWithDistance.map((center, index) => {
                      // Create a somewhat realistic distribution based on coordinates
                      const normalizedLat = (center.coordinates.lat - 
                        (userCoordinates?.lat || 40.7128)) * 500;
                      const normalizedLng = (center.coordinates.lng - 
                        (userCoordinates?.lng || -74.0060)) * 500;
                      
                      // Constrain to map bounds with some padding
                      const top = Math.min(Math.max(50 + normalizedLat, 30), 320);
                      const left = Math.min(Math.max(50 + normalizedLng, 30), 
                        typeof window !== 'undefined' ? (window.innerWidth > 768 ? window.innerWidth * 0.5 - 60 : window.innerWidth - 60) : 300);
                      
                      return (
                        <div 
                          key={center.id}
                          className={`absolute z-10 transition-all duration-300 cursor-pointer group`}
                          style={{ top: `${top}px`, left: `${left}px` }}
                          onClick={() => setSelectedCenter(center)}
                        >
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center 
                            ${selectedCenter?.id === center.id 
                              ? 'bg-red-600 ring-4 ring-red-200 shadow-lg' 
                              : 'bg-red-500 hover:ring-2 hover:ring-red-200'}
                            transition-all duration-300`}
                          >
                            <span className="text-white text-xs font-bold">{index + 1}</span>
                          </div>
                          {selectedCenter?.id === center.id && (
                            <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 bg-white px-2 py-1 rounded shadow-md text-xs whitespace-nowrap">
                              {center.name}
                            </div>
                          )}
                        </div>
                      );
                    })}
                    
                    {/* User location indicator */}
                    {userCoordinates && (
                      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10">
                        <div className="relative">
                          <div className="h-4 w-4 rounded-full bg-blue-600 border-2 border-white"></div>
                          <div className="absolute inset-0 rounded-full bg-blue-400 animate-ping opacity-75"></div>
                        </div>
                      </div>
                    )}
                    
                    {/* Info overlay */}
                    {!centerWithDistance.length && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="bg-white/90 backdrop-blur-sm p-4 rounded-lg shadow-sm max-w-xs text-center">
                          {isLoading ? (
                            <div className="flex flex-col items-center">
                              <Loader2 className="h-8 w-8 animate-spin text-red-600 mb-2" />
                              <p className="text-gray-700">Finding blood donation centers near you...</p>
                            </div>
                          ) : (
                            <>
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-red-500 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                              </svg>
                              <p className="text-gray-700 mb-2">No blood donation centers found yet</p>
                              <p className="text-xs text-gray-500">
                                {locationPermission === 'prompt' 
                                  ? "Please allow location access to find centers near you" 
                                  : "We're working with demonstration data for now"}
                              </p>
                            </>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Center details */}
              {selectedCenter ? (
                <Card className="border border-gray-200 shadow-sm">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-xl">{selectedCenter.name}</CardTitle>
                        <CardDescription>{selectedCenter.distance} km away • {selectedCenter.city}, {selectedCenter.state}</CardDescription>
                      </div>
                      <Button variant="redOutline" className="flex gap-1 items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                        Call
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 mb-1">Address</h3>
                      <p className="text-gray-900">{selectedCenter.address}</p>
                      <p className="text-gray-900">{selectedCenter.city}, {selectedCenter.state} {selectedCenter.zipCode}</p>
                    </div>
                    
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 mb-1">Hours of Operation</h3>
                      <p className="text-gray-900">{selectedCenter.hours}</p>
                    </div>
                    
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 mb-1">Phone</h3>
                      <p className="text-gray-900">{selectedCenter.phone}</p>
                    </div>
                    
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 mb-1">Available Services</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                        {selectedCenter.availableServices.map(service => (
                          <div key={service} className="flex items-center gap-2">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-green-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            <span className="text-sm text-gray-700">{service}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="border-t border-gray-100 flex justify-between bg-gray-50">
                    <Button
                      variant="redOutline"
                      className="flex gap-1 items-center"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                      </svg>
                      Get Directions
                    </Button>
                    <Link href="/appointments">
                      <Button variant="red">
                        Schedule Appointment
                      </Button>
                    </Link>
                  </CardFooter>
                </Card>
              ) : (
                <Card className="border border-gray-200 shadow-sm bg-gray-50">
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <div className="h-16 w-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Center Details</h3>
                    <p className="text-gray-500 text-center max-w-md mb-6">
                      Select a blood donation center from the list to view detailed information.
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 