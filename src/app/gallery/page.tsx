'use client';

import WebsiteLayout from '@/components/WebsiteLayout';
import { useState } from 'react';

export default function GalleryPage() {
  const [selectedCategory, setSelectedCategory] = useState('ALL');

  const categories = ['ALL', 'PRODUCTS', 'FACILITY', 'TEAM', 'EVENTS'];

  const galleryItems = [
    // Products
    { id: 1, title: 'Artisan Sourdough Bread', category: 'PRODUCTS', image: '/api/placeholder/400/300', description: 'Hand-crafted sourdough with perfect crust' },
    { id: 2, title: 'Chocolate Croissants', category: 'PRODUCTS', image: '/api/placeholder/400/300', description: 'Buttery croissants filled with rich chocolate' },
    { id: 3, title: 'Red Velvet Cake', category: 'PRODUCTS', image: '/api/placeholder/400/300', description: 'Classic red velvet with cream cheese frosting' },
    { id: 4, title: 'Fresh Pastries', category: 'PRODUCTS', image: '/api/placeholder/400/300', description: 'Assorted fresh pastries baked daily' },
    { id: 5, title: 'Birthday Cakes', category: 'PRODUCTS', image: '/api/placeholder/400/300', description: 'Custom birthday cakes for special occasions' },
    { id: 6, title: 'Artisan Cookies', category: 'PRODUCTS', image: '/api/placeholder/400/300', description: 'Hand-decorated cookies and biscuits' },
    
    // Facility
    { id: 7, title: 'Our Bakery Kitchen', category: 'FACILITY', image: '/api/placeholder/400/300', description: 'State-of-the-art baking facility' },
    { id: 8, title: 'Fresh Ingredients', category: 'FACILITY', image: '/api/placeholder/400/300', description: 'Premium ingredients sourced locally' },
    { id: 9, title: 'Quality Control', category: 'FACILITY', image: '/api/placeholder/400/300', description: 'Rigorous quality checks for every product' },
    { id: 10, title: 'Packaging Area', category: 'FACILITY', image: '/api/placeholder/400/300', description: 'Eco-friendly packaging for all products' },
    
    // Team
    { id: 11, title: 'Our Baking Team', category: 'TEAM', image: '/api/placeholder/400/300', description: 'Passionate bakers at work' },
    { id: 12, title: 'Maria Rodriguez', category: 'TEAM', image: '/api/placeholder/400/300', description: 'Founder and Head Baker' },
    { id: 13, title: 'James Chen', category: 'TEAM', image: '/api/placeholder/400/300', description: 'Pastry Chef specializing in French desserts' },
    { id: 14, title: 'Sarah Johnson', category: 'TEAM', image: '/api/placeholder/400/300', description: 'Operations Manager ensuring quality' },
    
    // Events
    { id: 15, title: 'Community Event', category: 'EVENTS', image: '/api/placeholder/400/300', description: 'Participating in local community events' },
    { id: 16, title: 'Baking Workshop', category: 'EVENTS', image: '/api/placeholder/400/300', description: 'Teaching baking techniques to customers' },
    { id: 17, title: 'Festival Booth', category: 'EVENTS', image: '/api/placeholder/400/300', description: 'SweetBakery booth at local festivals' },
    { id: 18, title: 'Charity Event', category: 'EVENTS', image: '/api/placeholder/400/300', description: 'Supporting local charities and causes' }
  ];

  const filteredItems = selectedCategory === 'ALL' 
    ? galleryItems 
    : galleryItems.filter(item => item.category === selectedCategory);

  return (
    <WebsiteLayout>
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-orange-50 to-red-50 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
              Our <span className="text-orange-600">Gallery</span>
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Take a visual journey through our bakery, products, and the people who make it all possible
            </p>
          </div>
        </div>
      </section>

      {/* Category Filter */}
      <section className="py-8 bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap justify-center gap-4">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-6 py-2 rounded-full text-sm font-medium transition-colors ${
                  selectedCategory === category
                    ? 'bg-orange-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Gallery Grid */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredItems.map((item) => (
              <div key={item.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow group">
                <div className="relative">
                  <img 
                    src={item.image} 
                    alt={item.title}
                    className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-300"></div>
                  <div className="absolute top-2 left-2">
                    <span className="bg-orange-600 text-white px-2 py-1 rounded-full text-xs font-medium">
                      {item.category}
                    </span>
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{item.title}</h3>
                  <p className="text-gray-600 text-sm">{item.description}</p>
                </div>
              </div>
            ))}
          </div>

          {filteredItems.length === 0 && (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No images found</h3>
              <p className="text-gray-600">Try selecting a different category to see more images.</p>
            </div>
          )}
        </div>
      </section>

      {/* Featured Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Behind the Scenes
            </h2>
            <p className="text-xl text-gray-600">
              See how we create our delicious products
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                From Ingredients to Delicious Products
              </h3>
              <p className="text-lg text-gray-600 mb-6">
                Our gallery showcases not just the final products, but the entire journey from selecting 
                the finest ingredients to the careful baking process that creates our signature taste.
              </p>
              <p className="text-lg text-gray-600 mb-6">
                Every photo tells a story of dedication, craftsmanship, and passion for baking. 
                We invite you to explore our gallery and see the love that goes into every product we create.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <a 
                  href="/products" 
                  className="bg-orange-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-orange-700 transition-colors text-center"
                >
                  Order Our Products
                </a>
                <a 
                  href="/contact" 
                  className="border-2 border-orange-600 text-orange-600 px-6 py-3 rounded-lg font-medium hover:bg-orange-600 hover:text-white transition-colors text-center"
                >
                  Visit Our Bakery
                </a>
              </div>
            </div>
            <div className="relative">
              <img 
                src="/api/placeholder/600/400" 
                alt="Behind the scenes" 
                className="w-full h-96 object-cover rounded-lg shadow-lg"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent rounded-lg"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-20 bg-gradient-to-r from-orange-600 to-red-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Ready to Taste Our Products?
          </h2>
          <p className="text-xl text-orange-100 mb-8 max-w-2xl mx-auto">
            After seeing our gallery, we&apos;re sure you&apos;re ready to experience the taste of our fresh, handcrafted products.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a 
              href="/products" 
              className="bg-white text-orange-600 px-8 py-3 rounded-lg text-lg font-medium hover:bg-gray-100 transition-colors"
            >
              Browse Products
            </a>
            <a 
              href="/register" 
              className="border-2 border-white text-white px-8 py-3 rounded-lg text-lg font-medium hover:bg-white hover:text-orange-600 transition-colors"
            >
              Create Account
            </a>
          </div>
        </div>
      </section>
    </WebsiteLayout>
  );
}
