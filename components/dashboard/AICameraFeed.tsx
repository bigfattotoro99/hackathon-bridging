"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Scan, User, Car as CarIcon, Video, ShieldCheck } from "lucide-react";
import { ZoneId } from "../map/ZoneSelector";

interface DetectedObject {
    id: number;
    type: "car" | "person" | "taxi" | "bus";
    x: number;
    y: number;
    width: number;
    height: number;
    confidence: number;
    color?: string;
    speed?: number;
}

export function AICameraFeed({ zone = "krungthon" }: { zone?: ZoneId }) {
    const [objects, setObjects] = useState<DetectedObject[]>([]);
    const [counts, setCounts] = useState({ cars: 0, people: 0 });
    const [logs, setLogs] = useState<string[]>(["INIT 0x0... SYSTEM_READY"]);

    useEffect(() => {
        // Animation & Simulation loop
        let lastId = 0;
        const generateObject = () => {
            const rand = Math.random();
            let type: "car" | "person" | "taxi" | "bus" = "car";
            let color = undefined;

            if (rand > 0.8) type = "person";
            else if (rand > 0.6) {
                type = "taxi";
                color = Math.random() > 0.5 ? "#ff69b4" : "#22c55e";
            } else if (rand > 0.55) {
                type = "bus";
            }

            const confidence = Math.round(Math.random() * 10 + 88);
            const direction = Math.random() > 0.5 ? 1 : -1;

            return {
                id: ++lastId,
                type,
                color,
                x: direction > 0 ? -20 : 110, // Start off-screen
                y: Math.random() * 50 + 25,
                width: type === "bus" ? 22 : (type === "car" || type === "taxi" ? 14 : 4),
                height: type === "bus" ? 8 : (type === "car" || type === "taxi" ? 8 : 10),
                confidence,
                speed: (Math.random() * 0.4 + 0.2) * direction,
            };
        };

        // Initialize with some objects
        let activeObjects: DetectedObject[] = [];

        const interval = setInterval(() => {
            // Update positions
            activeObjects = activeObjects
                .map(obj => ({ ...obj, x: obj.x + (obj.speed || 0) }))
                // Filter out those that left the screen
                .filter(obj => obj.x > -30 && obj.x < 130);

            // Periodically add new objects
            if (activeObjects.length < 5 && Math.random() > 0.95) {
                const newObj = generateObject();
                activeObjects.push(newObj);

                // Add log entry
                setLogs(prev => [`[${new Date().toLocaleTimeString()}] DETECTED: ${newObj.type.toUpperCase()} ID:0x${newObj.id.toString(16)}`, ...prev].slice(0, 10));

                // Update counts
                setCounts(prev => ({
                    cars: prev.cars + (newObj.type !== 'person' ? 1 : 0),
                    people: prev.people + (newObj.type === 'person' ? 1 : 0),
                }));
            }

            setObjects([...activeObjects]);
        }, 50); // 20 FPS for smooth motion

        return () => clearInterval(interval);
    }, []);

    return (
        <Card className="glass-card shadow-3xl border-white/5 overflow-hidden group h-full flex flex-col">
            <CardHeader className="pb-3 bg-white/5 border-b border-white/5 shrink-0">
                <CardTitle className="flex justify-between items-center text-[11px] font-bold tracking-widest text-zinc-400 uppercase">
                    <span className="flex items-center gap-2">
                        <Video className="h-3.5 w-3.5 text-emerald-500 animate-pulse" />
                        AI วิเคราะห์กระแสจราจร
                    </span>
                    <Badge variant="outline" className="font-mono text-[8px] border-emerald-500/30 text-emerald-400 py-0 h-5">
                        8K • 60 FPS • LIVE
                    </Badge>
                </CardTitle>
            </CardHeader>
            <CardContent className="p-0 relative">
                <div className="relative aspect-video bg-[#050505] overflow-hidden">
                    {/* Realistic Background - Road Surface */}
                    <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1542361345-89e58247f2d1?q=80&w=3270&auto=format&fit=crop')] bg-cover bg-center grayscale contrast-150 opacity-30"></div>

                    {/* Floating HUD Indicators */}
                    <div className="absolute inset-0 pointer-events-none border border-emerald-500/10 m-2 z-20"></div>
                    <div className="absolute top-2 left-2 text-[8px] font-mono text-emerald-500/40 z-20">FR_INDEX: 489230</div>
                    <div className="absolute bottom-2 left-2 text-[8px] font-mono text-emerald-500/40 z-20">ISO: 400 • 1/120s</div>

                    {/* NEW SMAL HUD AT TOP - As requested */}
                    <div className="absolute top-2 left-1/2 -translate-x-1/2 z-30">
                        <div className="bg-emerald-500/10 backdrop-blur-md text-emerald-400 text-[9px] font-bold px-3 py-1 rounded-full border border-emerald-500/20 flex items-center gap-2 shadow-lg">
                            <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                            ZONE: {zone === 'krungthon' ? 'Krung Thon Buri 01' :
                                zone === 'sukhumvit' ? 'Sukhumvit 21 (Asoke)' :
                                    zone === 'sathon' ? 'Sathon-Naradhiwas' : 'Rama IV Junction'}
                        </div>
                    </div>

                    {/* Detected Objects Overlays */}
                    {objects.map((obj) => (
                        <div
                            key={obj.id}
                            className="absolute flex flex-col items-center justify-center z-10 pointer-events-none"
                            style={{
                                left: `${obj.x}%`,
                                top: `${obj.y}%`,
                                width: `${obj.width}%`,
                                height: `${obj.height}%`,
                                transition: 'none' // Disable CSS transition for smooth frame-by-frame updates
                            }}
                        >
                            <div
                                className="w-full h-full rounded-sm border shadow-[0_0_10px_rgba(16,185,129,0.2)]"
                                style={{
                                    borderColor: obj.type === 'person' ? '#38bdf8' : (obj.color || '#10b981'),
                                    backgroundColor: obj.type === 'person' ? 'rgba(56,189,248,0.05)' : (obj.color ? `${obj.color}10` : 'rgba(16,185,129,0.05)'),
                                    borderWidth: '1.5px'
                                }}
                            >
                                <div className="absolute -top-6 left-1/2 -translate-x-1/2 whitespace-nowrap">
                                    <Badge
                                        className="rounded-md px-1 py-0 text-[8px] font-bold shadow-lg border-0 flex items-center gap-1"
                                        style={{ backgroundColor: obj.type === 'person' ? '#38bdf8' : (obj.color || '#10b981'), color: '#000' }}
                                    >
                                        {obj.type === 'person' ? <User className="h-2.5 w-2.5" /> : (obj.type === 'bus' ? <ShieldCheck className="h-2.5 w-2.5" /> : <CarIcon className="h-2.5 w-2.5" />)}
                                        {obj.confidence}%
                                    </Badge>
                                </div>
                            </div>
                        </div>
                    ))}

                    <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.1)_50%),linear-gradient(90deg,rgba(255,0,0,0.02),rgba(0,255,0,0.01),rgba(0,0,255,0.02))] bg-[size:100%_4px,4px_100%] opacity-10"></div>
                </div>

                {/* AI REAL-TIME DATA LOG (The "Conversion" part) */}
                <div className="h-24 bg-black/80 font-mono text-[9px] p-2 text-emerald-500/60 overflow-hidden leading-[1.3] relative border-t border-white/5">
                    <div className="absolute top-0 right-2 text-[7px] text-zinc-700 font-bold uppercase mt-1">Live_Stream</div>
                    <div className="flex flex-col-reverse gap-0.5 animate-pulse">
                        {logs.map((log, i) => (
                            <p key={i} className={i === 0 ? "text-emerald-400 font-bold" : ""}>{log}</p>
                        ))}
                    </div>
                </div>

                {/* Info Bar */}
                <div className="flex bg-black/40 border-t border-white/5 p-3 justify-between items-center shrink-0">
                    <div className="flex gap-4">
                        <div className="flex flex-col">
                            <span className="text-[9px] text-zinc-500 uppercase font-black tracking-widest leading-none mb-1">TOTAL_SIM</span>
                            <span className="text-lg font-black text-white font-mono leading-none">{(1240 + counts.cars).toLocaleString()}</span>
                        </div>
                    </div>
                    <div className="text-right">
                        <span className="text-[7px] text-emerald-500/60 font-black block mb-1">REALTIME_CONVERSION_ACTIVE</span>
                        <div className="flex gap-0.5 justify-end">
                            {[1, 1, 1, 1, 0.5].map((op, i) => (
                                <div key={i} className="w-1 h-2 bg-emerald-500/80" style={{ opacity: op }}></div>
                            ))}
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
