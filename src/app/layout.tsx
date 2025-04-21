import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Link from "next/link";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { Header } from "@/components/ui/header";

const inter = Inter({ 
  subsets: ["latin"],
  weight: ['300', '400', '500', '600', '700'],
  display: 'swap',
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: "Blood Bank Management System",
  description: "A comprehensive system for managing blood bank operations",
};

function Footer() {
  return (
    <footer className="bg-gradient-to-b from-white to-gray-50 border-t border-gray-100 py-12 mt-auto">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-4 group">
              <div className="h-10 w-10 rounded-full bg-red-100 p-1.5 overflow-hidden transition-transform duration-500 group-hover:scale-110">
                <div className="h-full w-full rounded-full bg-gradient-to-br from-red-500 to-red-600 animate-pulse-slow relative">
                  <span className="absolute inset-0 rounded-full bg-white/10 animate-ping"></span>
                </div>
              </div>
              <span className="text-xl font-bold text-gray-900">
                Blood<span className="text-red-600 relative">Bank
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-red-500 group-hover:w-full transition-all duration-300"></span>
                </span>
              </span>
            </div>
            <p className="text-sm text-gray-500 mb-6 leading-relaxed">
              Connecting donors with recipients and hospitals to save lives through efficient blood donation management. Every donation makes a difference.
            </p>
            <div className="flex gap-3">
              <a href="#" className="h-9 w-9 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-red-100 hover:text-red-600 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M9 8h-3v4h3v12h5v-12h3.642l.358-4h-4v-1.667c0-.955.192-1.333 1.115-1.333h2.885v-5h-3.808c-3.596 0-5.192 1.583-5.192 4.615v3.385z"/>
                </svg>
              </a>
              <a href="#" className="h-9 w-9 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-red-100 hover:text-red-600 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/>
                </svg>
              </a>
              <a href="#" className="h-9 w-9 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-red-100 hover:text-red-600 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                </svg>
              </a>
            </div>
          </div>
          
          <div>
            <h3 className="font-semibold text-gray-900 mb-4 border-b pb-2 border-gray-100">Quick Links</h3>
            <ul className="space-y-3">
              <li>
                <Link href="/" className="text-sm text-gray-500 hover:text-red-600 transition-colors flex items-center gap-1.5 group">
                  <span className="h-1 w-1 rounded-full bg-gray-300 group-hover:bg-red-500 group-hover:w-2 transition-all duration-300"></span>
                  Home
                </Link>
              </li>
              <li>
                <Link href="/blood-centers" className="text-sm text-gray-500 hover:text-red-600 transition-colors flex items-center gap-1.5 group">
                  <span className="h-1 w-1 rounded-full bg-gray-300 group-hover:bg-red-500 group-hover:w-2 transition-all duration-300"></span>
                  Blood Centers
                </Link>
              </li>
              <li>
                <Link href="/info" className="text-sm text-gray-500 hover:text-red-600 transition-colors flex items-center gap-1.5 group">
                  <span className="h-1 w-1 rounded-full bg-gray-300 group-hover:bg-red-500 group-hover:w-2 transition-all duration-300"></span>
                  Blood Information
                </Link>
              </li>
              <li>
                <Link href="/dashboard" className="text-sm text-gray-500 hover:text-red-600 transition-colors flex items-center gap-1.5 group">
                  <span className="h-1 w-1 rounded-full bg-gray-300 group-hover:bg-red-500 group-hover:w-2 transition-all duration-300"></span>
                  Dashboard
                </Link>
              </li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-semibold text-gray-900 mb-4 border-b pb-2 border-gray-100">Services</h3>
            <ul className="space-y-3">
              <li>
                <Link href="/donor/register" className="text-sm text-gray-500 hover:text-red-600 transition-colors flex items-center gap-1.5 group">
                  <span className="h-1 w-1 rounded-full bg-gray-300 group-hover:bg-red-500 group-hover:w-2 transition-all duration-300"></span>
                  Donate Blood
                </Link>
              </li>
              <li>
                <Link href="/receiver/register" className="text-sm text-gray-500 hover:text-red-600 transition-colors flex items-center gap-1.5 group">
                  <span className="h-1 w-1 rounded-full bg-gray-300 group-hover:bg-red-500 group-hover:w-2 transition-all duration-300"></span>
                  Request Blood
                </Link>
              </li>
              <li>
                <Link href="/appointments" className="text-sm text-gray-500 hover:text-red-600 transition-colors flex items-center gap-1.5 group">
                  <span className="h-1 w-1 rounded-full bg-gray-300 group-hover:bg-red-500 group-hover:w-2 transition-all duration-300"></span>
                  Schedule Appointment
                </Link>
              </li>
              <li>
                <Link href="/hospital/register" className="text-sm text-gray-500 hover:text-red-600 transition-colors flex items-center gap-1.5 group">
                  <span className="h-1 w-1 rounded-full bg-gray-300 group-hover:bg-red-500 group-hover:w-2 transition-all duration-300"></span>
                  Hospital Services
                </Link>
              </li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-semibold text-gray-900 mb-4 border-b pb-2 border-gray-100">Contact</h3>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="h-6 w-6 rounded-full bg-red-50 flex-shrink-0 flex items-center justify-center text-red-500">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm text-gray-500">123 Blood Bank Street</p>
                  <p className="text-sm text-gray-500">City, State 12345</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="h-6 w-6 rounded-full bg-red-50 flex-shrink-0 flex items-center justify-center text-red-500">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                </div>
                <p className="text-sm text-gray-500">(123) 456-7890</p>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="h-6 w-6 rounded-full bg-red-50 flex-shrink-0 flex items-center justify-center text-red-500">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <p className="text-sm text-gray-500">info@bloodbanksystem.com</p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="border-t border-gray-100 mt-10 pt-6 text-center">
          <p className="text-sm text-gray-500">
            &copy; {new Date().getFullYear()} Blood Bank Management System. All rights reserved.
          </p>
          <div className="mt-3">
            <div className="flex justify-center gap-4 text-xs text-gray-400">
              <a href="#" className="hover:text-red-500 transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-red-500 transition-colors">Terms of Service</a>
              <a href="#" className="hover:text-red-500 transition-colors">Cookie Policy</a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable}>
      <body className={inter.className}>
        <div className="flex flex-col min-h-screen">
          <Header />
          <main className="flex-1">
        {children}
          </main>
          <Footer />
        </div>
        <Toaster />
      </body>
    </html>
  );
}
