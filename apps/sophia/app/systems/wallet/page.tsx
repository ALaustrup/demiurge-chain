import { WalletSystem } from "@components/systems/WalletSystem";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Wallet | Sophia Portal",
  description: "Manage your CGT tokens and view transaction history",
};

export default function WalletPage() {
  return <WalletSystem />;
}
