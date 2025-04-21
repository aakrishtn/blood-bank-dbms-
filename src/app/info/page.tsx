"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function BloodInfoPage() {
  return (
    <div className="bg-white">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-3xl mx-auto text-center mb-12">
          <h1 className="text-3xl font-bold mb-4 text-gray-900">Blood Group <span className="text-red-600">Compatibility</span></h1>
          <p className="text-gray-800">Understanding blood type compatibility is critical for successful transfusions.</p>
        </div>

        {/* Blood Compatibility Table */}
        <div className="rounded-xl overflow-hidden shadow-lg border border-gray-100 bg-white mb-16 max-w-4xl mx-auto">
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-6 py-3 text-left text-sm font-semibold text-red-600 border-b">Blood Type</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-red-600 border-b">Can Donate To</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-red-600 border-b">Can Receive From</th>
                </tr>
              </thead>
              <tbody>
                <tr className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-bold text-red-600 border-b">A+</td>
                  <td className="px-6 py-4 text-sm text-gray-800 border-b">A+, AB+</td>
                  <td className="px-6 py-4 text-sm text-gray-800 border-b">A+, A-, O+, O-</td>
                </tr>
                <tr className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-bold text-red-600 border-b">A-</td>
                  <td className="px-6 py-4 text-sm text-gray-800 border-b">A+, A-, AB+, AB-</td>
                  <td className="px-6 py-4 text-sm text-gray-800 border-b">A-, O-</td>
                </tr>
                <tr className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-bold text-red-600 border-b">B+</td>
                  <td className="px-6 py-4 text-sm text-gray-800 border-b">B+, AB+</td>
                  <td className="px-6 py-4 text-sm text-gray-800 border-b">B+, B-, O+, O-</td>
                </tr>
                <tr className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-bold text-red-600 border-b">B-</td>
                  <td className="px-6 py-4 text-sm text-gray-800 border-b">B+, B-, AB+, AB-</td>
                  <td className="px-6 py-4 text-sm text-gray-800 border-b">B-, O-</td>
                </tr>
                <tr className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-bold text-red-600 border-b">AB+</td>
                  <td className="px-6 py-4 text-sm text-gray-800 border-b">AB+ only</td>
                  <td className="px-6 py-4 text-sm text-gray-800 border-b">Anyone (Universal recipient)</td>
                </tr>
                <tr className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-bold text-red-600 border-b">AB-</td>
                  <td className="px-6 py-4 text-sm text-gray-800 border-b">AB+, AB-</td>
                  <td className="px-6 py-4 text-sm text-gray-800 border-b">A-, B-, AB-, O-</td>
                </tr>
                <tr className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-bold text-red-600 border-b">O+</td>
                  <td className="px-6 py-4 text-sm text-gray-800 border-b">A+, B+, AB+, O+</td>
                  <td className="px-6 py-4 text-sm text-gray-800 border-b">O+, O-</td>
                </tr>
                <tr className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-bold text-red-600 border-b">O-</td>
                  <td className="px-6 py-4 text-sm text-gray-800 border-b">Everyone (Universal donor)</td>
                  <td className="px-6 py-4 text-sm text-gray-800 border-b">O- only</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Information cards - similar to home page cards */}
        <div className="py-10">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <h2 className="text-3xl font-bold mb-4 text-gray-900">Donation <span className="text-red-600">Information</span></h2>
            <p className="text-gray-600">Learn what you need to know about blood donation.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Donor Eligibility Card */}
            <Card className="border border-gray-100 shadow-md hover:shadow-xl transition-shadow duration-300 overflow-hidden">
              <div className="h-2 bg-red-600"></div>
              <div className="p-6">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <h3 className="font-bold text-xl text-red-600 mb-2">Donor Eligibility</h3>
                <p className="text-gray-600 mb-2">Basic requirements for donating blood</p>
                <CardContent className="p-0">
                  <p className="text-gray-800 mb-6">
                    Must be at least 17 years old, weigh at least 110 pounds, and be in good general health to donate blood.
                  </p>
                </CardContent>
                <Link href="/donor/register" className="w-full">
                  <Button variant="redOutline" className="w-full">Check Eligibility</Button>
                </Link>
              </div>
            </Card>
            
            {/* Before Donation Card */}
            <Card className="border border-gray-100 shadow-md hover:shadow-xl transition-shadow duration-300 overflow-hidden">
              <div className="h-2 bg-red-600"></div>
              <div className="p-6">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                  </svg>
                </div>
                <h3 className="font-bold text-xl text-red-600 mb-2">Before Donation</h3>
                <p className="text-gray-600 mb-2">How to prepare for your donation</p>
                <CardContent className="p-0">
                  <p className="text-gray-800 mb-6">
                    Eat iron-rich foods, stay hydrated, get adequate rest, and avoid strenuous activities before donation.
                  </p>
                </CardContent>
                <Link href="/appointments" className="w-full">
                  <Button variant="redOutline" className="w-full">Schedule Appointment</Button>
                </Link>
              </div>
            </Card>
            
            {/* After Donation Card */}
            <Card className="border border-gray-100 shadow-md hover:shadow-xl transition-shadow duration-300 overflow-hidden">
              <div className="h-2 bg-red-600"></div>
              <div className="p-6">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                </div>
                <h3 className="font-bold text-xl text-red-600 mb-2">After Donation</h3>
                <p className="text-gray-600 mb-2">Post-donation care instructions</p>
                <CardContent className="p-0">
                  <p className="text-gray-800 mb-6">
                    Rest, hydrate well, avoid strenuous activities for 24 hours, and eat iron-rich foods after donation.
                  </p>
                </CardContent>
                <Link href="/blood-centers" className="w-full">
                  <Button variant="redOutline" className="w-full">Find Donation Centers</Button>
                </Link>
              </div>
            </Card>
          </div>
        </div>

        {/* Call to action section */}
        <div className="text-center mt-12 mb-8">
          <p className="text-gray-600 mb-6 text-lg">Ready to donate blood and help save lives?</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/appointments">
              <Button variant="red" className="px-6 py-3 text-lg rounded-lg shadow-md">
                Schedule an Appointment
              </Button>
            </Link>
            <Link href="/blood-centers">
              <Button variant="redOutline" className="px-6 py-3 text-lg rounded-lg">
                Find a Donation Center
              </Button>
            </Link>
          </div>
        </div>

        {/* Did You Know section */}
        <div className="mt-8 bg-red-50 p-6 rounded-lg border border-red-100 max-w-2xl mx-auto">
          <div className="flex items-center gap-3 text-red-800 mb-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="font-medium">Did You Know?</span>
          </div>
          <p className="text-sm text-red-700">
            One donation can save up to three lives. The average adult has about 10 pints of blood in their body, and roughly 1 pint is given during a donation.
          </p>
        </div>
      </div>
    </div>
  );
} 