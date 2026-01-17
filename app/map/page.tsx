"use client";

import { MapWrapper } from "@/components/map/MapWrapper";
import { AICameraFeed } from "@/components/dashboard/AICameraFeed";

export default function MapPage() {
    return (
        <div className="h-[calc(100vh-4rem)] p-4 flex flex-col gap-4">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold tracking-tight">Live Traffic Map (Krung Thon Buri)</h2>
                {/* Legend or actions */}
            </div>
            <div className="flex-1 grid grid-cols-1 lg:grid-cols-4 gap-4 min-h-0">
                <div className="lg:col-span-3 rounded-xl overflow-hidden border shadow-sm relative">
                    <MapWrapper />
                </div>
                <div className="lg:col-span-1 flex flex-col gap-4 overflow-y-auto">
                    <AICameraFeed />
                    {/* Placeholder for future panels */}
                    <div className="bg-muted/30 rounded-lg p-4 border border-dashed flex items-center justify-center text-muted-foreground text-sm">
                        Additional Data Layers
                    </div>
                </div>
            </div>
        </div>
    );
}
