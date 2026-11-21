import { createFileRoute } from "@tanstack/react-router";
import StadthausScene from "@/components/Stadthaus";

export const Route = createFileRoute("/")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Stadthaus 3D – Innenräume und Aussenansicht" },
      { name: "description", content: "Stadthaus nach Foto mit möblierten Innenräumen, Treppen zwischen den Geschossen und Kamin auf der hinteren Dachseite." },
      { property: "og:title", content: "Stadthaus 3D – Innenräume und Aussenansicht" },
      { property: "og:description", content: "Stadthaus nach Foto mit Küche, Wohnzimmer, Schlafzimmern, Bad, Keller und Dachstock in 3D." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: StadthausScene,
});
