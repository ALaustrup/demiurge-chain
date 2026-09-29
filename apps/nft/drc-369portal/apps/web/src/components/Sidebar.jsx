import { useState } from "react";
import {
  LayoutDashboard,
  Layers,
  Plus,
  ShoppingCart,
  Code,
  Sparkles,
  ChevronDown,
} from "lucide-react";

export default function Sidebar({ onClose, activePage }) {
  const [expandedMenus, setExpandedMenus] = useState({});

  const toggleSubmenu = (item) => {
    setExpandedMenus((prev) => ({
      ...prev,
      [item]: !prev[item],
    }));
  };

  const handleItemClick = (itemName, path, hasSubmenu) => {
    if (!hasSubmenu && path) {
      window.location.href = path;
    }
    if (hasSubmenu) {
      toggleSubmenu(itemName);
    }
    // ... rest of function
  };
}
