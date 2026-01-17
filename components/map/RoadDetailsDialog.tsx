"use client"

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { Car, Clock, Zap } from "lucide-react"

interface RoadDetailsDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    roadData: any // Replace with proper Road interface
}

export function RoadDetailsDialog({ open, onOpenChange, roadData }: RoadDetailsDialogProps) {
    if (!roadData) return null

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <div className="flex items-center justify-between">
                        <DialogTitle>{roadData.name || "Road Segment"}</DialogTitle>
                        <Badge variant={roadData.status === 'congested' ? "destructive" : "default"}>
                            {roadData.status?.toUpperCase() || "NORMAL"}
                        </Badge>
                    </div>
                    <DialogDescription>
                        การวิเคราะห์และควบคุมการจราจรแบบเรียลไทม์
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="flex flex-col space-y-1.5 p-4 border rounded-lg bg-muted/50">
                            <span className="text-xs text-muted-foreground flex items-center"><Car className="h-3 w-3 mr-1" /> ความหนาแน่น</span>
                            <span className="text-2xl font-bold">{roadData.density || 0}%</span>
                            <Progress value={roadData.density || 0} className="h-2" />
                        </div>
                        <div className="flex flex-col space-y-1.5 p-4 border rounded-lg bg-muted/50">
                            <span className="text-xs text-muted-foreground flex items-center"><Zap className="h-3 w-3 mr-1" /> สัญญาณไฟ</span>
                            <span className={`text-2xl font-bold ${roadData.lightStatus === 'green' ? 'text-green-500' : 'text-red-500'}`}>
                                {roadData.lightStatus === 'green' ? 'เขียว' : 'แดง'}
                            </span>
                            <span className="text-xs text-muted-foreground">เปลี่ยนใน 15วิ</span>
                        </div>
                    </div>
                    <Separator />
                    <div className="space-y-3">
                        <h4 className="text-sm font-medium">การวิเคราะห์จาก AI</h4>
                        <p className="text-sm text-muted-foreground">
                            การจราจรช้ากว่าปกติเนื่องจากปริมาณรถสะสม AI ได้ขยายเวลาไฟเขียวเพิ่มอีก 15 วินาที
                        </p>
                    </div>
                    <div className="flex justify-end pt-2">
                        <Button variant="outline" className="mr-2">ดูประวัติ</Button>
                        <Button variant="destructive">บังคับไฟแดง</Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
