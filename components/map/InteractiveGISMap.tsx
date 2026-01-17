"use client";

import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Polyline, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { ZoneId } from "./ZoneSelector";

// Fix for default Leaflet icons in Next.js
const DefaultIcon = L.icon({
    iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
    shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

interface RoadSegment {
    id: string;
    name: string;
    coords: [number, number][];
    density: number;
}

const zoneGPSData: Record<ZoneId, { center: [number, number], zoom: number, roads: RoadSegment[] }> = {
    krungthon: {
        center: [13.7208, 100.5018],
        zoom: 15,
        roads: [
            { id: "kt1", name: "Krung Thon Buri Inbound", coords: [[13.7210, 100.4950], [13.7205, 100.5100]], density: 75 },
            { id: "kt2", name: "Krung Thon Buri Outbound", coords: [[13.7195, 100.5100], [13.7200, 100.4950]], density: 25 },
        ]
    },
    sukhumvit: {
        center: [13.7367, 100.5612],
        zoom: 16,
        roads: [
            { id: "sk1", name: "ถ.สุขุมวิท (ขาออก)", coords: [[13.7320, 100.5500], [13.7367, 100.5612], [13.7400, 100.5700]], density: 95 },
            { id: "sk2", name: "ถ.สุขุมวิท (ขาเข้า)", coords: [[13.7405, 100.5705], [13.7369, 100.5615], [13.7325, 100.5505]], density: 45 },
            { id: "sk3", name: "ถ.อโศกมนตรี", coords: [[13.7450, 100.5630], [13.7367, 100.5612]], density: 88 },
            { id: "sk4", name: "ถ.รัชดาภิเษก", coords: [[13.7367, 100.5612], [13.7250, 100.5580]], density: 72 },
        ]
    },
    sathon: {
        center: [13.7199, 100.5292],
        zoom: 16,
        roads: [
            { id: "st1", name: "ถ.สาทรเหนือ", coords: [[13.7230, 100.5350], [13.7199, 100.5292], [13.7150, 100.5200]], density: 82 },
            { id: "st2", name: "ถ.สาทรใต้", coords: [[13.7155, 100.5205], [13.7202, 100.5295], [13.7235, 100.5355]], density: 38 },
            { id: "st3", name: "ถ.นราธิวาสฯ", coords: [[13.7300, 100.5310], [13.7199, 100.5292], [13.7100, 100.5270]], density: 65 },
        ]
    },
    rama4: {
        center: [13.7233, 100.5422],
        zoom: 16,
        roads: [
            { id: "r4_1", name: "ถ.พระราม 4", coords: [[13.7180, 100.5300], [13.7233, 100.5422], [13.7280, 100.5550]], density: 60 },
            { id: "r4_2", name: "ถ.วิทยุ", coords: [[13.7350, 100.5470], [13.7233, 100.5422]], density: 85 },
            { id: "r4_3", name: "ถ.สาทร (เข้าพระราม 4)", coords: [[13.7199, 100.5292], [13.7233, 100.5422]], density: 40 },
        ]
    }
};

function ChangeView({ center, zoom }: { center: [number, number], zoom: number }) {
    const map = useMap();
    useEffect(() => {
        map.setView(center, zoom);
    }, [center, zoom, map]);
    return null;
}

export default function InteractiveGISMap({ zone = "krungthon" }: { zone?: ZoneId }) {
    const [mounted, setMounted] = useState(false);
    const config = zoneGPSData[zone];

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) return <div className="w-full h-full bg-slate-950 animate-pulse rounded-xl" />;

    const getDensityColor = (density: number) => {
        if (density > 80) return "#ef4444"; // Red
        if (density > 40) return "#eab308"; // Yellow
        return "#22c55e"; // Green
    };

    return (
        <div className="w-full h-full min-h-[500px] relative rounded-xl overflow-hidden border border-white/10 shadow-2xl">
            <MapContainer
                center={config.center}
                zoom={config.zoom}
                style={{ height: "100%", width: "100%", background: "#020617" }}
                zoomControl={false}
            >
                <ChangeView center={config.center} zoom={config.zoom} />

                {/* CartoDB Dark Matter Tiles */}
                <TileLayer
                    url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                />

                {/* Road Polylines with Density Colors */}
                {config.roads.map((road) => (
                    <Polyline
                        key={road.id}
                        positions={road.coords}
                        pathOptions={{
                            color: getDensityColor(road.density),
                            weight: 8,
                            opacity: 0.8,
                            lineCap: "round",
                        }}
                    >
                        <Popup>
                            <div className="text-slate-900 font-bold">
                                <p>{road.name}</p>
                                <p>ระดับความหนาแน่น: {road.density}%</p>
                            </div>
                        </Popup>
                    </Polyline>
                ))}

                {/* Traffic Light simulated marker at center */}
                <Marker position={config.center}>
                    <Popup>
                        <div className="text-slate-900 font-bold">
                            🚦 ระบบสัญญานไฟอัจฉริยะ (AI Control Active)
                        </div>
                    </Popup>
                </Marker>
            </MapContainer>

            {/* Interactive Controls Overlay */}
            <div className="absolute top-4 right-4 z-[1000] flex flex-col gap-2">
                <div className="glass px-3 py-1.5 rounded-lg border-white/10 text-[10px] text-emerald-400 font-mono shadow-xl bg-slate-950/80 backdrop-blur-md">
                    GPS_LOCK_ACTIVE: {config.center[0].toFixed(4)}, {config.center[1].toFixed(4)}
                </div>
            </div>
        </div>
    );
}
