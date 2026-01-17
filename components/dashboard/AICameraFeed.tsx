"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Scan, User, Car as CarIcon, Video } from "lucide-react";

interface DetectedObject {
    id: number;
    type: "car" | "person";
    x: number;
    y: number;
    width: number;
    height: number;
    confidence: number;
}

export function AICameraFeed() {
    const [objects, setObjects] = useState<DetectedObject[]>([]);
    const [counts, setCounts] = useState({ cars: 0, people: 0 });

    useEffect(() => {
        // Simulation loop
        const interval = setInterval(() => {
            // Generate random detected objects
            const newObjects: DetectedObject[] = [];
            const objCount = Math.floor(Math.random() * 5) + 2; // 2-6 objects

            let carCount = 0;
            let personCount = 0;

            for (let i = 0; i < objCount; i++) {
                const type = Math.random() > 0.4 ? "car" : "person";
                if (type === "car") carCount++; else personCount++;

                newObjects.push({
                    id: Math.random(),
                    type,
                    x: Math.random() * 80, // % position
                    y: Math.random() * 60 + 20, // Keep mostly lower half
                    width: type === "car" ? 15 : 5,
                    height: type === "car" ? 10 : 12,
                    confidence: Math.round(Math.random() * 15 + 85), // 85-100%
                });
            }

            setObjects(newObjects);
            setCounts(prev => ({
                cars: prev.cars + (Math.random() > 0.7 ? 1 : 0),
                people: prev.people + (Math.random() > 0.8 ? 1 : 0),
            }));

        }, 2000);

        return () => clearInterval(interval);
    }, []);

    return (
        <Card className="glass-card overflow-hidden">
            <CardHeader className="pb-2">
                <CardTitle className="flex justify-between items-center text-lg">
                    <span className="flex items-center gap-2">
                        <Video className="h-5 w-5 text-green-500 animate-pulse" />
                        กล้อง AI ตรวจจับ (ถ.กรุงธนบุรี)
                    </span>
                    <Badge variant="outline" className="font-mono text-xs">LIVE FEED • 30 FPS</Badge>
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="relative aspect-video bg-neutral-900 rounded-lg overflow-hidden border border-white/10">
                    {/* Simulated Camera Background (Gradient or Image could go here) */}
                    <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1542361345-89e58247f2d1?q=80&w=3270&auto=format&fit=crop')] bg-cover bg-center opacity-40"></div>

                    {/* Grid Overlay */}
                    <div className="absolute inset-0 bg-[linear-gradient(rgba(0,255,0,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,255,0,0.03)_1px,transparent_1px)] bg-[size:20px_20px]"></div>

                    {/* Detected Objects Overlays */}
                    {objects.map((obj) => (
                        <div
                            key={obj.id}
                            className="absolute border-2 border-green-500 bg-green-500/10 transition-all duration-500 ease-in-out"
                            style={{
                                left: `${obj.x}%`,
                                top: `${obj.y}%`,
                                width: `${obj.width}%`,
                                height: `${obj.height}%`,
                            }}
                        >
                            <div className="absolute -top-6 left-0 bg-green-500 text-black text-[10px] font-bold px-1 rounded flex items-center gap-1">
                                {obj.type === "car" ? <CarIcon className="h-3 w-3" /> : <User className="h-3 w-3" />}
                                {obj.confidence}%
                            </div>
                            <Scan className="absolute -bottom-2 -right-2 h-4 w-4 text-green-500" />
                        </div>
                    ))}

                    {/* HUD Info */}
                    <div className="absolute top-2 right-2 flex flex-col gap-1 items-end">
                        <div className="bg-black/60 text-white text-xs px-2 py-1 rounded border border-white/20">
                            ZONE: Krung Thon Buri 01
                        </div>
                    </div>
                </div>

                {/* Counters */}
                <div className="grid grid-cols-2 gap-4 mt-4">
                    <div className="bg-muted/30 p-3 rounded-lg flex items-center justify-between border border-white/5">
                        <div className="flex items-center gap-2 text-muted-foreground">
                            <CarIcon className="h-4 w-4" />
                            <span className="text-sm">ยานพาหนะสะสม</span>
                        </div>
                        <span className="text-xl font-bold font-mono">{1240 + counts.cars}</span>
                    </div>
                    <div className="bg-muted/30 p-3 rounded-lg flex items-center justify-between border border-white/5">
                        <div className="flex items-center gap-2 text-muted-foreground">
                            <User className="h-4 w-4" />
                            <span className="text-sm">คนเดินเท้าสะสม</span>
                        </div>
                        <span className="text-xl font-bold font-mono">{340 + counts.people}</span>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
