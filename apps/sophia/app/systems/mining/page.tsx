import { MiningSystem } from "@components/systems/MiningSystem";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Mining | Sophia Portal",
  description: "Stake CGT tokens and earn rewards as a network validator",
};

export default function MiningPage() {
  return <MiningSystem />;
}
