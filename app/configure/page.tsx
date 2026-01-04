'use client';

import { ConfigureComment } from "@/components/configure-comment";
import { ProtectedRoute } from "@/components/protected-route";

export default function ConfigurePage() {
  return (
    <ProtectedRoute>
      <div className="min-h-screen flex flex-col items-center bg-background p-4">
        <div className="w-full max-w-3xl mt-8">
          <ConfigureComment />
        </div>
        
        <footer className="mt-8 text-center text-sm text-muted-foreground">
          Built by AIVS, 2025
        </footer>
      </div>
    </ProtectedRoute>
  );
}
