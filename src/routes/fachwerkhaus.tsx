import { createFileRoute } from "@tanstack/react-router";
import HouseScene from "@/components/House";

export const Route = createFileRoute("/fachwerkhaus")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Gelbes Fachwerkhaus – 3D-Modell" },
      { name: "description", content: "Dreistöckiges gelbes Fachwerkhaus, 12 m hoch, in 3D." },
      { property: "og:title", content: "Gelbes Fachwerkhaus – 3D-Modell" },
      { property: "og:description", content: "Dreistöckiges gelbes Fachwerkhaus, 12 m hoch, in 3D." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: HouseScene,
});
