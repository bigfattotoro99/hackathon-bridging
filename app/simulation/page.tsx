"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { Navigation } from "@/components/navigation/Navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useSettingsStore } from "@/lib/store/settings";
import {
    Play,
    Pause,
    RefreshCcw,
    Zap,
    ArrowUpDown,
    ArrowLeftRight,
    ShieldAlert,
    Activity,
    Timer,
} from "lucide-react";

// --- Types & Constants ---

type Direction = "N" | "S" | "E" | "W";
type LightState = "green" | "yellow" | "red";
type PhaseState = "NS_GREEN" | "NS_YELLOW" | "ALL_RED_1" | "EW_GREEN" | "EW_YELLOW" | "ALL_RED_2";
type VehicleType = "car" | "truck";

interface Vehicle {
    id: string;
    type: VehicleType;
    laneId: string;
    direction: Direction;
    x: number;
    y: number;
    width: number;
    height: number;
    speed: number;
    targetSpeed: number;
    state: "moving" | "stopped";
    hasCrossedIntersection: boolean;
}

const CANVAS_SIZE = 800;
const ROAD_WIDTH = 120;
const LANE_WIDTH = 60;
const CENTER = CANVAS_SIZE / 2;
const STOP_LINE_OFFSET = ROAD_WIDTH / 2 + 10;
const INTERSECTION_MIN = CENTER - ROAD_WIDTH / 2;
const INTERSECTION_MAX = CENTER + ROAD_WIDTH / 2;

const VEHICLE_CONFIGS = {
    car: { width: 40, height: 20 },
    truck: { width: 60, height: 28 },
};

export default function SimulationPage() {
    const { settings } = useSettingsStore();

    const [isPaused, setIsPaused] = useState(false);
    const [isManual, setIsManual] = useState(false);
    const [phase, setPhase] = useState<PhaseState>("NS_GREEN");
    const [timer, setTimer] = useState(settings.greenDuration);
    const [cumulativePassed, setCumulativePassed] = useState(0);

    const canvasRef = useRef<HTMLCanvasElement>(null);
    const vehiclesRef = useRef<Vehicle[]>([]);
    const nextIdRef = useRef(0);
    const requestRef = useRef<number | null>(null);
    const imagesRef = useRef<{ car: HTMLImageElement; truck: HTMLImageElement } | null>(null);

    // --- Map Phase to Lights ---
    const getLights = useCallback(() => {
        const l: Record<Direction, LightState> = { N: "red", S: "red", E: "red", W: "red" };
        switch (phase) {
            case "NS_GREEN": l.N = "green"; l.S = "green"; break;
            case "NS_YELLOW": l.N = "yellow"; l.S = "yellow"; break;
            case "EW_GREEN": l.E = "green"; l.W = "green"; break;
            case "EW_YELLOW": l.E = "yellow"; l.W = "yellow"; break;
            default: break; // ALL_RED
        }
        return l;
    }, [phase]);

    // --- Initialization ---
    useEffect(() => {
        const carImg = new Image(); carImg.src = "/vehicles/car.png";
        const truckImg = new Image(); truckImg.src = "/vehicles/truck.png";
        let loaded = 0;
        const onLoaded = () => { if (++loaded === 2) imagesRef.current = { car: carImg, truck: truckImg }; };
        carImg.onload = onLoaded; truckImg.onload = onLoaded;
        return () => { if (requestRef.current) cancelAnimationFrame(requestRef.current); };
    }, []);

    // --- Simulation Update ---
    const spawnVehicle = useCallback(() => {
        ["N", "S", "E", "W"].forEach((dir) => {
            ["1", "2"].forEach((laneNum) => {
                const laneId = `${dir}${laneNum}`;
                if (Math.random() < settings.spawnRate / 60) {
                    const inLane = vehiclesRef.current.filter(v => v.laneId === laneId);
                    if (inLane.every(v => (dir === "N" ? v.y : dir === "S" ? CANVAS_SIZE - v.y : dir === "E" ? v.x : CANVAS_SIZE - v.x) > 100)) {
                        const type: VehicleType = Math.random() > 0.8 ? "truck" : "car";
                        const config = VEHICLE_CONFIGS[type];
                        let x = 0, y = 0;
                        if (dir === "N") { x = CENTER - ROAD_WIDTH / 2 + (parseInt(laneNum) - 0.5) * LANE_WIDTH; y = -50; }
                        else if (dir === "S") { x = CENTER + ROAD_WIDTH / 2 - (parseInt(laneNum) - 0.5) * LANE_WIDTH; y = CANVAS_SIZE + 50; }
                        else if (dir === "E") { x = -50; y = CENTER + ROAD_WIDTH / 2 - (parseInt(laneNum) - 0.5) * LANE_WIDTH; }
                        else if (dir === "W") { x = CANVAS_SIZE + 50; y = CENTER - ROAD_WIDTH / 2 + (parseInt(laneNum) - 0.5) * LANE_WIDTH; }
                        vehiclesRef.current.push({
                            id: `v-${nextIdRef.current++}`, type, laneId, direction: dir as Direction, x, y,
                            width: config.width, height: config.height, speed: 0, targetSpeed: settings.vehicleSpeed,
                            state: "moving", hasCrossedIntersection: false
                        });
                    }
                }
            });
        });
    }, [settings]);

    const updateSimulation = useCallback(() => {
        if (isPaused) return;
        spawnVehicle();
        const lights = getLights();
        vehiclesRef.current = vehiclesRef.current.map(v => {
            let targetSpeed = v.targetSpeed;
            let shouldStop = false;

            const isApproaching = (v.direction === "N" && v.y < INTERSECTION_MIN - 10) || (v.direction === "S" && v.y > INTERSECTION_MAX + 10) || (v.direction === "E" && v.x < INTERSECTION_MIN - 10) || (v.direction === "W" && v.x > INTERSECTION_MAX + 10);
            const distToLine = v.direction === "N" ? (INTERSECTION_MIN - 10) - (v.y + v.width / 2) : v.direction === "S" ? (v.y - v.width / 2) - (INTERSECTION_MAX + 10) : v.direction === "E" ? (INTERSECTION_MIN - 10) - (v.x + v.width / 2) : (v.x - v.width / 2) - (INTERSECTION_MAX + 10);

            if (isApproaching && !v.hasCrossedIntersection) {
                if (lights[v.direction] === "red" && distToLine < 5) shouldStop = true;
                if (lights[v.direction] === "yellow" && distToLine < 0) { /* Go through if late */ }
                else if (lights[v.direction] === "yellow" && distToLine < 40) shouldStop = true;
            }

            // Collision
            const inFront = vehiclesRef.current.find(o => o.laneId === v.laneId && (v.direction === "N" ? o.y > v.y : v.direction === "S" ? o.y < v.y : v.direction === "E" ? o.x > v.x : o.x < v.x) && Math.abs(v.direction === "N" || v.direction === "S" ? o.y - v.y : o.x - v.x) < 150);
            if (inFront) {
                const gap = v.direction === "N" ? inFront.y - v.y : v.direction === "S" ? v.y - inFront.y : v.direction === "E" ? inFront.x - v.x : v.x - inFront.x;
                const actualGap = gap - (v.width / 2 + inFront.width / 2);
                if (actualGap < settings.minGap) shouldStop = true;
                else if (actualGap < settings.minGap + 20) targetSpeed = Math.min(targetSpeed, (actualGap / (settings.minGap + 20)) * v.targetSpeed);
            }

            if (shouldStop) { v.speed = Math.max(0, v.speed - 0.15); v.state = "stopped"; }
            else { v.speed = v.speed < targetSpeed ? Math.min(targetSpeed, v.speed + 0.05) : Math.max(targetSpeed, v.speed - 0.1); v.state = v.speed > 0.1 ? "moving" : "stopped"; }

            if (v.direction === "N") v.y += v.speed; else if (v.direction === "S") v.y -= v.speed; else if (v.direction === "E") v.x += v.speed; else if (v.direction === "W") v.x -= v.speed;

            if (!v.hasCrossedIntersection) {
                if ((v.direction === "N" && v.y > INTERSECTION_MAX) || (v.direction === "S" && v.y < INTERSECTION_MIN) || (v.direction === "E" && v.x > INTERSECTION_MAX) || (v.direction === "W" && v.x < INTERSECTION_MIN)) {
                    v.hasCrossedIntersection = true; setCumulativePassed(p => p + 1);
                }
            }
            return v;
        }).filter(v => v.x > -100 && v.x < CANVAS_SIZE + 100 && v.y > -100 && v.y < CANVAS_SIZE + 100);
    }, [isPaused, spawnVehicle, getLights, settings]);

    const draw = useCallback((ctx: CanvasRenderingContext2D) => {
        ctx.fillStyle = "#0a0a0c"; ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
        ctx.fillStyle = "#1e1e22"; ctx.fillRect(0, CENTER - ROAD_WIDTH / 2, CANVAS_SIZE, ROAD_WIDTH); ctx.fillRect(CENTER - ROAD_WIDTH / 2, 0, ROAD_WIDTH, CANVAS_SIZE);
        ctx.setLineDash([10, 10]); ctx.strokeStyle = "rgba(255, 255, 255, 0.2)"; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(0, CENTER); ctx.lineTo(CANVAS_SIZE, CENTER); ctx.stroke(); ctx.beginPath(); ctx.moveTo(CENTER, 0); ctx.lineTo(CENTER, CANVAS_SIZE); ctx.stroke();
        ctx.setLineDash([]); ctx.strokeStyle = "#444"; ctx.lineWidth = 4;
        ctx.beginPath(); ctx.moveTo(INTERSECTION_MIN, INTERSECTION_MIN - 10); ctx.lineTo(INTERSECTION_MAX, INTERSECTION_MIN - 10); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(INTERSECTION_MIN, INTERSECTION_MAX + 10); ctx.lineTo(INTERSECTION_MAX, INTERSECTION_MAX + 10); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(INTERSECTION_MIN - 10, INTERSECTION_MIN); ctx.lineTo(INTERSECTION_MIN - 10, INTERSECTION_MAX); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(INTERSECTION_MAX + 10, INTERSECTION_MIN); ctx.lineTo(INTERSECTION_MAX + 10, INTERSECTION_MAX); ctx.stroke();

        const lights = getLights();
        ["N", "S", "E", "W"].forEach(d => {
            let x = 0, y = 0;
            if (d === "N") { x = INTERSECTION_MAX + 20; y = INTERSECTION_MIN - 20; } else if (d === "S") { x = INTERSECTION_MIN - 20; y = INTERSECTION_MAX + 20; } else if (d === "E") { x = INTERSECTION_MIN - 20; y = INTERSECTION_MIN - 20; } else { x = INTERSECTION_MAX + 20; y = INTERSECTION_MAX + 20; }
            ctx.fillStyle = "#111"; ctx.beginPath(); ctx.arc(x, y, 12, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = lights[d as Direction] === "green" ? "#10b981" : lights[d as Direction] === "yellow" ? "#f59e0b" : "#ef4444";
            if (lights[d as Direction] !== "red") { ctx.shadowBlur = 15; ctx.shadowColor = ctx.fillStyle; }
            ctx.beginPath(); ctx.arc(x, y, 8, 0, Math.PI * 2); ctx.fill(); ctx.shadowBlur = 0;
        });

        vehiclesRef.current.forEach(v => {
            ctx.save(); ctx.translate(v.x, v.y); ctx.rotate(v.direction === "N" ? Math.PI / 2 : v.direction === "S" ? -Math.PI / 2 : v.direction === "W" ? Math.PI : 0);
            if (imagesRef.current) ctx.drawImage(imagesRef.current[v.type], -v.width / 2, -v.height / 2, v.width, v.height);
            else { ctx.fillStyle = v.type === "truck" ? "#3b82f6" : "#f59e0b"; ctx.fillRect(-v.width / 2, -v.height / 2, v.width, v.height); }
            if (v.state === "stopped") { ctx.fillStyle = "#ef4444"; ctx.beginPath(); ctx.arc(-v.width / 2, -v.height / 3, 3, 0, Math.PI * 2); ctx.fill(); ctx.beginPath(); ctx.arc(-v.width / 2, v.height / 3, 3, 0, Math.PI * 2); ctx.fill(); }
            ctx.restore();
        });
    }, [getLights]);

    useEffect(() => {
        const loop = () => { const ctx = canvasRef.current?.getContext("2d"); if (ctx) { updateSimulation(); draw(ctx); } requestRef.current = requestAnimationFrame(loop); };
        requestRef.current = requestAnimationFrame(loop); return () => { if (requestRef.current) cancelAnimationFrame(requestRef.current); };
    }, [updateSimulation, draw]);

    // --- Phase Timer ---
    useEffect(() => {
        if (isPaused || isManual) return;
        const interval = setInterval(() => {
            setTimer(t => {
                if (t <= 1) {
                    setPhase(p => {
                        if (p === "NS_GREEN") { setTimer(settings.yellowDuration); return "NS_YELLOW"; }
                        if (p === "NS_YELLOW") { setTimer(1); return "ALL_RED_1"; }
                        if (p === "ALL_RED_1") { setTimer(settings.greenDuration); return "EW_GREEN"; }
                        if (p === "EW_GREEN") { setTimer(settings.yellowDuration); return "EW_YELLOW"; }
                        if (p === "EW_YELLOW") { setTimer(1); return "ALL_RED_2"; }
                        setTimer(settings.greenDuration); return "NS_GREEN";
                    });
                }
                return t - 1;
            });
        }, 1000);
        return () => clearInterval(interval);
    }, [isPaused, isManual, settings]);

    const togglePhase = () => {
        if (!isManual) return;
        setPhase(p => p.startsWith("NS") ? "EW_GREEN" : "NS_GREEN");
        setTimer(settings.greenDuration);
    };

    return (
        <ProtectedRoute>
            <div className="fixed inset-0 bg-[#020617] text-white flex flex-col overflow-hidden">
                <Navigation />
                <main className="flex-1 flex overflow-hidden">
                    <aside className="w-80 border-r border-white/5 bg-slate-950 p-6 flex flex-col gap-6 overflow-y-auto">
                        <div className="flex items-center justify-between">
                            <h2 className="text-[10px] font-black uppercase text-zinc-500 tracking-widest flex items-center gap-2"><ShieldAlert className="w-3 h-3 text-amber-500" /> Control</h2>
                            <Badge variant={isManual ? "destructive" : "outline"} className="text-[9px]">{isManual ? "MANUAL" : "AUTO"}</Badge>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            <Button onClick={() => setIsManual(!isManual)} variant="outline" className={`h-12 ${isManual ? 'bg-amber-500/10 text-amber-500' : ''}`}>{isManual ? <Zap className="w-4 h-4 mr-2" /> : <Activity className="w-4 h-4 mr-2" />} {isManual ? "Auto" : "Manual"}</Button>
                            <Button onClick={() => setIsPaused(!isPaused)} variant="outline" className="h-12">{isPaused ? <Play className="w-4 h-4 mr-2" /> : <Pause className="w-4 h-4 mr-2" />} {isPaused ? "Resume" : "Pause"}</Button>
                        </div>
                        <Card className="bg-black/40 border-white/5 p-4 space-y-4">
                            <div className="flex justify-between items-center"><span className="text-[10px] font-black uppercase text-zinc-500">Current_Status</span><div className="flex items-center gap-2 text-sky-400 font-mono text-xs"><Timer className="w-3 h-3" /> {timer}s</div></div>
                            <div className="space-y-2">
                                <Button disabled={!isManual} onClick={togglePhase} className={`w-full justify-start gap-3 h-12 uppercase ${phase.startsWith("NS") ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : 'text-zinc-600'}`} variant="outline"><ArrowUpDown className="w-4 h-4" /> <div><div className="text-[8px] font-black">PHASE A</div><div className="text-[10px]">NORTH-SOUTH</div></div></Button>
                                <Button disabled={!isManual} onClick={togglePhase} className={`w-full justify-start gap-3 h-12 uppercase ${phase.startsWith("EW") ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : 'text-zinc-600'}`} variant="outline"><ArrowLeftRight className="w-4 h-4" /> <div><div className="text-[8px] font-black">PHASE B</div><div className="text-[10px]">EAST-WEST</div></div></Button>
                            </div>
                        </Card>
                        <div className="p-4 bg-sky-500/5 border border-sky-500/10 rounded-xl space-y-2">
                            <h3 className="text-[9px] font-bold text-sky-400 uppercase tracking-widest">Telemetry</h3>
                            <div className="grid grid-cols-2 gap-4"><div><p className="text-[8px] text-zinc-500 uppercase">Live_Cars</p><p className="text-lg font-black">{vehiclesRef.current.length}</p></div><div><p className="text-[8px] text-zinc-500 uppercase">Passed</p><p className="text-lg font-black">{cumulativePassed}</p></div></div>
                        </div>
                        <Button onClick={() => { vehiclesRef.current = []; setCumulativePassed(0); }} variant="outline" className="mt-auto h-10 border-white/10 text-zinc-500 text-[10px] font-black uppercase tracking-widest"><RefreshCcw className="w-3 h-3 mr-2" /> Reset Session</Button>
                    </aside>
                    <section className="flex-1 relative bg-[#0a0a0c] flex items-center justify-center p-8 overflow-hidden">
                        <div className="relative shadow-2xl border border-white/5 rounded-2xl overflow-hidden aspect-square h-full max-h-[90vh]">
                            <canvas ref={canvasRef} width={CANVAS_SIZE} height={CANVAS_SIZE} className="w-full h-full" />
                            <div className="absolute top-6 left-6 pointer-events-none"><Badge className="bg-emerald-500 text-black font-black text-[10px] tracking-widest px-2 animate-pulse mb-2">LIVE_ASSISTANCE</Badge><h2 className="text-3xl font-black text-white/5 italic select-none">SMART_TRAFFIC_V3.2</h2></div>
                            <div className="absolute bottom-6 right-6 pointer-events-none text-right font-black text-[10px] text-sky-500/50 uppercase tracking-widest">{phase.replace("_", " ")}</div>
                        </div>
                    </section>
                </main>
            </div>
        </ProtectedRoute>
    );
}
