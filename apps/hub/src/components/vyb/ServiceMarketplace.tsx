'use client';

import { useState, useEffect } from 'react';
import { vybService } from '@/lib/vyb/service';
import type { ServiceListing, ServiceCategory } from '@/lib/vyb/types';

const CATEGORIES: { id: ServiceCategory | 'all'; label: string; icon: string }[] = [
  { id: 'all', label: 'All', icon: '🌐' },
  { id: 'art', label: 'Art', icon: '🎨' },
  { id: 'music', label: 'Music', icon: '🎵' },
  { id: 'game-design', label: 'Game Design', icon: '🎮' },
  { id: 'web-design', label: 'Web Design', icon: '🌐' },
  { id: 'graphics', label: 'Graphics', icon: '✨' },
  { id: 'animation', label: 'Animation', icon: '🎬' },
  { id: '3d-modeling', label: '3D', icon: '🧊' },
  { id: 'smart-contracts', label: 'Blockchain', icon: '⛓️' },
];

export function ServiceMarketplace() {
  const [services, setServices] = useState<ServiceListing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<ServiceCategory | 'all'>('all');
  const [selectedService, setSelectedService] = useState<ServiceListing | null>(null);

  useEffect(() => {
    loadServices();
  }, [selectedCategory]);

  const loadServices = async () => {
    setIsLoading(true);
    try {
      const data = await vybService.getServices(selectedCategory === 'all' ? undefined : selectedCategory);
      setServices(data);
    } catch (error) {
      console.error('Failed to load services:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredServices = selectedCategory === 'all' 
    ? services 
    : services.filter(s => s.category === selectedCategory);

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'artist': return '🎨';
      case 'musician': return '🎵';
      case 'developer': return '💻';
      case 'designer': return '✨';
      default: return '👤';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'art': return 'from-pink-500 to-purple-500';
      case 'music': return 'from-green-500 to-teal-500';
      case 'game-design': return 'from-blue-500 to-cyan-500';
      case 'web-design': return 'from-orange-500 to-yellow-500';
      case 'graphics': return 'from-red-500 to-pink-500';
      case 'animation': return 'from-purple-500 to-indigo-500';
      case '3d-modeling': return 'from-cyan-500 to-blue-500';
      case 'smart-contracts': return 'from-emerald-500 to-green-500';
      default: return 'from-gray-500 to-gray-600';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-grunge text-3xl text-neon-cyan">🛠️ Creator Services</h2>
          <p className="text-gray-400 font-body">Hire talented creators for your projects</p>
        </div>
        <button className="neon-button px-4 py-2 rounded-lg">
          ➕ List Your Service
        </button>
      </div>

      {/* Category Filter */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg whitespace-nowrap transition-all ${
              selectedCategory === cat.id
                ? 'neon-button'
                : 'glass-panel hover:border-neon-cyan/30'
            }`}
          >
            <span>{cat.icon}</span>
            <span>{cat.label}</span>
          </button>
        ))}
      </div>

      {/* Services Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="glass-panel p-4 rounded-xl animate-pulse">
              <div className="h-32 bg-gray-700 rounded-lg mb-4" />
              <div className="h-4 bg-gray-700 rounded w-2/3 mb-2" />
              <div className="h-3 bg-gray-700 rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : filteredServices.length === 0 ? (
        <div className="glass-panel p-12 rounded-xl text-center">
          <p className="text-4xl mb-4">🔍</p>
          <p className="text-gray-400">No services found in this category</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredServices.map((service) => (
            <div
              key={service.id}
              onClick={() => setSelectedService(service)}
              className="glass-panel rounded-xl overflow-hidden cursor-pointer hover:border-neon-cyan/30 transition-all"
            >
              {/* Category Banner */}
              <div className={`h-24 bg-gradient-to-r ${getCategoryColor(service.category)} flex items-center justify-center`}>
                <span className="text-4xl">
                  {CATEGORIES.find(c => c.id === service.category)?.icon || '🛠️'}
                </span>
              </div>

              {/* Content */}
              <div className="p-4">
                {/* Creator */}
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-neon-cyan/50 to-neon-purple/50 flex items-center justify-center text-sm">
                    {getRoleIcon(service.creator.role)}
                  </div>
                  <div>
                    <span className="text-sm text-neon-cyan">{service.creator.displayName}</span>
                    {service.creator.isVerified && (
                      <span className="text-blue-400 text-xs ml-1">✓</span>
                    )}
                  </div>
                </div>

                {/* Title */}
                <h3 className="font-grunge-alt text-lg text-white mb-2">{service.title}</h3>
                <p className="text-gray-400 text-sm mb-4 line-clamp-2">{service.description}</p>

                {/* Footer */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-yellow-400">⭐</span>
                    <span className="text-white font-body">{service.rating}</span>
                    <span className="text-gray-500 text-sm">({service.reviewCount})</span>
                  </div>
                  <p className="font-grunge text-neon-cyan text-xl">{service.price} CGT</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Service Detail Modal */}
      {selectedService && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          onClick={() => setSelectedService(null)}
        >
          <div 
            className="glass-panel liquid-border w-full max-w-2xl max-h-[90vh] rounded-xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Banner */}
            <div className={`h-32 bg-gradient-to-r ${getCategoryColor(selectedService.category)} flex items-center justify-center`}>
              <span className="text-6xl">
                {CATEGORIES.find(c => c.id === selectedService.category)?.icon || '🛠️'}
              </span>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              {/* Creator */}
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-neon-cyan/50 to-neon-purple/50 flex items-center justify-center text-xl">
                  {getRoleIcon(selectedService.creator.role)}
                </div>
                <div>
                  <span className="font-grunge-alt text-lg text-neon-cyan">
                    {selectedService.creator.displayName}
                  </span>
                  {selectedService.creator.isVerified && (
                    <span className="text-blue-400 ml-1">✓</span>
                  )}
                  <p className="text-gray-500 text-sm capitalize">{selectedService.creator.role}</p>
                </div>
              </div>

              {/* Title & Description */}
              <h2 className="font-grunge text-2xl text-white mb-2">{selectedService.title}</h2>
              <p className="text-gray-400 font-body mb-6">{selectedService.description}</p>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="glass-panel p-4 rounded-lg text-center">
                  <p className="text-2xl font-grunge text-neon-cyan">{selectedService.price}</p>
                  <p className="text-gray-500 text-sm">CGT</p>
                </div>
                <div className="glass-panel p-4 rounded-lg text-center">
                  <p className="text-2xl font-grunge text-yellow-400">{selectedService.rating}</p>
                  <p className="text-gray-500 text-sm">Rating</p>
                </div>
                <div className="glass-panel p-4 rounded-lg text-center">
                  <p className="text-2xl font-grunge text-green-400">{selectedService.deliveryDays}</p>
                  <p className="text-gray-500 text-sm">Days</p>
                </div>
              </div>

              {/* Tags */}
              <div className="flex flex-wrap gap-2 mb-6">
                {selectedService.tags.map((tag, i) => (
                  <span key={i} className="px-3 py-1 rounded-full bg-neon-cyan/10 border border-neon-cyan/30 text-neon-cyan text-sm">
                    #{tag}
                  </span>
                ))}
              </div>

              {/* Reviews Preview */}
              <div className="glass-panel p-4 rounded-lg mb-6">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-grunge-alt text-white">Reviews</h3>
                  <span className="text-gray-500 text-sm">{selectedService.reviewCount} reviews</span>
                </div>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <span key={star} className={star <= Math.round(selectedService.rating) ? 'text-yellow-400' : 'text-gray-600'}>
                      ⭐
                    </span>
                  ))}
                  <span className="text-white ml-2 font-body">{selectedService.rating}/5</span>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-gray-800 flex gap-3">
              <button
                onClick={() => setSelectedService(null)}
                className="flex-1 glass-panel py-3 rounded-lg hover:border-gray-500 transition-colors"
              >
                Close
              </button>
              <button className="flex-1 glass-panel py-3 rounded-lg hover:border-neon-cyan/50 transition-colors">
                💬 Message
              </button>
              <button className="flex-1 neon-button py-3 rounded-lg">
                🛒 Order Now
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
