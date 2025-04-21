"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion } from "framer-motion";

export default function BloodInfoPage() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-7xl">
      <div className="mb-12 text-center">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Blood Donation Information</h1>
          <div className="w-24 h-1 bg-red-500 mx-auto rounded-full mb-6"></div>
          <p className="text-gray-600 max-w-2xl mx-auto text-lg">
            Learn about blood types, donor eligibility, and how to prepare for your donation.
          </p>
        </motion.div>
      </div>
      
      <Tabs defaultValue="blood-types" className="max-w-5xl mx-auto">
        <TabsList className="grid w-full grid-cols-3 mb-10 p-1 bg-gray-50 rounded-lg border">
          <TabsTrigger 
            value="blood-types" 
            className="rounded-md py-3 data-[state=active]:bg-white data-[state=active]:text-red-600 data-[state=active]:shadow-sm transition-all duration-200"
          >
            <div className="flex flex-col sm:flex-row items-center gap-2">
              <div className="h-6 w-6 rounded-full bg-red-100 flex items-center justify-center text-red-600">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                </svg>
              </div>
              <span>Blood Type Compatibility</span>
            </div>
          </TabsTrigger>
          
          <TabsTrigger 
            value="eligibility" 
            className="rounded-md py-3 data-[state=active]:bg-white data-[state=active]:text-red-600 data-[state=active]:shadow-sm transition-all duration-200"
          >
            <div className="flex flex-col sm:flex-row items-center gap-2">
              <div className="h-6 w-6 rounded-full bg-red-100 flex items-center justify-center text-red-600">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <span>Donor Eligibility</span>
            </div>
          </TabsTrigger>
          
          <TabsTrigger 
            value="donation-care" 
            className="rounded-md py-3 data-[state=active]:bg-white data-[state=active]:text-red-600 data-[state=active]:shadow-sm transition-all duration-200"
          >
            <div className="flex flex-col sm:flex-row items-center gap-2">
              <div className="h-6 w-6 rounded-full bg-red-100 flex items-center justify-center text-red-600">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
              <span>Pre & Post Donation Care</span>
            </div>
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="blood-types">
          <Card className="border-0 shadow-lg rounded-xl overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-red-50 to-white border-b">
              <CardTitle className="text-xl text-red-800">Blood Type Compatibility</CardTitle>
              <CardDescription className="text-red-600/80">
                Understanding blood type compatibility is critical for successful transfusions.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-6">
                {/* Blood type chart */}
                <div className="overflow-x-auto">
                  <table className="min-w-full border-collapse">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 border">Blood Type</th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 border">Can Donate To</th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 border">Can Receive From</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="hover:bg-gray-50">
                        <td className="px-6 py-4 text-sm font-bold text-red-600 border">A+</td>
                        <td className="px-6 py-4 text-sm text-gray-700 border">A+, AB+</td>
                        <td className="px-6 py-4 text-sm text-gray-700 border">A+, A-, O+, O-</td>
                      </tr>
                      <tr className="hover:bg-gray-50">
                        <td className="px-6 py-4 text-sm font-bold text-red-600 border">A-</td>
                        <td className="px-6 py-4 text-sm text-gray-700 border">A+, A-, AB+, AB-</td>
                        <td className="px-6 py-4 text-sm text-gray-700 border">A-, O-</td>
                      </tr>
                      <tr className="hover:bg-gray-50">
                        <td className="px-6 py-4 text-sm font-bold text-red-600 border">B+</td>
                        <td className="px-6 py-4 text-sm text-gray-700 border">B+, AB+</td>
                        <td className="px-6 py-4 text-sm text-gray-700 border">B+, B-, O+, O-</td>
                      </tr>
                      <tr className="hover:bg-gray-50">
                        <td className="px-6 py-4 text-sm font-bold text-red-600 border">B-</td>
                        <td className="px-6 py-4 text-sm text-gray-700 border">B+, B-, AB+, AB-</td>
                        <td className="px-6 py-4 text-sm text-gray-700 border">B-, O-</td>
                      </tr>
                      <tr className="hover:bg-gray-50">
                        <td className="px-6 py-4 text-sm font-bold text-red-600 border">AB+</td>
                        <td className="px-6 py-4 text-sm text-gray-700 border">AB+ only</td>
                        <td className="px-6 py-4 text-sm text-gray-700 border">All blood types</td>
                      </tr>
                      <tr className="hover:bg-gray-50">
                        <td className="px-6 py-4 text-sm font-bold text-red-600 border">AB-</td>
                        <td className="px-6 py-4 text-sm text-gray-700 border">AB+, AB-</td>
                        <td className="px-6 py-4 text-sm text-gray-700 border">A-, B-, AB-, O-</td>
                      </tr>
                      <tr className="hover:bg-gray-50">
                        <td className="px-6 py-4 text-sm font-bold text-red-600 border">O+</td>
                        <td className="px-6 py-4 text-sm text-gray-700 border">A+, B+, AB+, O+</td>
                        <td className="px-6 py-4 text-sm text-gray-700 border">O+, O-</td>
                      </tr>
                      <tr className="hover:bg-gray-50">
                        <td className="px-6 py-4 text-sm font-bold text-red-600 border">O-</td>
                        <td className="px-6 py-4 text-sm text-gray-700 border">All blood types</td>
                        <td className="px-6 py-4 text-sm text-gray-700 border">O- only</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
                  <div className="space-y-3">
                    <h3 className="text-lg font-semibold text-gray-900">Understanding Blood Types</h3>
                    <p className="text-gray-700">
                      Blood types are determined by the presence or absence of certain antigens on the surface of red blood cells.
                      The two main classification systems are ABO (A, B, AB, O) and Rh factor (positive or negative).
                    </p>
                    <p className="text-gray-700">
                      When receiving blood, you must receive a compatible blood type to prevent potentially life-threatening reactions.
                    </p>
                  </div>
                  
                  <div className="space-y-3">
                    <h3 className="text-lg font-semibold text-gray-900">Important Notes</h3>
                    <ul className="list-disc pl-5 space-y-2 text-gray-700">
                      <li>O- blood donors are considered &quot;universal donors&quot; as their blood can be given to any recipient.</li>
                      <li>AB+ blood recipients are considered &quot;universal recipients&quot; as they can receive blood from any donor.</li>
                      <li>The most common blood type is O+, while AB- is the rarest.</li>
                      <li>In emergency situations where a patient&apos;s blood type is unknown, O- blood is often used.</li>
                    </ul>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="eligibility">
          <Card className="border-0 shadow-lg rounded-xl overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-green-50 to-white border-b">
              <CardTitle className="text-xl text-green-800">Donor Eligibility Guidelines</CardTitle>
              <CardDescription className="text-green-600/80">
                Basic requirements and eligibility criteria for donating blood.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="border rounded-lg overflow-hidden">
                    <div className="bg-green-50 p-4 border-b border-green-100">
                      <h3 className="text-lg font-semibold text-green-800">Basic Requirements</h3>
                    </div>
                    <div className="p-4 space-y-3">
                      <div className="flex items-start gap-3">
                        <div className="h-6 w-6 rounded-full bg-green-100 flex-shrink-0 flex items-center justify-center">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">Age</p>
                          <p className="text-sm text-gray-700">Must be at least 17 years old (16 with parental consent in some states)</p>
                        </div>
                      </div>
                      
                      <div className="flex items-start gap-3">
                        <div className="h-6 w-6 rounded-full bg-green-100 flex-shrink-0 flex items-center justify-center">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">Weight</p>
                          <p className="text-sm text-gray-700">Must weigh at least 110 pounds (50 kg)</p>
                        </div>
                      </div>
                      
                      <div className="flex items-start gap-3">
                        <div className="h-6 w-6 rounded-full bg-green-100 flex-shrink-0 flex items-center justify-center">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">Health</p>
                          <p className="text-sm text-gray-700">Must be in good general health and feeling well on donation day</p>
                        </div>
                      </div>
                      
                      <div className="flex items-start gap-3">
                        <div className="h-6 w-6 rounded-full bg-green-100 flex-shrink-0 flex items-center justify-center">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">Time</p>
                          <p className="text-sm text-gray-700">Whole blood donation takes about 1 hour from registration to refreshments</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="border rounded-lg overflow-hidden">
                    <div className="bg-red-50 p-4 border-b border-red-100">
                      <h3 className="text-lg font-semibold text-red-800">Temporary Deferrals</h3>
                    </div>
                    <div className="p-4 space-y-3">
                      <div className="flex items-start gap-3">
                        <div className="h-6 w-6 rounded-full bg-red-100 flex-shrink-0 flex items-center justify-center">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">Recent Illness</p>
                          <p className="text-sm text-gray-700">Must be symptom-free from cold, flu, or fever on donation day</p>
                        </div>
                      </div>
                      
                      <div className="flex items-start gap-3">
                        <div className="h-6 w-6 rounded-full bg-red-100 flex-shrink-0 flex items-center justify-center">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">Recent Travel</p>
                          <p className="text-sm text-gray-700">Travel to certain countries may result in a temporary deferral</p>
                        </div>
                      </div>
                      
                      <div className="flex items-start gap-3">
                        <div className="h-6 w-6 rounded-full bg-red-100 flex-shrink-0 flex items-center justify-center">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">Pregnancy</p>
                          <p className="text-sm text-gray-700">Must wait 6 weeks after giving birth before donating</p>
                        </div>
                      </div>
                      
                      <div className="flex items-start gap-3">
                        <div className="h-6 w-6 rounded-full bg-red-100 flex-shrink-0 flex items-center justify-center">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">Low Iron Levels</p>
                          <p className="text-sm text-gray-700">Hemoglobin levels must meet minimum requirements</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
                  <h3 className="text-lg font-semibold text-blue-800 mb-3">Before You Donate</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <h4 className="font-medium text-blue-700">Valid ID Required</h4>
                      <p className="text-sm text-blue-700">
                        Bring a driver&apos;s license, passport, or other government-issued ID.
                      </p>
                    </div>
                    <div className="space-y-2">
                      <h4 className="font-medium text-blue-700">Medication Review</h4>
                      <p className="text-sm text-blue-700">
                        Some medications may affect your eligibility to donate.
                      </p>
                    </div>
                    <div className="space-y-2">
                      <h4 className="font-medium text-blue-700">Medical History</h4>
                      <p className="text-sm text-blue-700">
                        A brief health screening will be conducted before donation.
                      </p>
                    </div>
                    <div className="space-y-2">
                      <h4 className="font-medium text-blue-700">Waiting Periods</h4>
                      <p className="text-sm text-blue-700">
                        56 days between whole blood donations; 112 days for double red cell donations.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="donation-care">
          <Card className="border-0 shadow-lg rounded-xl overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-amber-50 to-white border-b">
              <CardTitle className="text-xl text-amber-800">Pre & Post Donation Care</CardTitle>
              <CardDescription className="text-amber-600/80">
                How to prepare for your donation and take care of yourself afterward.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-8">
                {/* Before donation */}
                <div className="rounded-lg overflow-hidden border">
                  <div className="bg-amber-50 p-4 border-b border-amber-100">
                    <h3 className="text-lg font-semibold text-amber-800">Before Your Donation</h3>
                  </div>
                  <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div className="flex items-start gap-3">
                          <div className="h-8 w-8 rounded-full bg-amber-100 flex-shrink-0 flex items-center justify-center">
                            <span className="font-semibold text-amber-800">1</span>
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">Get a good night&apos;s sleep</p>
                            <p className="text-sm text-gray-700">
                              Aim for 7-8 hours of sleep the night before your donation to ensure you&apos;re well-rested.
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-start gap-3">
                          <div className="h-8 w-8 rounded-full bg-amber-100 flex-shrink-0 flex items-center justify-center">
                            <span className="font-semibold text-amber-800">2</span>
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">Eat a healthy meal</p>
                            <p className="text-sm text-gray-700">
                              Have a nutritious meal 2-3 hours before donating. Avoid fatty foods like hamburgers, fries, or ice cream.
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-start gap-3">
                          <div className="h-8 w-8 rounded-full bg-amber-100 flex-shrink-0 flex items-center justify-center">
                            <span className="font-semibold text-amber-800">3</span>
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">Stay hydrated</p>
                            <p className="text-sm text-gray-700">
                              Drink an extra 16 oz of water before your appointment. Well-hydrated veins are easier to access.
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="space-y-4">
                        <div className="flex items-start gap-3">
                          <div className="h-8 w-8 rounded-full bg-amber-100 flex-shrink-0 flex items-center justify-center">
                            <span className="font-semibold text-amber-800">4</span>
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">Wear comfortable clothing</p>
                            <p className="text-sm text-gray-700">
                              Wear a shirt with sleeves that can be rolled up above the elbow.
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-start gap-3">
                          <div className="h-8 w-8 rounded-full bg-amber-100 flex-shrink-0 flex items-center justify-center">
                            <span className="font-semibold text-amber-800">5</span>
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">Bring ID</p>
                            <p className="text-sm text-gray-700">
                              Don&apos;t forget to bring your donor card, driver&apos;s license, or two other forms of identification.
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-start gap-3">
                          <div className="h-8 w-8 rounded-full bg-amber-100 flex-shrink-0 flex items-center justify-center">
                            <span className="font-semibold text-amber-800">6</span>
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">Avoid strenuous activities</p>
                            <p className="text-sm text-gray-700">
                              Don&apos;t do heavy lifting or vigorous exercise the day of your donation.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* After donation */}
                <div className="rounded-lg overflow-hidden border">
                  <div className="bg-indigo-50 p-4 border-b border-indigo-100">
                    <h3 className="text-lg font-semibold text-indigo-800">After Your Donation</h3>
                  </div>
                  <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div className="flex items-start gap-3">
                          <div className="h-8 w-8 rounded-full bg-indigo-100 flex-shrink-0 flex items-center justify-center">
                            <span className="font-semibold text-indigo-800">1</span>
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">Hydrate and refuel</p>
                            <p className="text-sm text-gray-700">
                              Drink extra fluids and enjoy a snack at the donation center before leaving.
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-start gap-3">
                          <div className="h-8 w-8 rounded-full bg-indigo-100 flex-shrink-0 flex items-center justify-center">
                            <span className="font-semibold text-indigo-800">2</span>
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">Keep the bandage on</p>
                            <p className="text-sm text-gray-700">
                              Leave your bandage on for at least 4-5 hours after donation.
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-start gap-3">
                          <div className="h-8 w-8 rounded-full bg-indigo-100 flex-shrink-0 flex items-center justify-center">
                            <span className="font-semibold text-indigo-800">3</span>
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">Rest if needed</p>
                            <p className="text-sm text-gray-700">
                              If you feel lightheaded, lie down with your feet elevated until the feeling passes.
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="space-y-4">
                        <div className="flex items-start gap-3">
                          <div className="h-8 w-8 rounded-full bg-indigo-100 flex-shrink-0 flex items-center justify-center">
                            <span className="font-semibold text-indigo-800">4</span>
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">Avoid strenuous activities</p>
                            <p className="text-sm text-gray-700">
                              Avoid heavy lifting or vigorous exercise for 24 hours after donation.
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-start gap-3">
                          <div className="h-8 w-8 rounded-full bg-indigo-100 flex-shrink-0 flex items-center justify-center">
                            <span className="font-semibold text-indigo-800">5</span>
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">Eat iron-rich foods</p>
                            <p className="text-sm text-gray-700">
                              Include iron-rich foods in your diet like red meat, spinach, and beans to help replace iron stores.
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-start gap-3">
                          <div className="h-8 w-8 rounded-full bg-indigo-100 flex-shrink-0 flex items-center justify-center">
                            <span className="font-semibold text-indigo-800">6</span>
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">Call if concerns arise</p>
                            <p className="text-sm text-gray-700">
                              If you experience unusual symptoms after donating, contact the blood center immediately.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="text-center">
                  <p className="text-gray-600 mb-6 text-lg">Ready to donate blood and help save lives?</p>
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Button 
                        onClick={() => window.location.href = "/appointments"} 
                        className="bg-red-600 hover:bg-red-700 text-white btn-hover-effect px-6 py-6 text-lg rounded-xl shadow-md"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        Schedule an Appointment
                      </Button>
                    </motion.div>
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Button 
                        onClick={() => window.location.href = "/blood-centers"}
                        variant="outline" 
                        className="border-2 border-red-200 text-red-600 hover:bg-red-50 px-6 py-6 text-lg rounded-xl"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        Find a Donation Center
                      </Button>
                    </motion.div>
                  </div>
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
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 