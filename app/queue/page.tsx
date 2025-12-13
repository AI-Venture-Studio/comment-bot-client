'use client';

import { CampaignProgress } from "@/components/campaign-progress"
import { CampaignQueueTable } from "@/components/campaign-queue-table"

export default function QueuePage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
      <div className="w-full max-w-3xl space-y-6">
        {/* Live Campaign Progress */}
        <CampaignProgress />
        
        {/* Campaign Queue Table */}
        <CampaignQueueTable />
      </div>
      
      <footer className="mt-8 text-center text-sm text-muted-foreground">
        Built by AIVS, 2025
      </footer>
    </div>
  );
}