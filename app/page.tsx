"use client";

import dynamic from "next/dynamic";

const GlassWorkspace = dynamic(
  () => import("@/components/goorame/goorame-workspace"),
  { ssr: false }
);

export default function Home() {
  return (
    <main className="min-h-screen w-full">
      <GlassWorkspace backgroundImage="/bg.jpg" />
    </main>
  );
}
