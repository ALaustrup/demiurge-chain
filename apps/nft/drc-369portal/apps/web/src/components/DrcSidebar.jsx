import { useState } from "react";
import {
  LayoutDashboard,
  Layers,
  Plus,
  ShoppingCart,
  Code,
  Sparkles,
  ChevronDown,
  Shield,
} from "lucide-react";

export default function DrcSidebar({ onClose, activePage }) {
  const [expandedMenus, setExpandedMenus] = useState({});

  const toggleSubmenu = (item) => {
    setExpandedMenus((prev) => ({
      ...prev,
      [item]: !prev[item],
    }));
  };

  const handleItemClick = (itemName, path, hasSubmenu) => {
    if (!hasSubmenu && path) {
      if (typeof window !== "undefined") {
        window.location.href = path;
      }
    }
    if (hasSubmenu) {
      toggleSubmenu(itemName);
    }
    if (onClose && typeof window !== "undefined" && window.innerWidth < 1024) {
      onClose();
    }
  };

  const navigationItems = [
    { name: "Dashboard", icon: LayoutDashboard, hasSubmenu: false, path: "/" },
    { name: "Explorer", icon: Layers, hasSubmenu: false, path: "/explorer" },
    { name: "Create Asset", icon: Plus, hasSubmenu: false, path: "/create" },
    {
      name: "Marketplace",
      icon: ShoppingCart,
      hasSubmenu: false,
      path: "/marketplace",
    },
    { name: "Developers", icon: Code, hasSubmenu: false, path: "/developers" },
    { name: "Admin", icon: Shield, hasSubmenu: false, path: "/admin" },
  ];

  return (
    <div className="w-60 bg-[#F3F3F3] dark:bg-[#1A1A1A] flex-shrink-0 flex flex-col h-full">
      <div className="p-4 flex justify-start items-center gap-3">
        <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-600 rounded-full flex items-center justify-center">
          <Sparkles size={24} className="text-white" />
        </div>
        <div>
          <h1 className="font-bold text-lg text-black dark:text-white font-sora">
            DRC-369
          </h1>
          <p className="text-xs text-black/60 dark:text-white/60 font-inter">
            Asset Platform
          </p>
        </div>
      </div>

      <nav className="flex-1 px-4">
        <div className="space-y-2">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = activePage === item.name;
            const isExpanded = expandedMenus[item.name];

            return (
              <div key={item.name}>
                <button
                  onClick={() =>
                    handleItemClick(item.name, item.path, item.hasSubmenu)
                  }
                  className={`w-full flex items-center justify-between px-3 py-3 rounded-lg transition-all duration-200 ${
                    isActive
                      ? "bg-white dark:bg-[#262626] border border-[#E4E4E4] dark:border-[#404040] text-black dark:text-white"
                      : "text-black/70 dark:text-white/70 hover:text-black dark:hover:text-white hover:bg-white/50 dark:hover:bg-white/10 active:bg-white/70 dark:active:bg-white/15 active:scale-[0.98]"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon
                      size={20}
                      className={
                        isActive
                          ? "text-black dark:text-white"
                          : "text-black/70 dark:text-white/70"
                      }
                    />
                    <span
                      className={`font-medium text-sm font-plus-jakarta ${
                        isActive
                          ? "text-black dark:text-white"
                          : "text-black/70 dark:text-white/70"
                      }`}
                    >
                      {item.name}
                    </span>
                  </div>
                  {item.hasSubmenu && (
                    <ChevronDown
                      size={16}
                      className={`transition-transform duration-200 ${
                        isExpanded ? "rotate-180" : ""
                      } ${isActive ? "text-black dark:text-white" : "text-black/70 dark:text-white/70"}`}
                    />
                  )}
                </button>
              </div>
            );
          })}
        </div>
      </nav>

      <div className="p-4 border-t border-[#E4E4E4] dark:border-[#333333]">
        <div className="text-xs text-black/50 dark:text-white/50 font-inter">
          <p>Demiurge-Cloud</p>
          <p className="mt-1">Powered by Substrate</p>
        </div>
      </div>
    </div>
  );
}
