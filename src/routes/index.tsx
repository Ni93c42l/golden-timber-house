import { createFileRoute } from "@tanstack/react-router";
import StadthausScene from "@/components/Stadthaus";

export const Route = createFileRoute("/")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Stadthaus 3D – weiss mit Ocker-Läden" },
      { name: "description", content: "3D-Modell eines klassizistischen Stadthauses mit Ocker-Fensterläden und Gauben." },
      { property: "og:title", content: "Stadthaus 3D – weiss mit Ocker-Läden" },
      { property: "og:description", content: "3D-Modell eines klassizistischen Stadthauses mit Ocker-Fensterläden und Gauben." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: StadthausScene,
});
