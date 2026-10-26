import type { Metadata } from "next";
import { ConfiguratorLoader } from "@/components/start/configurator-loader";

export const metadata: Metadata = {
  title: "Start Your Website",
  description: "Choose a package, configure your website, add extras and check out securely.",
};

export default function StartPage() {
  return <ConfiguratorLoader />;
}
