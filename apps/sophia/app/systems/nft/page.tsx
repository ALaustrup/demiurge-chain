import { NFTPortalSystem } from "@components/systems/NFTPortalSystem";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "NFT Portal | Sophia Portal",
  description: "Browse, mint, and manage your DRC-369 NFT collection",
};

export default function NFTPage() {
  return <NFTPortalSystem />;
}
