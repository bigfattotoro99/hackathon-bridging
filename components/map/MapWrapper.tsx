"use client";

import { GoogleMap, useJsApiLoader, Polyline, Polygon } from "@react-google-maps/api";
import React, { useState, useCallback } from "react";
import { Loader2 } from "lucide-react";
import { RoadDetailsDialog } from "./RoadDetailsDialog";
import { useTrafficData } from "@/hooks/useTrafficData";
import { WeatherWidget } from "./WeatherWidget";

// Default center (Bangkok)
const containerStyle = {
    width: "100%",
    height: "100%",
    minHeight: "500px",
    borderRadius: "0.75rem",
};

const defaultCenter = {
    lat: 13.7563,
    lng: 100.5018,
};

// Define coverage area (Bangkok CBD approx)
const coverageArea = [
    { lat: 13.7200, lng: 100.4500 }, // SW
    { lat: 13.8000, lng: 100.4500 }, // NW
    { lat: 13.8000, lng: 100.6000 }, // NE
    { lat: 13.7200, lng: 100.6000 }, // SE
];

const libraries: ("places" | "geometry" | "drawing" | "visualization")[] = ["geometry", "visualization"];

export function MapWrapper() {
    const { isLoaded, loadError } = useJsApiLoader({
        id: "google-map-script",
        googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
        libraries,
    });

    const [map, setMap] = useState<google.maps.Map | null>(null);
    const [selectedRoad, setSelectedRoad] = useState<any>(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    const onLoad = useCallback(function callback(map: google.maps.Map) {
        setMap(map);
    }, []);

    const onUnmount = useCallback(function callback(map: google.maps.Map) {
        setMap(null);
    }, []);

    const handleRoadClick = (road: any) => {
        setSelectedRoad(road);
        setIsDialogOpen(true);
    };

    if (loadError) {
        return (
            <div className="w-full h-full min-h-[500px] flex items-center justify-center bg-muted rounded-xl border">
                <p className="text-destructive">เกิดข้อผิดพลาดในการโหลดแผนที่ (Error loading Google Maps)</p>
            </div>
        );
    }

    if (!isLoaded) {
        return (
            <div className="w-full h-full min-h-[500px] flex items-center justify-center bg-muted rounded-xl border">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <>
            <GoogleMap
                mapContainerStyle={containerStyle}
                center={defaultCenter}
                zoom={12}
                onLoad={onLoad}
                onUnmount={onUnmount}
                options={{
                    styles: [
                        {
                            featureType: "poi",
                            elementType: "labels",
                            stylers: [{ visibility: "off" }],
                        }
                    ],
                    disableDefaultUI: false,
                    zoomControl: true,
                }}
            >
                {/* Coverage Area Boundary */}
                <Polygon
                    paths={coverageArea}
                    options={{
                        fillColor: "#3b82f6", // Blue
                        fillOpacity: 0.1,
                        strokeColor: "#3b82f6",
                        strokeOpacity: 0.8,
                        strokeWeight: 2,
                    }}
                />

                <TrafficLayer onRoadClick={handleRoadClick} />
            </GoogleMap>
            <RoadDetailsDialog
                open={isDialogOpen}
                onOpenChange={setIsDialogOpen}
                roadData={selectedRoad}
            />
            <WeatherWidget />
        </>
    );
}

// Internal component for Traffic Overlay
function TrafficLayer({ onRoadClick }: { onRoadClick: (road: any) => void }) {
    const { trafficData } = useTrafficData();

    // Initial static data
    const initialRoads = [
        { id: "1", name: "ถนนสุขุมวิท", density: 85, status: "รถติดขัด", lightStatus: "เขียว", path: [{ lat: 13.75, lng: 100.50 }, { lat: 13.76, lng: 100.52 }] },
        { id: "2", name: "ถนนพระราม 4", density: 20, status: "คล่องตัว", lightStatus: "แดง", path: [{ lat: 13.74, lng: 100.55 }, { lat: 13.74, lng: 100.58 }] },
        { id: "3", name: "ถนนเพชรบุรี", density: 55, status: "ปานกลาง", lightStatus: "เขียว", path: [{ lat: 13.72, lng: 100.52 }, { lat: 13.74, lng: 100.54 }] },
    ];

    // Merge static data with live updates
    const roads = initialRoads.map(road => {
        const update = trafficData?.roads?.find((r: any) => r.id === road.id);
        if (update) {
            // Determine color based on new density
            let color = "#22c55e"; // Green
            let status = "Clear";
            if (update.density > 70) {
                color = "#ef4444"; // Red
                status = "Congested";
            } else if (update.density > 40) {
                color = "#eab308"; // Yellow
                status = "Moderate";
            }
            return { ...road, ...update, color, status };
        }
        // Default colors if no update
        let color = "#22c55e";
        if (road.density > 70) color = "#ef4444";
        else if (road.density > 40) color = "#eab308";
        return { ...road, color };
    });

    return (
        <>
            {roads.map((road, idx) => (
                <Polyline
                    key={idx}
                    path={road.path}
                    options={{
                        strokeColor: road.color,
                        strokeOpacity: 0.9,
                        strokeWeight: 10, // Thicker lines
                        clickable: true
                    }}
                    onClick={() => onRoadClick(road)}
                />
            ))}
        </>
    )
}
