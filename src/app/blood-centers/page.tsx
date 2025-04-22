"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { bloodCenterAPI } from "@/lib/database";

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
  const [usingCachedData, setUsingCachedData] = useState(false);
  
  // Function to handle fallback if APIs fail
  const handleApiFallback = useCallback(() => {
    toast({
      variant: "destructive",
      title: "Error loading blood center data",
      description: "Could not fetch blood center data. Please try again later or search for centers manually.",
    });
    
    setIsLoading(false);
    setError("Failed to load blood centers. Please try searching for a specific location.");
  }, []);

  // Get user location
  const getUserLocation = () => {
    if (!navigator.geolocation) {
      toast({
        variant: "destructive",
        title: "Geolocation not supported",
        description: "Your browser does not support geolocation. Please enter your location manually.",
      });
      setLocationPermission('denied');
      setIsLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setUserCoordinates({ lat: latitude, lng: longitude });
        setLocationPermission('granted');
      },
      (error) => {
        console.error("Error getting user location:", error);
        
        if (error.code === error.PERMISSION_DENIED) {
          setLocationPermission('denied');
          toast({
            variant: "destructive",
            title: "Location access denied",
            description: "Please enable location access or search for blood centers manually.",
          });
        } else {
          toast({
            variant: "destructive",
            title: "Location error",
            description: "Could not get your location. Please search manually.",
          });
        }
        
        setIsLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0
      }
    );
  };

  useEffect(() => {
    // Check for geolocation on component mount
    getUserLocation();
  }, []);

  // Function to convert database blood center to our interface
  const mapDatabaseCenterToInterface = (dbCenter: any): BloodCenter => {
    // Parse the coordinates point type from PostgreSQL 
    let lat = 0, lng = 0;
    if (dbCenter.coordinates) {
      try {
        // Assuming coordinates is stored as a point "(lng,lat)"
        const pointStr = dbCenter.coordinates.replace('(', '').replace(')', '');
        const [lngStr, latStr] = pointStr.split(',');
        lng = parseFloat(lngStr);
        lat = parseFloat(latStr);
      } catch (e) {
        console.error("Error parsing coordinates:", e);
      }
    }
    
    return {
      id: dbCenter.center_id,
      name: dbCenter.center_name,
      address: dbCenter.address || 'Address not available',
      city: dbCenter.city?.city_name || 'City not available',
      state: 'State not available', // Would need to extend schema to store this
      zipCode: 'Zip code not available', // Would need to extend schema to store this
      phone: dbCenter.phone || 'Phone not available',
      hours: dbCenter.operating_hours || 'Hours not available',
      availableServices: dbCenter.available_services || ['Whole Blood Donation'],
      distance: dbCenter.distance_km,
      coordinates: { lat, lng },
      source: dbCenter.api_source || 'Database'
    };
  };
  
  // Function to store blood centers in database for future use
  const storeCentersInDatabase = async (centers: BloodCenter[]) => {
    try {
      for (const center of centers) {
        await bloodCenterAPI.addBloodCenter({
          center_id: center.id,
          center_name: center.name,
          address: center.address,
          city_id: null, // Would need city lookup/creation logic
          coordinates: `POINT(${center.coordinates.lng} ${center.coordinates.lat})`,
          phone: center.phone,
          operating_hours: center.hours,
          available_services: center.availableServices,
          api_source: center.source
        }).catch(err => {
          // Likely already exists - not a problem
          console.log("Center may already exist in database:", center.id);
        });
      }
      console.log("Successfully cached blood centers data");
    } catch (error) {
      console.error("Error storing centers in database:", error);
    }
  };
  
  // Modified function to try getting centers from database first
  const fetchBloodCenters = async (coordinates: { lat: number; lng: number }) => {
    try {
      // First try to get centers from our database by proximity
      try {
        const dbCenters = await bloodCenterAPI.getBloodCentersByProximity(
          coordinates.lat, 
          coordinates.lng, 
          15 // 15km radius
        );
        
        if (dbCenters && dbCenters.length > 0) {
          console.log("Using cached centers from database");
          setUsingCachedData(true);
          setApiSource('Database');
          return dbCenters.map(mapDatabaseCenterToInterface);
        }
      } catch (dbError) {
        console.log("No cached centers available:", dbError);
        setUsingCachedData(false);
      }
      
      // If no results from database, try external APIs
      // Check if API keys are available
      const geoapifyKey = process.env.NEXT_PUBLIC_GEOAPIFY_API_KEY;
      const tomtomKey = process.env.NEXT_PUBLIC_TOMTOM_API_KEY;
      
      if (!geoapifyKey && !tomtomKey) {
        toast({
          variant: "destructive",
          title: "API Configuration Missing",
          description: "Contact system administrator. API keys are not configured.",
        });
        setError("API configuration missing. Please try again later.");
        return [];
      }
      
      // Try to fetch from Geoapify first if key is available
      let centers: BloodCenter[] = [];
      if (geoapifyKey) {
        centers = await fetchFromGeoapify(coordinates);
        if (centers.length > 0) {
          setApiSource('Geoapify');
          // Store in database for future use
          storeCentersInDatabase(centers);
        }
      }
      
      // If Geoapify returns no results or isn't available, try TomTom as fallback
      if (centers.length === 0 && tomtomKey) {
        centers = await fetchFromTomTom(coordinates);
        if (centers.length > 0) {
          setApiSource('TomTom');
          // Store in database for future use
          storeCentersInDatabase(centers);
        }
      }
      
      return centers;
    } catch (error) {
      console.error("Error in fetchBloodCenters:", error);
      throw error;
    }
  };

  useEffect(() => {
    // Fetch blood centers when user coordinates are available
    if (userCoordinates) {
      setIsLoading(true);
      
      fetchBloodCenters(userCoordinates)
        .then(centers => {
          if (centers.length === 0) {
            setError("No blood centers found nearby. Try searching a different location.");
            return;
          }
          
          setBloodCenters(centers);
          
          // Calculate distance from user and sort by proximity
          const centersWithDistance = calculateCenterDistances(centers, userCoordinates);
          setCenterWithDistance(centersWithDistance);
        })
        .catch(error => {
          console.error("Error fetching blood centers:", error);
          handleApiFallback();
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [userCoordinates, handleApiFallback]);

  const fetchFromGeoapify = async (coordinates: { lat: number; lng: number }) => {
    const radius = 15000; // 15 km radius
    const limit = 20;
    const apiKey = process.env.NEXT_PUBLIC_GEOAPIFY_API_KEY;
    
    if (!apiKey) {
      console.error("Geoapify API key is missing");
      return [];
    }
    
    const url = `https://api.geoapify.com/v2/places?categories=healthcare.blood_donation&filter=circle:${coordinates.lng},${coordinates.lat},${radius}&limit=${limit}&apiKey=${apiKey}`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Geoapify API error: ${response.status}`);
    }
    
    const data: GeoapifyResponse = await response.json();
    return mapGeoapifyResponse(data);
  };

  const fetchFromTomTom = async (coordinates: { lat: number; lng: number }) => {
    const categories = "healthcare";
    const radius = 15000; // 15 km
    const limit = 20;
    const apiKey = process.env.NEXT_PUBLIC_TOMTOM_API_KEY;
    
    if (!apiKey) {
      console.error("TomTom API key is missing");
      return [];
    }
    
    const url = `https://api.tomtom.com/search/2/categorySearch/blood%20donation.json?lat=${coordinates.lat}&lon=${coordinates.lng}&radius=${radius}&limit=${limit}&key=${apiKey}`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`TomTom API error: ${response.status}`);
    }
    
    const data: TomTomResponse = await response.json();
    return mapTomTomResponse(data);
  };

  const mapGeoapifyResponse = (data: GeoapifyResponse): BloodCenter[] => {
    if (!data.features || data.features.length === 0) {
      return [];
    }
    
    return data.features.map(feature => {
      const props = feature.properties;
      const coordinates = feature.geometry.coordinates;
      
      // Extract the address components
      const street = props.street || '';
      const houseNumber = props.housenumber || '';
      const address = `${houseNumber} ${street}`.trim();
      
      // Fallback services based on categories
      const availableServices = props.categories ? 
        [
          ...(props.categories.some(c => c.includes('blood_donation')) ? ['Whole Blood Donation'] : []),
          ...(props.categories.some(c => c.includes('hospital')) ? ['Platelet Donation', 'Plasma Donation'] : [])
        ] : ['Whole Blood Donation'];
      
      return {
        id: props.place_id,
        name: props.name || 'Blood Donation Center',
        address: address || props.formatted || 'Address not available',
        city: props.city || props.suburb || 'City not available',
        state: props.state || props.county || 'State not available',
        zipCode: props.postcode || 'Zip code not available',
        phone: props.phone || 'Phone not available',
        hours: props.opening_hours || 'Hours not available',
        availableServices: availableServices.length ? availableServices : ['Whole Blood Donation'],
        coordinates: { lat: coordinates[1], lng: coordinates[0] },
        source: 'Geoapify'
      };
    });
  };

  const mapTomTomResponse = (data: TomTomResponse): BloodCenter[] => {
    if (!data.results || data.results.length === 0) {
      return [];
    }
    
    return data.results.map(result => {
      const address = result.address || {};
      const poi = result.poi || {};
      
      // Fallback services
      const availableServices = ['Whole Blood Donation'];
      
      if (poi.categories) {
        if (poi.categories.some(c => c.includes('hospital'))) {
          availableServices.push('Platelet Donation', 'Plasma Donation');
        }
      }
      
      return {
        id: result.id,
        name: result.name || poi.name || 'Blood Donation Center',
        address: `${address.streetNumber || ''} ${address.streetName || ''}`.trim() || 'Address not available',
        city: address.municipality || 'City not available',
        state: address.countrySubdivision || 'State not available',
        zipCode: address.postalCode || 'Zip code not available',
        phone: poi.phone || 'Phone not available',
        hours: poi.openingHours || 'Hours not available',
        availableServices,
        coordinates: { lat: result.position.lat, lng: result.position.lon },
        source: 'TomTom'
      };
    });
  };

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
      toast({
        variant: "destructive",
        title: "Search term required",
        description: "Please enter a location to search for blood centers.",
      });
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    // Check if API keys are available
    const geoapifyKey = process.env.NEXT_PUBLIC_GEOAPIFY_API_KEY;
    
    if (!geoapifyKey) {
      toast({
        variant: "warning",
        title: "Limited Search Capability",
        description: "Geocoding service not available. Using approximate search.",
      });
      setIsLoading(false);
      return;
    }
    
    // Geocode the search term to coordinates
    const geocodeUrl = `https://api.geoapify.com/v1/geocode/search?text=${encodeURIComponent(searchTerm)}&apiKey=${geoapifyKey}`;
    
    fetch(geocodeUrl)
      .then(res => {
        if (!res.ok) {
          throw new Error(`Geocoding error: ${res.status}`);
        }
        return res.json();
      })
      .then(data => {
        if (data.features && data.features.length > 0) {
          const coords = data.features[0].geometry.coordinates;
          const newCoords = { lat: coords[1], lng: coords[0] };
          setUserCoordinates(newCoords);
          
          // Fetch blood centers for the new coordinates
          return fetchBloodCenters(newCoords);
        } else {
          throw new Error("Location not found");
        }
      })
      .then(centers => {
        if (centers.length === 0) {
          setError("No blood centers found near this location. Try a different search term.");
          return [];
        }
        
        setBloodCenters(centers);
        
        // Calculate distance from search location and sort by proximity
        const centersWithDistance = calculateCenterDistances(centers, userCoordinates!);
        setCenterWithDistance(centersWithDistance);
      })
      .catch(err => {
        console.error("Error during search:", err);
        toast({
          variant: "destructive",
          title: "Search error",
          description: err.message || "Could not find blood centers near this location.",
        });
        setError("Error finding centers. Please try a different search term.");
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-black mb-2">Find Blood <span className="text-red-600">Donation Centers</span></h1>
          <p className="text-gray-700 max-w-2xl mx-auto">
            Locate your nearest blood donation center and learn about available services and operating hours.
          </p>
          {apiSource && (
            <div className="text-xs text-gray-600 mt-2">
              Data provided by {apiSource} {usingCachedData && "(cached)"} 
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
                  className="h-11 rounded-md border border-gray-200 focus:border-red-500 focus:ring-1 focus:ring-red-500"
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
                    <p className="text-gray-700">No centers found matching your search.</p>
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
                      className={`border rounded-lg p-4 transition-all hover:shadow-md cursor-pointer ${selectedCenter?.id === center.id ? 'border-red-500 bg-red-50' : 'border-gray-200 hover:border-red-200'}`}
                      onClick={() => setSelectedCenter(center)}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-semibold text-gray-900">{center.name}</h3>
                        <span className="text-sm text-gray-600">{center.distance} km</span>
                      </div>
                      <p className="text-sm text-gray-600 mb-1">{center.address}</p>
                      <p className="text-sm text-gray-600 mb-2">{center.city}, {center.state} {center.zipCode}</p>
                      <div className="flex items-center gap-2 text-xs text-gray-600">
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
                <div className="bg-white rounded-lg mb-6 overflow-hidden relative" style={{ height: '350px' }}>
                  <div className="absolute inset-0 bg-gradient-to-br from-white to-gray-50">
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
                        <div className="absolute left-[10%] top-0 bottom-0 w-[1px] bg-gray-600"></div>
                        <div className="absolute left-[30%] top-0 bottom-0 w-[2px] bg-gray-600"></div>
                        <div className="absolute left-[70%] top-0 bottom-0 w-[1px] bg-gray-600"></div>
                        <div className="absolute top-[25%] left-0 right-0 h-[1px] bg-gray-600"></div>
                        <div className="absolute top-[50%] left-0 right-0 h-[2px] bg-gray-600"></div>
                        <div className="absolute top-[75%] left-0 right-0 h-[1px] bg-gray-600"></div>
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
                                <p className="text-black">Finding blood donation centers near you...</p>
                              </div>
                            ) : (
                              <>
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-red-500 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                                <p className="text-black font-medium mb-2">No blood donation centers found yet</p>
                                <p className="text-xs text-gray-700">
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
                  <Card className="border border-gray-100 shadow-md overflow-hidden">
                    <div className="h-2 bg-red-600"></div>
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
                  <Card className="border border-gray-100 shadow-md overflow-hidden">
                    <div className="h-2 bg-red-600"></div>
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
    </div>
  );
} 