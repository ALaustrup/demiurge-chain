import { GamesSystem } from "@components/systems/GamesSystem";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Games | Sophia Portal",
  description: "Discover and play blockchain-integrated games in the Demiurge ecosystem",
};

export default function GamesPage() {
  return <GamesSystem />;
}
