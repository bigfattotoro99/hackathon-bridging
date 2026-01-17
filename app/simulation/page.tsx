"use client";

import React, { useState, useEffect, useRef } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
    Play, Pause, RefreshCcw, ShieldAlert,
    Navigation, Timer, Activity, Radio,
    ArrowBigUp, ArrowBigLeft, ArrowBigRight
} from "lucide-react";
import Link from "next/link";

interface Car {
    id: number;
    type: "sedan" | "taxi" | "bus" | "suv";
    color: string;
    lane: "horizontal" | "vertical";
    pos: number; // 0 to 100
    speed: number;
    targetSpeed: number;
    isStopping: boolean;
}

const INTERSECTION_CENTER = 50;
const STOP_LINE_OFFSET = 12;

export default function SimulationPage() {
    const [horizontalLight, setHorizontalLight] = useState<"green" | "yellow" | "red">("green");
    const [verticalLight, setVerticalLight] = useState<"green" | "yellow" | "red">("red");
    const [isManual, setIsManual] = useState(false);
    const [cars, setCars] = useState<Car[]>([]);
    const [isPaused, setIsPaused] = useState(false);
    const nextCarId = useRef(0);

    // Simulation Loop
    useEffect(() => {
        if (isPaused) return;

        const interval = setInterval(() => {
            setCars(prevCars => {
                const sortedHorizontal = [...prevCars.filter(c => c.lane === "horizontal")].sort((a, b) => b.pos - a.pos);
                const sortedVertical = [...prevCars.filter(c => c.lane === "vertical")].sort((a, b) => b.pos - a.pos);

                const updateLane = (laneCars: Car[], light: string) => {
                    return laneCars.map((car, idx) => {
                        let nextPos = car.pos + car.speed;
                        let newSpeed = car.speed;

                        // Interaction with light
                        const isNearStopLine = car.pos < INTERSECTION_CENTER - STOP_LINE_OFFSET && nextPos >= INTERSECTION_CENTER - STOP_LINE_OFFSET;
                        const shouldStopAtLight = (light === "red" || (light === "yellow" && car.pos < INTERSECTION_CENTER - 20)) && isNearStopLine;

                        // Interaction with car in front
                        const carInFront = idx > 0 ? laneCars[idx - 1] : null;
                        const distanceToNext = carInFront ? carInFront.pos - car.pos : 1000;
                        const isTooClose = distanceToNext < 8;

                        if (shouldStopAtLight || isTooClose) {
                            newSpeed = Math.max(0, car.speed - 0.05);
                        } else {
                            newSpeed = Math.min(car.targetSpeed, car.speed + 0.02);
                        }

                        return { ...car, pos: car.pos + newSpeed, speed: newSpeed };
                    }).filter(car => car.pos < 120);
                };

                const updatedHorizontal = updateLane(sortedHorizontal, horizontalLight);
                const updatedVertical = updateLane(sortedVertical, verticalLight);

                // Spawn new cars
                if (Math.random() > 0.97 && updatedHorizontal.length < 8) {
                    updatedHorizontal.push({
                        id: nextCarId.current++,
                        type: "sedan",
                        color: ["#ef4444", "#3b82f6", "#10b981", "#ffeb3b"][Math.floor(Math.random() * 4)],
                        lane: "horizontal",
                        pos: -10,
                        speed: 0.3,
                        targetSpeed: 0.4 + Math.random() * 0.2,
                        isStopping: false
                    });
                }
                if (Math.random() > 0.98 && updatedVertical.length < 8) {
                    updatedVertical.push({
                        id: nextCarId.current++,
                        type: "taxi",
                        color: "#ffeb3b",
                        lane: "vertical",
                        pos: -10,
                        speed: 0.3,
                        targetSpeed: 0.4 + Math.random() * 0.2,
                        isStopping: false
                    });
                }

                return [...updatedHorizontal, ...updatedVertical];
            });
        }, 30);

        return () => clearInterval(interval);
    }, [horizontalLight, verticalLight, isPaused]);

    // Auto Light Logic
    useEffect(() => {
        if (isManual || isPaused) return;

        const timer = setInterval(() => {
            setHorizontalLight(prev => {
                if (prev === "green") return "yellow";
                if (prev === "yellow") return "red";
                return "green";
            });
            setVerticalLight(prev => {
                if (prev === "red") return "green";
                if (prev === "green") return "yellow";
                return "red";
            });
        }, 5000);

        return () => clearInterval(timer);
    }, [isManual, isPaused]);

    const toggleManual = () => setIsManual(!isManual);

    const setLightManual = (lane: "h" | "v", color: "green" | "red") => {
        if (!isManual) return;
        if (lane === "h") {
            setHorizontalLight(color);
            setVerticalLight(color === "green" ? "red" : "green");
        } else {
            setVerticalLight(color);
            setHorizontalLight(color === "green" ? "red" : "green");
        }
    };

    return (
        <div className="fixed inset-0 bg-[#020617] text-white flex flex-col overflow-hidden">
            {/* Header Bar */}
            <header className="h-16 border-b border-white/5 bg-slate-900/50 backdrop-blur-xl px-8 flex items-center justify-between z-50">
                <div className="flex items-center gap-4">
                    <Link href="/map" className="p-2 hover:bg-white/5 rounded-full transition-colors">
                        <Navigation className="w-5 h-5 text-sky-400 rotate-[-45deg]" />
                    </Link>
                    <div>
                        <h1 className="text-sm font-black tracking-tighter uppercase">Traffic_Core_Simulation</h1>
                        <p className="text-[10px] text-sky-400/50 font-mono">NODE_PRIMARY_OVERRIDE_ACTIVE</p>
                    </div>
                </div>

                <div className="flex items-center gap-6">
                    <div className="flex flex-col items-end">
                        <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">System_Mode</span>
                        <Badge variant={isManual ? "destructive" : "outline"} className="px-3 py-0 h-5 font-mono text-[9px]">
                            {isManual ? "MANUAL_CONTROL" : "AI_OPTIMIZED"}
                        </Badge>
                    </div>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={toggleManual}
                        className={`border-white/10 ${isManual ? 'bg-red-500/10 text-red-400 border-red-500/50' : 'hover:bg-white/5'}`}
                    >
                        {isManual ? <ShieldAlert className="w-4 h-4 mr-2" /> : <Activity className="w-4 h-4 mr-2" />}
                        {isManual ? "Disable Override" : "Enable Override"}
                    </Button>
                </div>
            </header>

            <main className="flex-1 relative flex">
                {/* Left Control Panel */}
                <aside className="w-80 border-r border-white/5 bg-slate-900/30 p-6 flex flex-col gap-6 z-40">
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h2 className="text-[10px] font-black uppercase text-zinc-500 tracking-widest">Manual_Signals</h2>
                            <Timer className="w-4 h-4 text-zinc-700" />
                        </div>

                        <Card className="bg-black/40 border-white/5 p-4 space-y-4">
                            <div className="space-y-3">
                                <p className="text-[10px] font-bold text-sky-400/70">Horizontal Axis (Main Rd)</p>
                                <div className="grid grid-cols-2 gap-2">
                                    <Button
                                        disabled={!isManual}
                                        onClick={() => setLightManual("h", "green")}
                                        className={`h-10 border-white/5 ${horizontalLight === 'green' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50' : 'bg-transparent text-zinc-500'}`}
                                    >
                                        Green
                                    </Button>
                                    <Button
                                        disabled={!isManual}
                                        onClick={() => setLightManual("h", "red")}
                                        className={`h-10 border-white/5 ${horizontalLight === 'red' ? 'bg-red-500/20 text-red-400 border-red-500/50' : 'bg-transparent text-zinc-500'}`}
                                    >
                                        Red
                                    </Button>
                                </div>
                            </div>

                            <div className="space-y-3 pt-2 border-t border-white/5">
                                <p className="text-[10px] font-bold text-sky-400/70">Vertical Axis (Cross Rd)</p>
                                <div className="grid grid-cols-2 gap-2">
                                    <Button
                                        disabled={!isManual}
                                        onClick={() => setLightManual("v", "green")}
                                        className={`h-10 border-white/5 ${verticalLight === 'green' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50' : 'bg-transparent text-zinc-500'}`}
                                    >
                                        Green
                                    </Button>
                                    <Button
                                        disabled={!isManual}
                                        onClick={() => setLightManual("v", "red")}
                                        className={`h-10 border-white/5 ${verticalLight === 'red' ? 'bg-red-500/20 text-red-400 border-red-500/50' : 'bg-transparent text-zinc-500'}`}
                                    >
                                        Red
                                    </Button>
                                </div>
                            </div>
                        </Card>
                    </div>

                    <div className="mt-auto space-y-4">
                        <div className="bg-emerald-500/5 border border-emerald-500/10 p-4 rounded-xl">
                            <div className="flex items-center gap-2 mb-2">
                                <Radio className="w-3 h-3 text-emerald-500 animate-pulse" />
                                <span className="text-[9px] font-bold text-emerald-500 uppercase">Live_Telemetry</span>
                            </div>
                            <div className="space-y-1 font-mono text-[9px] text-emerald-500/60">
                                <p>CARS_IN_LANE: {cars.length}</p>
                                <p>THROUGHPUT: 1.2s/obj</p>
                                <p>CONGESTION: 12%</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                            <Button variant="outline" size="sm" onClick={() => setIsPaused(!isPaused)} className="border-white/10 hover:bg-white/5">
                                {isPaused ? <Play className="w-4 h-4 mr-2" /> : <Pause className="w-4 h-4 mr-2" />}
                                {isPaused ? "Resume" : "Pause"}
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => setCars([])} className="border-white/10 hover:bg-white/5">
                                <RefreshCcw className="w-4 h-4 mr-2" />
                                Reset
                            </Button>
                        </div>
                    </div>
                </aside>

                {/* Viewport Area */}
                <section className="flex-1 relative bg-[#0a0a0a] overflow-hidden">
                    {/* Asphalt Rendering */}
                    <div className="absolute inset-0 flex items-center justify-center p-12">
                        <svg viewBox="0 0 100 100" className="w-full h-full max-w-[800px] aspect-square">
                            {/* Main Roads */}
                            <rect x="0" y="44" width="100" height="12" fill="#1a1a1a" />
                            <rect x="44" y="0" width="12" height="100" fill="#1a1a1a" />

                            {/* Lane Lines */}
                            <line x1="0" y1="50" x2="100" y2="50" stroke="white" strokeWidth="0.5" strokeDasharray="2 2" opacity="0.2" />
                            <line x1="50" y1="0" x2="50" y2="100" stroke="white" strokeWidth="0.5" strokeDasharray="2 2" opacity="0.2" />

                            {/* Intersection Box */}
                            <rect x="44" y="44" width="12" height="12" fill="#222" />

                            {/* Stop lines */}
                            <line x1="42" y1="44" x2="42" y2="56" stroke="#444" strokeWidth="0.5" />
                            <line x1="58" y1="44" x2="58" y2="56" stroke="#444" strokeWidth="0.5" />
                            <line x1="44" y1="42" x2="56" y2="42" stroke="#444" strokeWidth="0.5" />
                            <line x1="44" y1="58" x2="56" y2="58" stroke="#444" strokeWidth="0.5" />

                            {/* Traffic Lights */}
                            <g>
                                {/* Horizontal Light (South-East) */}
                                <circle cx="62" cy="40" r="2" fill="#222" />
                                <circle cx="62" cy="40" r="1.5" fill={horizontalLight === 'red' ? '#ef4444' : '#111'} className={horizontalLight === 'red' ? 'animate-pulse' : ''} />
                                {/* Vertical Light (North-West) */}
                                <circle cx="38" cy="60" r="2" fill="#222" />
                                <circle cx="38" cy="60" r="1.5" fill={verticalLight === 'red' ? '#ef4444' : '#111'} className={verticalLight === 'red' ? 'animate-pulse' : ''} />
                            </g>

                            {/* Cars - Horizontal Rendering */}
                            {cars.filter(c => c.lane === "horizontal").map(car => (
                                <g key={car.id} style={{ transform: `translateX(${car.pos}px)`, transition: 'transform 30ms linear' }}>
                                    {/* Car Body */}
                                    <rect x="-4" y="45.5" width="6" height="3.5" rx="0.5" fill={car.color} />
                                    {/* Windshield */}
                                    <rect x="-0.5" y="46" width="2" height="2.5" fill="rgba(255,255,255,0.3)" />
                                    {/* Braking lights */}
                                    {car.speed < car.targetSpeed * 0.5 && (
                                        <rect x="-4.2" y="46" width="0.5" height="0.5" fill="red" className="animate-pulse" />
                                    )}
                                </g>
                            ))}

                            {/* Cars - Vertical Rendering */}
                            {cars.filter(c => c.lane === "vertical").map(car => (
                                <g key={car.id} style={{ transform: `translateY(${car.pos}px)`, transition: 'transform 30ms linear' }}>
                                    <rect x="45.5" y="-4" width="3.5" height="6" rx="0.5" fill={car.color} />
                                    <rect x="46" y="-0.5" width="2.5" height="2" fill="rgba(255,255,255,0.3)" />
                                    {car.speed < car.targetSpeed * 0.5 && (
                                        <rect x="46" y="-4.2" width="0.5" height="0.5" fill="red" className="animate-pulse" />
                                    )}
                                </g>
                            ))}
                        </svg>
                    </div>

                    {/* UI Elements */}
                    <div className="absolute top-8 left-8 space-y-2">
                        <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
                            PHASE_LOCKED: {isManual ? 'MANUAL' : 'AUTO'}
                        </Badge>
                        <div className="text-[40px] font-black font-mono tracking-tighter text-white/10 select-none">
                            SIM_ENVIRO_V2
                        </div>
                    </div>

                    <div className="absolute bottom-8 right-8 flex gap-4">
                        <div className="glass p-4 rounded-2xl border border-white/10 flex items-center gap-3">
                            <div className={`h-3 w-3 rounded-full ${horizontalLight === 'green' ? 'bg-emerald-500 shadow-[0_0_10px_#10b981]' : 'bg-zinc-800'}`} />
                            <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Main_Rd</span>
                        </div>
                        <div className="glass p-4 rounded-2xl border border-white/10 flex items-center gap-3">
                            <div className={`h-3 w-3 rounded-full ${verticalLight === 'green' ? 'bg-emerald-500 shadow-[0_0_10px_#10b981]' : 'bg-zinc-800'}`} />
                            <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Cross_Rd</span>
                        </div>
                    </div>
                </section>
            </main>
        </div>
    );
}
