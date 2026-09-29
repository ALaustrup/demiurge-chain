"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import DrcSidebar from "../../components/DrcSidebar";
import DrcHeader from "../../components/DrcHeader";
import {
  ShoppingCart,
  Filter,
  TrendingUp,
  Package,
  Star,
  Zap,
} from "lucide-react";

export default function Marketplace() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [priceFilter, setPriceFilter] = useState("all");
  const [bundleFilter, setBundleFilter] = useState(false);

  const { data: assetsData, isLoading } = useQuery({
    queryKey: ["marketplace-assets", bundleFilter],
    queryFn: async () => {
      const url = bundleFilter ? "/api/assets?hasParent=false" : "/api/assets";
      const response = await fetch(url);
      if (!response.ok) throw new Error("Failed to fetch assets");
      return response.json();
    },
  });

  const assets = assetsData?.assets || [];

  // Mock pricing for demo
  const getPriceForAsset = (asset) => {
    const basePrice = 0.5 + asset.level * 0.2;
    const bundleMultiplier = asset.children_count
      ? 1 + asset.children_count * 0.3
      : 1;
    return (basePrice * bundleMultiplier).toFixed(2);
  };

  const listings = assets.map((asset) => ({
    ...asset,
    price: getPriceForAsset(asset),
    bundleValue: asset.children_count ? getPriceForAsset(asset) : null,
    seller: asset.owner_account,
  }));

  return (
    <div className="flex h-screen bg-[#F3F3F3] dark:bg-[#0A0A0A]">
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 dark:bg-black dark:bg-opacity-70 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div
        className={`fixed lg:static inset-y-0 left-0 z-50 lg:z-auto transform ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0 transition-transform duration-300 ease-in-out`}
      >
        <DrcSidebar
          onClose={() => setSidebarOpen(false)}
          activePage="Marketplace"
        />
      </div>

      <div className="flex-1 flex flex-col min-w-0">
        <DrcHeader
          onMenuClick={() => setSidebarOpen(true)}
          title="Marketplace"
        />

        <div className="flex-1 overflow-y-auto p-4 md:p-8">
          {/* Hero Section */}
          <div className="bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 rounded-2xl p-8 md:p-12 mb-8 text-white">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 font-sora">
              DRC-369 Marketplace
            </h2>
            <p className="text-lg md:text-xl opacity-90 mb-6 font-inter max-w-2xl">
              Buy and sell complete asset bundles with atomic transfers. Parent
              assets include all nested children automatically.
            </p>
            <div className="flex flex-wrap gap-4">
              <div className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-lg">
                <p className="text-sm opacity-80 font-inter">Total Volume</p>
                <p className="text-2xl font-bold font-sora">1,234 DMR</p>
              </div>
              <div className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-lg">
                <p className="text-sm opacity-80 font-inter">Active Listings</p>
                <p className="text-2xl font-bold font-sora">
                  {listings.length}
                </p>
              </div>
              <div className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-lg">
                <p className="text-sm opacity-80 font-inter">Floor Price</p>
                <p className="text-2xl font-bold font-sora">0.5 DMR</p>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white dark:bg-[#1E1E1E] rounded-xl border border-[#E6E6E6] dark:border-[#333333] p-4 mb-6">
            <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
              <div className="flex gap-2">
                <button
                  onClick={() => setBundleFilter(false)}
                  className={`px-4 py-2 rounded-lg font-medium text-sm transition-all duration-150 font-inter ${
                    !bundleFilter
                      ? "bg-purple-600 text-white"
                      : "bg-[#F9FAFB] dark:bg-[#262626] text-black dark:text-white hover:bg-purple-100 dark:hover:bg-purple-900/30"
                  }`}
                >
                  All Assets
                </button>
                <button
                  onClick={() => setBundleFilter(true)}
                  className={`px-4 py-2 rounded-lg font-medium text-sm transition-all duration-150 font-inter flex items-center gap-2 ${
                    bundleFilter
                      ? "bg-purple-600 text-white"
                      : "bg-[#F9FAFB] dark:bg-[#262626] text-black dark:text-white hover:bg-purple-100 dark:hover:bg-purple-900/30"
                  }`}
                >
                  <Package size={16} />
                  Bundles Only
                </button>
              </div>

              <select
                value={priceFilter}
                onChange={(e) => setPriceFilter(e.target.value)}
                className="px-4 py-2 rounded-lg bg-[#F9FAFB] dark:bg-[#262626] border border-[#E5E5E5] dark:border-[#333333] text-black dark:text-white font-inter focus:border-purple-500 focus:outline-none"
              >
                <option value="all">All Prices</option>
                <option value="low">Low to High</option>
                <option value="high">High to Low</option>
              </select>
            </div>
          </div>

          {/* Listings Grid */}
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => (
                <div
                  key={i}
                  className="bg-white dark:bg-[#1E1E1E] rounded-xl border border-[#E6E6E6] dark:border-[#333333] p-4 animate-pulse"
                >
                  <div className="w-full h-48 bg-[#F9FAFB] dark:bg-[#262626] rounded-lg mb-4"></div>
                  <div className="h-6 bg-[#F9FAFB] dark:bg-[#262626] rounded mb-2"></div>
                  <div className="h-4 bg-[#F9FAFB] dark:bg-[#262626] rounded w-2/3"></div>
                </div>
              ))}
            </div>
          ) : listings.length === 0 ? (
            <div className="text-center py-20">
              <ShoppingCart
                size={64}
                className="mx-auto text-black/20 dark:text-white/20 mb-4"
              />
              <p className="text-xl text-black/60 dark:text-white/60 font-inter">
                No listings found
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {listings.map((listing) => {
                const primaryResource = listing.resources?.[0];
                const imageUrl =
                  primaryResource?.uri || "https://via.placeholder.com/400";
                const isBundle = listing.children_count > 0;

                return (
                  <div
                    key={listing.uuid}
                    className="bg-white dark:bg-[#1E1E1E] rounded-xl border border-[#E6E6E6] dark:border-[#333333] overflow-hidden hover:border-purple-400 dark:hover:border-purple-600 transition-all duration-200 hover:shadow-xl hover:scale-[1.02]"
                  >
                    <div className="relative">
                      <img
                        src={imageUrl}
                        alt={listing.name}
                        className="w-full h-48 object-cover"
                      />
                      {isBundle && (
                        <div className="absolute top-2 left-2 px-2 py-1 bg-blue-500 text-white text-xs font-bold rounded flex items-center gap-1 font-inter">
                          <Package size={12} />
                          Bundle ({listing.children_count})
                        </div>
                      )}
                      <div className="absolute top-2 right-2 px-2 py-1 bg-black/70 text-white text-xs font-bold rounded font-sora">
                        Lv {listing.level}
                      </div>
                    </div>

                    <div className="p-4">
                      <h3 className="text-lg font-bold text-black dark:text-white mb-1 font-bricolage truncate">
                        {listing.name}
                      </h3>
                      <p className="text-xs text-black/60 dark:text-white/60 mb-3 font-inter line-clamp-2">
                        {listing.description || "No description"}
                      </p>

                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <p className="text-xs text-black/60 dark:text-white/60 font-inter">
                            Price
                          </p>
                          <p className="text-xl font-bold text-black dark:text-white font-sora">
                            {listing.price} DMR
                          </p>
                        </div>
                        {isBundle && (
                          <div className="text-right">
                            <p className="text-xs text-green-600 dark:text-green-400 font-inter">
                              Bundle Value
                            </p>
                            <p className="text-sm font-semibold text-green-600 dark:text-green-400 font-sora">
                              +{(listing.bundleValue * 0.3).toFixed(2)} DMR
                            </p>
                          </div>
                        )}
                      </div>

                      <div className="space-y-2 mb-4">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-black/60 dark:text-white/60 font-inter flex items-center gap-1">
                            <Zap size={12} className="text-purple-500" />
                            {listing.experience_points} XP
                          </span>
                          <span className="text-black/60 dark:text-white/60 font-inter">
                            {listing.durability}% HP
                          </span>
                        </div>
                      </div>

                      <button className="w-full py-3 rounded-lg bg-gradient-to-br from-purple-500 to-blue-600 text-white font-semibold hover:shadow-lg transition-all duration-150 font-inter flex items-center justify-center gap-2">
                        <ShoppingCart size={16} />
                        Buy Now
                      </button>

                      <p className="text-xs text-black/40 dark:text-white/40 text-center mt-2 font-mono">
                        Seller: {listing.seller.slice(0, 6)}...
                        {listing.seller.slice(-4)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
