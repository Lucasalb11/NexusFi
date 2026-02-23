import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "NexusFi — Decentralized Finance",
    short_name: "NexusFi",
    description:
      "A decentralized fintech powered by Stellar and Chainlink CRE",
    start_url: "/dashboard",
    display: "standalone",
    background_color: "#0A0A0F",
    theme_color: "#8B5CF6",
    orientation: "portrait",
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
