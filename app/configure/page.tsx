'use client';

import { ConfigureComment } from "@/components/configure-comment";

export default function ConfigurePage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
      <ConfigureComment />
      
      <footer className="mt-8 text-center text-sm text-muted-foreground">
        Built by AIVS, 2025
      </footer>
    </div>
  );
}
