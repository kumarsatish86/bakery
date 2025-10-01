'use client';

import { useState } from 'react';
import Link from 'next/link';

interface WebsiteLayoutProps {
  children: React.ReactNode;
}

export default function WebsiteLayout({ children }: WebsiteLayoutProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center">
              <Link href="/" className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-r from-orange-400 to-red-500 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-lg">B</span>
                </div>
                <span className="text-xl font-bold text-gray-900">SweetBakery</span>
              </Link>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex space-x-8">
              <Link href="/" className="text-gray-700 hover:text-orange-600 px-3 py-2 text-sm font-medium transition-colors">
                Home
              </Link>
              <Link href="/about" className="text-gray-700 hover:text-orange-600 px-3 py-2 text-sm font-medium transition-colors">
                About Us
              </Link>
              <Link href="/products" className="text-gray-700 hover:text-orange-600 px-3 py-2 text-sm font-medium transition-colors">
                Products
              </Link>
              <Link href="/gallery" className="text-gray-700 hover:text-orange-600 px-3 py-2 text-sm font-medium transition-colors">
                Gallery
              </Link>
              <Link href="/contact" className="text-gray-700 hover:text-orange-600 px-3 py-2 text-sm font-medium transition-colors">
                Contact
              </Link>
            </nav>

            {/* User Actions */}
            <div className="hidden md:flex items-center space-x-4">
              <Link href="/login" className="text-gray-700 hover:text-orange-600 px-3 py-2 text-sm font-medium transition-colors">
                Login
              </Link>
              <Link href="/register" className="bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-orange-700 transition-colors">
                Register
              </Link>
              <Link href="/cart" className="relative p-2 text-gray-700 hover:text-orange-600 transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5M7 13l2.5 5m6-5v6a2 2 0 01-2 2H9a2 2 0 01-2-2v-6m8 0V9a2 2 0 00-2-2H9a2 2 0 00-2 2v4.01" />
                </svg>
                <span className="absolute -top-1 -right-1 bg-orange-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  0
                </span>
              </Link>
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="text-gray-700 hover:text-orange-600 p-2"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden bg-white border-t border-gray-200">
            <div className="px-2 pt-2 pb-3 space-y-1">
              <Link href="/" className="block px-3 py-2 text-gray-700 hover:text-orange-600 text-base font-medium">
                Home
              </Link>
              <Link href="/about" className="block px-3 py-2 text-gray-700 hover:text-orange-600 text-base font-medium">
                About Us
              </Link>
              <Link href="/products" className="block px-3 py-2 text-gray-700 hover:text-orange-600 text-base font-medium">
                Products
              </Link>
              <Link href="/gallery" className="block px-3 py-2 text-gray-700 hover:text-orange-600 text-base font-medium">
                Gallery
              </Link>
              <Link href="/contact" className="block px-3 py-2 text-gray-700 hover:text-orange-600 text-base font-medium">
                Contact
              </Link>
              <div className="border-t border-gray-200 pt-2 mt-2">
                <Link href="/login" className="block px-3 py-2 text-gray-700 hover:text-orange-600 text-base font-medium">
                  Login
                </Link>
                <Link href="/register" className="block px-3 py-2 bg-orange-600 text-white rounded-lg mx-3 text-center text-base font-medium">
                  Register
                </Link>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-1">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Contact and Store Information */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Locate a store</h3>
              <Link href="/contact" className="text-orange-600 hover:text-orange-700 font-medium">
                Our Stores
              </Link>
            </div>
            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Write to us</h3>
              <a href="mailto:hello@sweetbakery.com" className="text-orange-600 hover:text-orange-700 font-medium">
                hello@sweetbakery.com
              </a>
            </div>
            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Get in touch with us</h3>
              <a href="tel:+919876543210" className="text-orange-600 hover:text-orange-700 font-medium">
                +91 98765 43210
              </a>
            </div>
          </div>

          <div className="border-t border-gray-200 pt-8 mb-8">
            {/* Legal and Policy Links */}
            <div className="flex flex-wrap justify-center gap-6 mb-8">
              <Link href="/privacy" className="text-gray-600 hover:text-gray-900 text-sm font-medium uppercase tracking-wide">
                Privacy Policy
              </Link>
              <Link href="/terms" className="text-gray-600 hover:text-gray-900 text-sm font-medium uppercase tracking-wide">
                Terms
              </Link>
              <Link href="/refund" className="text-gray-600 hover:text-gray-900 text-sm font-medium uppercase tracking-wide">
                Refund Policy
              </Link>
              <Link href="/shipping" className="text-gray-600 hover:text-gray-900 text-sm font-medium uppercase tracking-wide">
                Shipping Policy
              </Link>
            </div>

            {/* Newsletter Subscription */}
            <div className="text-center mb-8">
              <p className="text-gray-600 mb-4 max-w-2xl mx-auto">
                Sign up to our newsletter for exclusive access to new arrivals, style updates and seasonal sales.
              </p>
              <div className="max-w-md mx-auto flex gap-2">
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                />
                <button className="px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors font-medium">
                  SUBSCRIBE
                </button>
              </div>
            </div>

            {/* Social Media and Copyright */}
            <div className="text-center">
              <div className="flex justify-center gap-4 mb-6">
                <a href="#" className="w-10 h-10 bg-white border-2 border-gray-300 rounded-full flex items-center justify-center hover:border-orange-600 hover:text-orange-600 transition-colors">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/>
                  </svg>
                </a>
                <a href="#" className="w-10 h-10 bg-white border-2 border-gray-300 rounded-full flex items-center justify-center hover:border-orange-600 hover:text-orange-600 transition-colors">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.174-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.663.967-2.911 2.168-2.911 1.024 0 1.518.769 1.518 1.688 0 1.029-.653 2.567-.992 3.992-.285 1.193.6 2.165 1.775 2.165 2.128 0 3.768-2.245 3.768-5.487 0-2.861-2.063-4.869-5.008-4.869-3.41 0-5.409 2.562-5.409 5.199 0 1.033.394 2.143.889 2.741.099.12.112.225.085.345-.09.375-.293 1.199-.334 1.363-.053.225-.172.271-.402.165-1.495-.69-2.433-2.878-2.433-4.646 0-3.776 2.748-7.252 7.92-7.252 4.158 0 7.392 2.967 7.392 6.923 0 4.135-2.607 7.462-6.233 7.462-1.214 0-2.357-.629-2.746-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24.009 12.017 24.009c6.624 0 11.99-5.367 11.99-11.988C24.007 5.367 18.641.001 12.017.001z"/>
                  </svg>
                </a>
              </div>
              <p className="text-gray-500 text-sm">
                © COPYRIGHT SWEETBAKERY {new Date().getFullYear()}. ALL RIGHTS RESERVED
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
