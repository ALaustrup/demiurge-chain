import { DeveloperHub } from "@components/systems/DeveloperHub";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Developer Hub | Sophia Portal",
  description: "Build on the Demiurge blockchain with our comprehensive APIs and SDKs",
};

export default function DeveloperPage() {
  return <DeveloperHub />;
}
