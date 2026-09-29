"use client";

import React from "react";
import { SophiaChat } from "@components/SophiaChat";

/**
 * Global Sophia Chat wrapper — renders on every page via the layout.
 * Individual pages can still import SophiaChat directly if they
 * need custom behavior (e.g., Dashboard page).
 */
export const SophiaChatGlobal: React.FC = () => {
  return <SophiaChat position="bottom-right" />;
};

export default SophiaChatGlobal;
