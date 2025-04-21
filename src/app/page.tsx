import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

export default function Home() {
  return (
    <div>
      <section className="bg-gradient-to-b from-white to-rose-50 py-20">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl font-bold mb-4 leading-tight text-gray-900">Every Drop Counts: <span className="text-red-600">Donate Blood</span>, Save Lives</h2>
              <p className="text-lg text-gray-600 mb-8 leading-relaxed">
                Your blood donation is a lifeline for those in need. A single donation can save up to three lives. Join our community of heroes making a difference every day.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link href="/donor/register">
                  <Button variant="red" size="lg">
                    Become a Donor
                  </Button>
                </Link>
                <Link href="/receiver/register">
                  <Button variant="redOutline" size="lg">
                    Request Blood
                  </Button>
                </Link>
              </div>
            </div>
            <div className="rounded-2xl overflow-hidden shadow-2xl relative h-[300px]">
        <Image
                src="/images/blood-donation.jpg" 
                alt="Blood Donation" 
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-cover"
          priority
        />
            </div>
          </div>
        </div>
      </section>
      
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <h2 className="text-3xl font-bold mb-4 text-gray-900">Our Services</h2>
            <p className="text-gray-600">We&apos;re here to serve you 24/7 with our blood banking services.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="border border-gray-100 shadow-md hover:shadow-xl transition-shadow duration-300 overflow-hidden">
              <div className="h-2 bg-red-600"></div>
              <CardHeader>
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                  </svg>
                </div>
                <CardTitle className="font-bold text-xl text-red-600">Blood Donation</CardTitle>
                <CardDescription className="text-gray-600">
                  Become a hero by donating blood
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-gray-800">
                  Our state-of-the-art facilities make blood donation safe, 
                  quick, and comfortable. Your donation can save lives.
                </p>
              </CardContent>
              <CardFooter className="bg-gray-50">
                <Link href="/donor/register" className="w-full">
                  <Button variant="redOutline" className="w-full">Donate Now</Button>
                </Link>
              </CardFooter>
            </Card>
            
            <Card className="border border-gray-100 shadow-md hover:shadow-xl transition-shadow duration-300 overflow-hidden">
              <div className="h-2 bg-red-600"></div>
              <CardHeader>
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <CardTitle className="font-bold text-xl text-red-600">Blood Request</CardTitle>
                <CardDescription className="text-gray-600">
                  Find blood donors matching your requirements
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-gray-800">
                  Our extensive database helps match blood recipients with
                  suitable donors quickly during emergencies.
                </p>
              </CardContent>
              <CardFooter className="bg-gray-50">
                <Link href="/receiver/register" className="w-full">
                  <Button variant="redOutline" className="w-full">Request Blood</Button>
                </Link>
              </CardFooter>
            </Card>
            
            <Card className="border border-gray-100 shadow-md hover:shadow-xl transition-shadow duration-300 overflow-hidden">
              <div className="h-2 bg-red-600"></div>
              <CardHeader>
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <CardTitle className="font-bold text-xl text-red-600">Blood Banks</CardTitle>
                <CardDescription className="text-gray-600">
                  Partner with hospitals across the country
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-gray-800">
                  We partner with hospitals to ensure blood supply 
                  is available where and when it&apos;s needed most.
                </p>
              </CardContent>
              <CardFooter className="bg-gray-50">
                <Link href="/hospitals" className="w-full">
                  <Button variant="redOutline" className="w-full">Find Hospitals</Button>
                </Link>
              </CardFooter>
            </Card>
          </div>
        </div>
      </section>
      

    </div>
  );
}
