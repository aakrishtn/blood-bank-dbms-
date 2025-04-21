"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { Button } from "./button";
import { signOut, getCurrentUser } from "@/lib/auth";
import { Transition } from '@headlessui/react';

export function Header() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 10) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Check authentication status
  useEffect(() => {
    const checkAuth = async () => {
      try {
        setIsLoading(true);
        const user = await getCurrentUser();
        if (user) {
          setIsLoggedIn(true);
          setUserRole(user.user_metadata?.role || null);
        } else {
          setIsLoggedIn(false);
          setUserRole(null);
        }
      } catch (error) {
        console.error("Error checking auth:", error);
        setIsLoggedIn(false);
        setUserRole(null);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [pathname]);

  const handleSignOut = async () => {
    try {
      await signOut();
      setIsLoggedIn(false);
      setUserRole(null);
      router.push("/");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  return (
    <header 
      className={`sticky top-0 z-50 transition-all duration-300 ${
        isScrolled 
          ? "bg-white/95 backdrop-blur-md shadow-md" 
          : "bg-white"
      }`}
    >
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="h-10 w-10 rounded-full bg-red-100 p-1.5 overflow-hidden transition-transform duration-500 group-hover:scale-110">
            <div className="h-full w-full rounded-full bg-gradient-to-br from-red-500 to-red-600 animate-pulse-slow relative">
              <span className="absolute inset-0 rounded-full bg-white/10 animate-ping"></span>
            </div>
          </div>
          <span className="text-2xl font-bold text-gray-900 transition-all duration-300">
            Blood<span className="text-red-600 relative">
              Bank
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-red-500 group-hover:w-full transition-all duration-300"></span>
            </span>
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-6">
          {!isLoading && (
            <>
              <Link 
                href="/" 
                className={`text-sm font-medium relative ${
                  pathname === '/' 
                    ? 'text-red-600 font-semibold' 
                    : 'text-gray-800 hover:text-red-600'
                } transition-colors`}
              >
                Home
                {pathname === '/' && (
                  <span className="absolute -bottom-1 left-0 w-full h-0.5 bg-red-500"></span>
                )}
              </Link>
              
              <Link 
                href="/blood-centers" 
                className={`text-sm font-medium relative ${
                  pathname === '/blood-centers' 
                    ? 'text-red-600 font-semibold' 
                    : 'text-gray-800 hover:text-red-600'
                } transition-colors`}
              >
                Blood Centers
                {pathname === '/blood-centers' && (
                  <span className="absolute -bottom-1 left-0 w-full h-0.5 bg-red-500"></span>
                )}
              </Link>
              
              <Link 
                href="/info" 
                className={`text-sm font-medium relative ${
                  pathname === '/info' 
                    ? 'text-red-600 font-semibold' 
                    : 'text-gray-800 hover:text-red-600'
                } transition-colors`}
              >
                Blood Info
                {pathname === '/info' && (
                  <span className="absolute -bottom-1 left-0 w-full h-0.5 bg-red-500"></span>
                )}
              </Link>
              
              {isLoggedIn ? (
                <>
                  <Link 
                    href="/dashboard" 
                    className={`text-sm font-medium relative ${
                      pathname === '/dashboard' 
                        ? 'text-red-600 font-semibold' 
                        : 'text-gray-800 hover:text-red-600'
                    } transition-colors`}
                  >
                    Dashboard
                    {pathname === '/dashboard' && (
                      <span className="absolute -bottom-1 left-0 w-full h-0.5 bg-red-500"></span>
                    )}
                  </Link>
                  
                  {userRole === 'donor' && (
                    <Link 
                      href="/appointments" 
                      className={`text-sm font-medium relative ${
                        pathname === '/appointments' 
                          ? 'text-red-600 font-semibold' 
                          : 'text-gray-800 hover:text-red-600'
                      } transition-colors`}
                    >
                      My Appointments
                      {pathname === '/appointments' && (
                        <span className="absolute -bottom-1 left-0 w-full h-0.5 bg-red-500"></span>
                      )}
                    </Link>
                  )}
                  
                  <Button 
                    variant="redOutline" 
                    size="sm"
                    onClick={handleSignOut}
                  >
                    <span className="mr-1 flex items-center gap-1">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      Sign Out
                    </span>
                  </Button>
                </>
              ) : (
                <div className="flex items-center gap-3">
                  <Link href="/login">
                    <Button 
                      variant="ghost" 
                      size="sm"
                      className="text-gray-700 hover:text-red-600 font-medium hover:bg-red-50 transition-all"
                    >
                      Login
                    </Button>
                  </Link>
                  <Link href="/register">
                    <Button 
                      variant="red"
                      size="sm"
                    >
                      Register
                    </Button>
                  </Link>
                </div>
              )}
            </>
          )}
          
          {isLoading && (
            <div className="flex items-center gap-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-3 bg-gray-200 rounded animate-pulse w-16"></div>
              ))}
            </div>
          )}
        </nav>

        {/* Mobile menu button */}
        <button
          className="md:hidden p-2 rounded-md text-gray-600 hover:bg-red-50 transition-colors"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          aria-expanded={isMenuOpen}
          aria-label="Toggle menu"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            {isMenuOpen ? (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            ) : (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            )}
          </svg>
        </button>
      </div>

      {/* Mobile menu with animation */}
      <Transition
        show={isMenuOpen}
        enter="transition duration-200 ease-out"
        enterFrom="opacity-0 -translate-y-2"
        enterTo="opacity-100 translate-y-0"
        leave="transition duration-150 ease-in"
        leaveFrom="opacity-100 translate-y-0"
        leaveTo="opacity-0 -translate-y-2"
      >
        <div className="md:hidden bg-white border-t border-gray-100 py-2 shadow-lg">
          <div className="container mx-auto px-4 flex flex-col gap-2">
            {!isLoading ? (
              <>
                <div className="px-4 space-y-1 pt-3">
                  <Link 
                    href="/" 
                    className={`block px-3 py-2 rounded-md text-base font-medium ${
                      pathname === '/' 
                        ? 'bg-red-50 text-red-700 font-semibold' 
                        : 'text-gray-800 hover:bg-red-50 hover:text-red-600'
                    }`}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Home
                  </Link>

                  <Link 
                    href="/blood-centers" 
                    className={`block px-3 py-2 rounded-md text-base font-medium ${
                      pathname === '/blood-centers' 
                        ? 'bg-red-50 text-red-700 font-semibold' 
                        : 'text-gray-800 hover:bg-red-50 hover:text-red-600'
                    }`}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Blood Centers
                  </Link>

                  <Link 
                    href="/info" 
                    className={`block px-3 py-2 rounded-md text-base font-medium ${
                      pathname === '/info' 
                        ? 'bg-red-50 text-red-700 font-semibold' 
                        : 'text-gray-800 hover:bg-red-50 hover:text-red-600'
                    }`}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Blood Info
                  </Link>

                  {isLoggedIn ? (
                    <>
                      <Link 
                        href="/dashboard" 
                        className={`block px-3 py-2 rounded-md text-base font-medium ${
                          pathname === '/dashboard' 
                            ? 'bg-red-50 text-red-700 font-semibold' 
                            : 'text-gray-800 hover:bg-red-50 hover:text-red-600'
                        }`}
                        onClick={() => setIsMenuOpen(false)}
                      >
                        Dashboard
                      </Link>

                      {userRole === 'donor' && (
                        <Link 
                          href="/appointments" 
                          className={`block px-3 py-2 rounded-md text-base font-medium ${
                            pathname === '/appointments' 
                              ? 'bg-red-50 text-red-700 font-semibold' 
                              : 'text-gray-800 hover:bg-red-50 hover:text-red-600'
                          }`}
                          onClick={() => setIsMenuOpen(false)}
                        >
                          My Appointments
                        </Link>
                      )}

                      <button 
                        className="mt-2 w-full px-3 py-2 border border-red-300 text-red-700 bg-white hover:bg-red-50 rounded-md text-base font-medium transition-colors flex items-center justify-center"
                        onClick={() => {
                          setIsMenuOpen(false);
                          handleSignOut();
                        }}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        Sign Out
                      </button>
                    </>
                  ) : (
                    <div className="pt-2 pb-3 space-y-3">
                      <Link 
                        href="/login" 
                        className="block px-3 py-2 border border-transparent text-gray-800 hover:bg-red-50 hover:text-red-600 rounded-md text-base font-medium"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        Login
                      </Link>
                      <Link 
                        href="/register" 
                        className="block px-3 py-2 bg-red-700 hover:bg-red-800 text-white rounded-md text-base font-medium shadow-md"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        Register
                      </Link>
                    </div>
                  )}
                </div>
              </>
            ) : (
              // Loading skeleton for mobile menu
              <div className="space-y-2 py-2">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-10 bg-gray-100 rounded animate-pulse"></div>
                ))}
              </div>
            )}
          </div>
        </div>
      </Transition>
    </header>
  );
} 