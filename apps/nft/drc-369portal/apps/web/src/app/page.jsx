"use client";

import { useEffect } from "react";

export default function Home() {
  useEffect(() => {
    if (typeof window !== "undefined") {
      window.location.href = "/dashboard";
    }
  }, []);

  return (
    <div className="flex items-center justify-center h-screen bg-[#F3F3F3] dark:bg-[#0A0A0A]">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-black dark:text-white font-inter">Loading...</p>
      </div>
    </div>
  );
}
