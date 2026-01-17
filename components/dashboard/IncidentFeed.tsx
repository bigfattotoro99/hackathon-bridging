"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, CheckCircle2, Siren } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

const incidents = [
    {
        id: 1,
        type: "CRITICAL",
        message: "อุบัติเหตุที่แยกพระราม 9",
        time: "2 นาทีที่แล้ว",
        icon: Siren,
        color: "text-destructive",
    },
    {
        id: 2,
        type: "WARNING",
        message: "รถหนาแน่นบนถนนสุขุมวิท",
        time: "15 นาทีที่แล้ว",
        icon: AlertTriangle,
        color: "text-amber-500",
    },
    {
        id: 3,
        type: "RESOLVED",
        message: "ซ่อมแซมสัญญาณไฟที่อโศกเสร็จสิ้น",
        time: "45 นาทีที่แล้ว",
        icon: CheckCircle2,
        color: "text-green-500",
    },
    {
        id: 4,
        type: "WARNING",
        message: "ฝนตกทัศนวิสัยต่ำในโซน 3",
        time: "1 ชม. ที่แล้ว",
        icon: AlertTriangle,
        color: "text-amber-500",
    },
];

export function IncidentFeed() {
    return (
        <Card className="glass-card h-full">
            <CardHeader>
                <CardTitle className="text-secondary-foreground flex items-center gap-2">
                    <Siren className="h-5 w-5 text-destructive animate-pulse" />
                    แจ้งเตือนเหตุการณ์สด
                </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
                <ScrollArea className="h-[300px] md:h-[350px]">
                    <div className="flex flex-col gap-0">
                        {incidents.map((item) => (
                            <div
                                key={item.id}
                                className="flex items-start gap-4 p-4 hover:bg-muted/50 transition-colors border-b last:border-0 border-border/50"
                            >
                                <div className={`mt-0.5 ${item.color}`}>
                                    <item.icon className="h-5 w-5" />
                                </div>
                                <div className="space-y-1">
                                    <p className="text-sm font-medium leading-none text-foreground">
                                        {item.message}
                                    </p>
                                    <div className="flex items-center gap-2">
                                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${item.type === 'CRITICAL' ? 'bg-destructive/20 border-destructive text-destructive' :
                                            item.type === 'WARNING' ? 'bg-amber-500/20 border-amber-500 text-amber-500' :
                                                'bg-green-500/20 border-green-500 text-green-500'
                                            }`}>
                                            {item.type}
                                        </span>
                                        <span className="text-xs text-muted-foreground">{item.time}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </ScrollArea>
            </CardContent>
        </Card>
    );
}
