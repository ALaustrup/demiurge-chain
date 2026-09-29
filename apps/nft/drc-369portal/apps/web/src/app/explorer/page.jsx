"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import DrcSidebar from "../../components/DrcSidebar";
import DrcHeader from "../../components/DrcHeader";
import CvpStatusBadge from "../../components/CvpStatusBadge";
import { InlineLevel } from "../../components/LevelProgress";
import { Search, Layers, TrendingUp, Zap, Shield, ShieldCheck, Lock, Grid, List, SortAsc, SortDesc, Filter } from "lucide-react";

export default function Explorer() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [viewMode, setViewMode] = useState("grid"); // "grid" | "list"
  const [sortBy, setSortBy] = useState("created_at");
  const [sortDir, setSortDir] = useState("desc");

  const { data: assetsData, isLoading } = useQuery({
    queryKey: ["assets", searchTerm, filterType, sortBy, sortDir],
    queryFn: async () => {
      let url = "/api/assets?";
      if (searchTerm) url += `search=${encodeURIComponent(searchTerm)}&`;
      if (filterType === "parent") url += "hasParent=false&";
      if (filterType === "nested") url += "hasParent=true&";
      if (filterType === "delegated") url += "isDelegated=true&";
      if (filterType === "soulbound") url += "isSoulbound=true&";
      url += `sortBy=${sortBy}&sortDir=${sortDir}`;

      const response = await fetch(url);
      if (!response.ok) throw new Error("Failed to fetch assets");
      return response.json();
    },
  });

  // Fetch CVP system status
  const { data: cvpSystemStatus } = useQuery({
    queryKey: ["cvp-system"],
    queryFn: async () => ({
      currentEpoch: 42,
      blocksRemaining: 58,
      totalMutations: 1247,
      activeThreats: 0,
      proofSystem: "translation_validation",
    }),
    refetchInterval: 10000, // Refresh every 10s
  });

  const assets = assetsData?.assets || [];

  const getModuleBadges = (asset) => {
    const badges = [];

    if (asset.resources && asset.resources.length > 1) {
      badges.push({ label: "Multi-Resource", icon: Layers, color: "purple" });
    }

    if (asset.children_count > 0) {
      badges.push({
        label: `${asset.children_count} Nested`,
        icon: TrendingUp,
        color: "blue",
      });
    }

    if (asset.delegated_user) {
      badges.push({ label: "Delegated", icon: Shield, color: "orange" });
    }

    if (asset.level > 1) {
      badges.push({ label: `Lv ${asset.level}`, icon: Zap, color: "green" });
    }

    return badges;
  };

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
          activePage="Explorer"
        />
      </div>

      <div className="flex-1 flex flex-col min-w-0">
        <DrcHeader
          onMenuClick={() => setSidebarOpen(true)}
          title="Asset Explorer"
        />

        <div className="flex-1 overflow-y-auto p-4 md:p-8">
          {/* CVP System Status Banner */}
          {cvpSystemStatus && (
            <div className="bg-gradient-to-r from-purple-600/10 to-blue-600/10 dark:from-purple-900/30 dark:to-blue-900/30 rounded-xl border border-purple-500/20 p-4 mb-6">
              <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <ShieldCheck className="text-green-500" size={24} />
                  <div>
                    <div className="text-sm font-semibold text-black dark:text-white">CVP Protection Active</div>
                    <div className="text-xs text-black/60 dark:text-white/60">
                      Epoch #{cvpSystemStatus.currentEpoch} • {cvpSystemStatus.blocksRemaining} blocks until mutation
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <div className="text-center">
                    <div className="font-bold text-black dark:text-white">{cvpSystemStatus.totalMutations}</div>
                    <div className="text-xs text-black/40 dark:text-white/40">Mutations</div>
                  </div>
                  <div className="text-center">
                    <div className={`font-bold ${cvpSystemStatus.activeThreats > 0 ? 'text-red-500' : 'text-green-500'}`}>
                      {cvpSystemStatus.activeThreats}
                    </div>
                    <div className="text-xs text-black/40 dark:text-white/40">Threats</div>
                  </div>
                  <div className="text-center">
                    <div className="font-bold text-black dark:text-white capitalize">
                      {cvpSystemStatus.proofSystem?.replace('_', ' ')}
                    </div>
                    <div className="text-xs text-black/40 dark:text-white/40">Proof System</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Search and Filter Controls */}
          <div className="bg-white dark:bg-[#1E1E1E] rounded-xl border border-[#E6E6E6] dark:border-[#333333] p-4 mb-6">
            <div className="flex flex-col lg:flex-row gap-4">
              {/* Search Input */}
              <div className="flex-1 relative">
                <input
                  type="text"
                  placeholder="Search assets by name or description..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full h-12 pl-12 pr-4 rounded-lg bg-[#F9FAFB] dark:bg-[#262626] border border-[#E5E5E5] dark:border-[#333333] font-inter text-black dark:text-white placeholder-[#6E6E6E] dark:placeholder-[#888888] focus:border-purple-500 dark:focus:border-purple-400 focus:outline-none"
                />
                <Search
                  size={20}
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 text-[#6E6E6E] dark:text-[#888888]"
                />
              </div>

              {/* Filter Buttons */}
              <div className="flex flex-wrap gap-2">
                {[
                  { key: "all", label: "All" },
                  { key: "parent", label: "Top-Level" },
                  { key: "nested", label: "Nested" },
                  { key: "soulbound", label: "Soulbound", icon: Lock },
                  { key: "delegated", label: "Delegated" },
                ].map((filter) => (
                  <button
                    key={filter.key}
                    onClick={() => setFilterType(filter.key)}
                    className={`px-4 py-2 rounded-lg font-medium text-sm transition-all duration-150 font-inter flex items-center gap-1.5 ${
                      filterType === filter.key
                        ? "bg-purple-600 text-white"
                        : "bg-[#F9FAFB] dark:bg-[#262626] text-black dark:text-white hover:bg-purple-100 dark:hover:bg-purple-900/30"
                    }`}
                  >
                    {filter.icon && <filter.icon size={14} />}
                    {filter.label}
                  </button>
                ))}
              </div>

              {/* View Mode & Sort */}
              <div className="flex gap-2">
                {/* Sort Dropdown */}
                <select
                  value={`${sortBy}-${sortDir}`}
                  onChange={(e) => {
                    const [newSortBy, newSortDir] = e.target.value.split("-");
                    setSortBy(newSortBy);
                    setSortDir(newSortDir);
                  }}
                  className="px-3 py-2 rounded-lg bg-[#F9FAFB] dark:bg-[#262626] border border-[#E5E5E5] dark:border-[#333333] text-sm font-inter text-black dark:text-white"
                >
                  <option value="created_at-desc">Newest First</option>
                  <option value="created_at-asc">Oldest First</option>
                  <option value="xp-desc">Highest XP</option>
                  <option value="xp-asc">Lowest XP</option>
                  <option value="name-asc">Name A-Z</option>
                  <option value="name-desc">Name Z-A</option>
                </select>

                {/* View Mode Toggle */}
                <div className="flex rounded-lg border border-[#E5E5E5] dark:border-[#333333] overflow-hidden">
                  <button
                    onClick={() => setViewMode("grid")}
                    className={`p-2 ${viewMode === "grid" ? "bg-purple-600 text-white" : "bg-[#F9FAFB] dark:bg-[#262626] text-black dark:text-white"}`}
                  >
                    <Grid size={18} />
                  </button>
                  <button
                    onClick={() => setViewMode("list")}
                    className={`p-2 ${viewMode === "list" ? "bg-purple-600 text-white" : "bg-[#F9FAFB] dark:bg-[#262626] text-black dark:text-white"}`}
                  >
                    <List size={18} />
                  </button>
                </div>
              </div>
            </div>

            {/* Active filters summary */}
            <div className="flex items-center gap-2 mt-3 text-sm text-black/60 dark:text-white/60">
              <Filter size={14} />
              <span>
                Showing {assets.length} asset{assets.length !== 1 ? "s" : ""}
                {filterType !== "all" && ` • Filter: ${filterType}`}
                {searchTerm && ` • Search: "${searchTerm}"`}
              </span>
            </div>
          </div>

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
          ) : assets.length === 0 ? (
            <div className="text-center py-20">
              <Layers
                size={64}
                className="mx-auto text-black/20 dark:text-white/20 mb-4"
              />
              <p className="text-xl text-black/60 dark:text-white/60 font-inter">
                No assets found
              </p>
            </div>
          ) : (
            {viewMode === "grid" ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {assets.map((asset) => {
                  const primaryResource = asset.resources?.find(r => r.resource_type === "Image");
                  const imageUrl = primaryResource?.uri || null;
                  const badges = getModuleBadges(asset);

                  return (
                    <button
                      key={asset.uuid}
                      onClick={() => {
                        if (typeof window !== "undefined")
                          window.location.href = `/asset/${asset.uuid}`;
                      }}
                      className="bg-white dark:bg-[#1E1E1E] rounded-xl border border-[#E6E6E6] dark:border-[#333333] overflow-hidden hover:border-purple-400 dark:hover:border-purple-600 transition-all duration-200 hover:shadow-xl hover:scale-[1.02] text-left group"
                    >
                      <div className="relative">
                        {imageUrl ? (
                          <img
                            src={imageUrl}
                            alt={asset.name}
                            className="w-full h-48 object-cover"
                          />
                        ) : (
                          <div className="w-full h-48 bg-gradient-to-br from-purple-500/20 to-blue-500/20 flex items-center justify-center">
                            <Layers className="w-12 h-12 text-purple-500/50" />
                          </div>
                        )}
                        
                        {/* CVP Badge */}
                        <div className="absolute top-2 left-2">
                          <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-green-500/90 text-white text-xs font-semibold">
                            <ShieldCheck size={12} />
                            CVP
                          </div>
                        </div>

                        {/* Soulbound Badge */}
                        {asset.is_soulbound && (
                          <div className="absolute top-2 right-2">
                            <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-purple-600/90 text-white text-xs font-semibold">
                              <Lock size={10} />
                              Soulbound
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="p-4">
                        <h3 className="text-lg font-bold text-black dark:text-white mb-1 font-bricolage truncate group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                          {asset.name}
                        </h3>
                        <p className="text-sm text-black/60 dark:text-white/60 mb-3 font-inter line-clamp-2">
                          {asset.description || "No description"}
                        </p>

                        <div className="flex flex-wrap gap-2 mb-3">
                          {badges.slice(0, 3).map((badge, index) => {
                            const Icon = badge.icon;
                            const colorClasses = {
                              purple: "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300",
                              blue: "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300",
                              orange: "bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300",
                              green: "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300",
                            };

                            return (
                              <span
                                key={index}
                                className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${colorClasses[badge.color]} font-inter`}
                              >
                                <Icon size={12} />
                                {badge.label}
                              </span>
                            );
                          })}
                        </div>

                        <div className="flex items-center justify-between">
                          <InlineLevel xp={asset.xp || 0} showXp />
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : (
              /* List View */
              <div className="space-y-2">
                {assets.map((asset) => {
                  const primaryResource = asset.resources?.find(r => r.resource_type === "Image");
                  const imageUrl = primaryResource?.uri || null;

                  return (
                    <button
                      key={asset.uuid}
                      onClick={() => {
                        if (typeof window !== "undefined")
                          window.location.href = `/asset/${asset.uuid}`;
                      }}
                      className="w-full bg-white dark:bg-[#1E1E1E] rounded-xl border border-[#E6E6E6] dark:border-[#333333] p-4 hover:border-purple-400 dark:hover:border-purple-600 transition-all duration-200 text-left flex items-center gap-4"
                    >
                      {/* Thumbnail */}
                      <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
                        {imageUrl ? (
                          <img src={imageUrl} alt={asset.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-purple-500/20 to-blue-500/20 flex items-center justify-center">
                            <Layers className="w-6 h-6 text-purple-500/50" />
                          </div>
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-bold text-black dark:text-white truncate">{asset.name}</h3>
                          {asset.is_soulbound && (
                            <Lock size={12} className="text-purple-500 flex-shrink-0" />
                          )}
                          <ShieldCheck size={12} className="text-green-500 flex-shrink-0" />
                        </div>
                        <p className="text-sm text-black/60 dark:text-white/60 truncate">
                          {asset.description || "No description"}
                        </p>
                      </div>

                      {/* Stats */}
                      <div className="flex items-center gap-4 flex-shrink-0">
                        <InlineLevel xp={asset.xp || 0} />
                        <div className="text-sm text-black/60 dark:text-white/60">
                          {asset.resources?.length || 0} resources
                        </div>
                        <div className="text-sm text-black/60 dark:text-white/60">
                          {asset.children_count || 0} nested
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          )}
        </div>
      </div>
    </div>
  );
}
