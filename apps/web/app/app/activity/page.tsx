"use client";
import { MainLayout } from "@repo/ui/layout";

export default function PlaceholderPage() {
  return (
    <MainLayout>
      <div className="flex flex-col items-center justify-center h-screen space-y-4">
        <h1 className="text-4xl font-syne font-extrabold tracking-tighter">
          Under Construction
        </h1>
        <p className="text-[#666]">
          We are building the next generation of social learning.
        </p>
      </div>
    </MainLayout>
  );
}
