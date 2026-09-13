"use client";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Settings } from "lucide-react";
import { useState } from "react";
import LotteryScheduleSettings from "./setting";
import NavLabelsSettings from "./nav-labels-settings";

export default function LotterySettingDialog() {
    const [open, setOpen] = useState(false);
    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="w-8 h-8">
                    <Settings />
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl h-[90vh] max-h-[90vh] flex flex-col overflow-hidden">
                <DialogHeader className="shrink-0">
                    <DialogTitle>Settings</DialogTitle>
                    <DialogDescription>Configure lottery schedule, display timing, and navigation tabs.</DialogDescription>
                </DialogHeader>
                <Tabs defaultValue="schedule" className="w-full flex-1 flex flex-col min-h-0">
                    <TabsList className="w-full grid grid-cols-2 mb-4 gap-4 bg-background shrink-0">
                        <TabsTrigger value="schedule" className="border border-border">Lottery Schedule</TabsTrigger>
                        <TabsTrigger value="nav" className="border border-border">Navigation Tabs</TabsTrigger>
                    </TabsList>
                    <TabsContent value="schedule" className="mt-0 flex-1 overflow-y-auto min-h-0 pr-1">
                        <LotteryScheduleSettings />
                    </TabsContent>
                    <TabsContent value="nav" className="mt-0 flex-1 overflow-y-auto min-h-0 pr-1">
                        <NavLabelsSettings />
                    </TabsContent>
                </Tabs>
            </DialogContent>
        </Dialog>
    );
}